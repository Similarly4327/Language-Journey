'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');
const backlog=require('../scripts/audio-backlog.cjs'),batch=require('../scripts/audio-batch.cjs');
const content=require('../language-journey-content/content.js'),config=require('../audio/config.json'),player=require('../audio/playback.js');
const voices={A:'private-test-voice-A',B:'private-test-voice-B'};
const bytes=Buffer.concat([Buffer.from('ID3'),Buffer.alloc(160)]);
const headers=['Audio ID','Audio tekst kana','Display JP','Prioriteit','Genereren?','Voice key','Output bestand','Generation status','Werkelijke credits','Dialoog ID','Regel','Spreker'];
function definition(id,entryId,{tab='Woorden',priority='P1',selected='JA',status='GEGENEREERD',role='A',kana,display}={}){
  const ref=content.audioEntryById[entryId],folder=tab==='Woorden'?'words':tab==='Zinnen'?'sentences':'dialogues';
  return{tab,id,entryId,values:[id,kana??ref.pronunciation.audioTextKana,display??ref.displayText,priority,selected,tab==='Dialogen'?role==='A'?'LEAD_A':'PARTNER_B':'NARRATOR',`audio/${folder}/${id}.mp3`,status,'',tab==='Dialogen'?'dlg-0001':'',tab==='Dialogen'?Number(id.slice(-2)):'',tab==='Dialogen'?role:'']};
}
function data(definitions=[]){
  return{schemaVersion:1,sheets:{Overzicht:[['Instelling','Waarde'],['Buffer voor retries','3500']],Woorden:[headers,...definitions.filter(d=>d.tab==='Woorden').map(d=>d.values)],Zinnen:[headers,...definitions.filter(d=>d.tab==='Zinnen').map(d=>d.values)],Dialogen:[headers,...definitions.filter(d=>d.tab==='Dialogen').map(d=>d.values)],Stemmen:[['Voice key','ElevenLabs voice ID'],['NARRATOR',''],['LEAD_A',''],['PARTNER_B','']],Codex:[['Regel','Instructie'],['TTS','Kana only']]}};
}
const mapping=defs=>backlog.bindings({bindings:defs.map(d=>({audioId:d.id,entryId:d.entryId}))});
function temporary(t){
  const parent=path.resolve(__dirname,'../output/audio-backlog-tests');fs.mkdirSync(parent,{recursive:true});
  const base=fs.mkdtempSync(path.join(parent,'lj-audio-backlog-'));
  t.after(()=>{const resolved=path.resolve(base);assert.equal(path.dirname(resolved),parent);assert.match(path.basename(resolved),/^lj-audio-backlog-/);fs.rmSync(resolved,{recursive:true,force:true})});return base;
}
function put(base,relative,body=bytes){const file=path.join(base,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,body);return file}
function asset(entryId,role='A'){
  const ref=content.audioEntryById[entryId];
  return{entryId,displayText:ref.displayText,readingId:ref.pronunciation.readingId,audioTextKana:ref.pronunciation.audioTextKana,voiceRole:role,voiceFingerprint:batch.hash(voices[role]),generationHash:batch.generationHash(ref,role,voices[role]),pipelineVersion:config.pipelineVersion,reviewed:true,path:`assets/audio/ja/fixture/${batch.hash(entryId+role)}.mp3`};
}
function approved(base){
  const jobs=batch.selectJobs({quality:true}),assets=jobs.map(job=>asset(job.ref.id,job.role));
  for(const a of assets)put(base,a.path);
  return{pipelineVersion:config.pipelineVersion,assets,qualityGate:{signature:batch.hash(jobs.map(job=>batch.generationHash(job.ref,job.role,voices[job.role])))}};
}
function receipt(d){const a=asset(d.entryId,d.values[11]||'A');return{audioId:d.id,entryId:d.entryId,voiceRole:a.voiceRole,voiceFingerprint:a.voiceFingerprint,generationHash:a.generationHash,sha256:backlog.sha256(bytes),actualCredits:2,generatedAt:'2026-10-31T15:00:00Z'}}

test('local planning honors JA, priority order, explicit P3 and a 3500-credit floor without network or secrets',()=>{
  const defs=[definition('w-0001','vocab-ほん',{priority:'P3'}),definition('w-0002','vocab-みず',{priority:'P2'}),definition('w-0003','vocab-パン'),definition('w-0004','vocab-えき',{selected:'NEE'})],book=backlog.workbook(data(defs)),manifest={assets:[]};
  const plan=backlog.plan(book,mapping(defs),{voices,balance:3505,creditFactor:1,manifest});
  assert.deepEqual(plan.rows.map(row=>row.action),['pending','not-selected','pending','p3-held']);
  assert.equal(plan.estimatedCredits,4);assert.equal(plan.reserve,3500);assert.equal(plan.estimatedRemaining,3501);
  const extra=backlog.plan(book,mapping(defs),{voices,balance:3505,creditFactor:1,manifest,includeP3:true});
  assert.equal(extra.rows.at(-1).action,'budget-held');assert.equal(extra.estimatedRemaining,3501);
  assert.throws(()=>backlog.plan(book,mapping(defs),{voices,balance:35000,creditFactor:1,reserve:3499,manifest}),/3500/);
  assert.throws(()=>backlog.plan(book,mapping(defs),{voices,creditFactor:1,manifest}),/actuele/);
  assert.ok(!JSON.stringify(plan).includes('private-test'));
  assert.throws(()=>backlog.parseArgs(['generate','--all']),/niet beschikbaar/);
});

test('inspection never auto-binds matching text or accepts digits, mismatched kana, display or unknown canon',()=>{
  const defs=[definition('w-0001','vocab-パン'),definition('w-0002','vocab-みず',{kana:'100えん'}),definition('w-0003','vocab-ねこ',{kana:'いぬ'}),definition('w-0004','vocab-えき',{display:'駅'})],book=backlog.workbook(data(defs));
  const discovered=backlog.inspect(book,new Map(),{voices});
  assert.equal(discovered.rows[0].action,'unmapped');assert.deepEqual(discovered.rows[0].exactCandidates,['vocab-パン']);
  const result=backlog.assess(book,mapping(defs),{voices});
  assert.deepEqual(result.map(row=>row.reason),[null,'invalid-kana','reading-mismatch','display-mismatch']);
  assert.equal(backlog.assess(book,new Map([['w-0001','future-candidate']]),{voices})[0].reason,'unknown-canonical-id');
  assert.equal(content.audioEntryById['w-0001'],undefined);
});

test('local import installs only canonical recordings, preserves stable sheet IDs and reuses originals on retry',t=>{
  const base=temporary(t),sourceRoot=path.join(base,'source');fs.mkdirSync(sourceRoot);
  const defs=[definition('w-0001','vocab-パン'),definition('w-0002','vocab-みず',{status:'NIET_GEGENEREERD'}),definition('w-0003','vocab-ねこ',{selected:'NEE'})],book=backlog.workbook(data(defs));
  put(sourceRoot,defs[0].values[6]);const manifest=approved(base),before=JSON.stringify(content.manifest),old=JSON.stringify(manifest);
  const result=backlog.importAssets(book,mapping(defs),{voices,base,assetsRoot:sourceRoot,manifest,receipts:{assets:[receipt(defs[0])]},reviewer:'Test reviewer'});
  assert.equal(result.imported,1);assert.equal(JSON.stringify(manifest),old);assert.equal(JSON.stringify(content.manifest),before);
  const file=path.join(base,'assets/audio/ja/manifest.js'),saved=require(file),added=saved.assets.find(a=>a.backlogAudioId==='w-0001');
  assert.equal(added.entryId,'vocab-パン');assert.equal(added.path,'assets/audio/ja/backlog/words/w-0001.mp3');assert.equal(added.backlogOutput,'audio/words/w-0001.mp3');
  assert.ok(player.resolve(content,saved,'vocab-パン'));assert.equal(player.resolve(content,saved,'w-0001'),null);
  const original=fs.readFileSync(file),rerun=backlog.importAssets(book,mapping(defs),{voices,base,assetsRoot:sourceRoot,manifest:saved,receipts:{assets:[]},reviewer:'Test reviewer'});
  assert.equal(rerun.imported,0);assert.equal(rerun.reused,1);assert.deepEqual(fs.readFileSync(file),original);
});

test('import preflights file/reading/voice proofs and quality gate, and never replaces stale assets',t=>{
  const base=temporary(t),sourceRoot=path.join(base,'source');fs.mkdirSync(sourceRoot);
  const defs=[definition('w-0001','vocab-パン')],book=backlog.workbook(data(defs));put(sourceRoot,defs[0].values[6]);
  const options={voices,base,assetsRoot:sourceRoot,manifest:approved(base),reviewer:'Test',receipts:{assets:[receipt(defs[0])]}};
  for(const patch of [{sha256:'0'.repeat(64)},{generationHash:'old'},{voiceFingerprint:'old'},{voiceRole:'B'},{entryId:'vocab-いぬ'},{actualCredits:-1}]){
    assert.throws(()=>backlog.importAssets(book,mapping(defs),{...options,receipts:{assets:[{...receipt(defs[0]),...patch}]}}),/bewijs|hash/);
    assert.ok(!fs.existsSync(path.join(base,'assets/audio/ja/manifest.js')));
  }
  assert.throws(()=>backlog.importAssets(book,mapping(defs),{...options,reviewer:''}),/reviewer/);
  assert.throws(()=>backlog.importAssets(book,mapping(defs),{...options,manifest:{pipelineVersion:config.pipelineVersion,assets:[]}}),/kwaliteitstest/);
  const stale={...asset('vocab-パン'),generationHash:'stale'};
  assert.throws(()=>backlog.importAssets(book,mapping(defs),{...options,manifest:{...options.manifest,assets:[...options.manifest.assets,stale]}}),/niet vervangen/);
});

test('two canonical utterances retain A/B voice roles; candidates do not create new dialogue blocks',t=>{
  const base=temporary(t),sourceRoot=path.join(base,'source');fs.mkdirSync(sourceRoot);
  const candidates=content.audioEntries.filter(ref=>ref.kind==='sentence'&&ref.pronunciation?.status==='specified'&&!batch.selectJobs({quality:true}).some(job=>job.ref.id===ref.id));
  const defs=[definition('dlg-0001-01',candidates[0].id,{tab:'Dialogen',role:'A'}),definition('dlg-0001-02',candidates[1].id,{tab:'Dialogen',role:'B'})],book=backlog.workbook(data(defs)),before=JSON.stringify(content.manifest.dialogueBlocks);
  for(const d of defs)put(sourceRoot,d.values[6]);
  assert.equal(backlog.assess(book,mapping(defs),{voices:{A:'same',B:'same'}})[0].reason,'dialogue-needs-distinct-voices');
  const result=backlog.importAssets(book,mapping(defs),{voices,base,assetsRoot:sourceRoot,manifest:approved(base),receipts:{assets:defs.map(receipt)},reviewer:'Test'});
  assert.equal(result.imported,2);const saved=require(path.join(base,'assets/audio/ja/manifest.js'));
  assert.deepEqual(saved.assets.filter(a=>a.backlogAudioId).map(a=>a.voiceRole),['A','B']);
  assert.equal(JSON.stringify(content.manifest.dialogueBlocks),before);assert.equal(content.audioEntryById['dlg-0001'],undefined);
  const canonical={...content,resolveAudioEntry:id=>id==='existing-dialogue'?{id,kind:'dialogue',entry:{lines:defs.map((d,i)=>({sentenceId:d.entryId,speakerRole:i?'B':'A'}))}}:content.resolveAudioEntry(id)};
  assert.deepEqual(player.resolve(canonical,saved,'existing-dialogue').assets.map(a=>a.voiceRole),['A','B']);
});

test('selection deduplicates canonical IDs and planning skips current files without charging them',t=>{
  const base=temporary(t),defs=[definition('w-0001','vocab-パン'),definition('w-0002','vocab-パン')],book=backlog.workbook(data(defs)),current=asset('vocab-パン');put(base,current.path);
  const result=backlog.plan(book,mapping(defs),{voices,base,manifest:{assets:[current]},balance:3500,creditFactor:1});
  assert.deepEqual(result.rows.map(row=>row.action),['reuse-existing','duplicate-recording']);assert.equal(result.estimatedCredits,0);
  const malformed=data(defs);malformed.sheets.Woorden[1][6]='audio/words/../../secret.mp3';assert.throws(()=>backlog.workbook(malformed),/outputpad/);
});

test('CLI JSON export works offline and logs no credentials or voice IDs',t=>{
  const base=temporary(t),defs=[definition('w-0001','vocab-パン')],file=put(base,'backlog.json',JSON.stringify(data(defs))),logs=[];
  const original=global.fetch;global.fetch=()=>{throw Error('Network forbidden')};t.after(()=>{global.fetch=original});
  const result=backlog.run(['inspect','--workbook',file],{env:{VOICE_A_ID:voices.A,VOICE_B_ID:voices.B,ELEVENLABS_API_KEY:'private-api-key'},log:message=>logs.push(message)});
  assert.equal(result.rows[0].action,'unmapped');assert.ok(!logs.join('').includes('private'));
});

// A real ZIP/XLSX fixture checks named tabs, sparse cells and XML text handling.
function zipStored(files){
  const crc=bytes=>{let n=0xffffffff;for(const value of bytes){n^=value;for(let bit=0;bit<8;bit++)n=(n>>>1)^((n&1)?0xedb88320:0)}return(n^0xffffffff)>>>0};
  let offset=0;const bodies=[],directory=[];
  for(const [name,text] of Object.entries(files)){
    const filename=Buffer.from(name),data=Buffer.from(text),header=Buffer.alloc(30),central=Buffer.alloc(46),checksum=crc(data);
    header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt32LE(checksum,14);header.writeUInt32LE(data.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(filename.length,26);
    central.writeUInt32LE(0x02014b50);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt32LE(checksum,16);central.writeUInt32LE(data.length,20);central.writeUInt32LE(data.length,24);central.writeUInt16LE(filename.length,28);central.writeUInt32LE(offset,42);
    bodies.push(header,filename,data);directory.push(central,filename);offset+=header.length+filename.length+data.length;
  }
  const table=Buffer.concat(directory),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(Object.keys(files).length,8);end.writeUInt16LE(Object.keys(files).length,10);end.writeUInt32LE(table.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...bodies,table,end]);
}
test('XLSX adapter reads all six actual tab names locally without an Office or Python dependency',{skip:process.platform!=='win32'},t=>{
  const base=temporary(t),defs=[definition('w-0001','vocab-パン')],input=data(defs),files={};
  const names=Object.keys(input.sheets),escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  files['xl/workbook.xml']='<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+names.map((name,i)=>`<sheet name="${name}" sheetId="${i+1}" r:id="r${i}"/>`).join('')+'</sheets></workbook>';
  files['xl/_rels/workbook.xml.rels']='<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+names.map((name,i)=>`<Relationship Id="r${i}" Target="worksheets/sheet${i}.xml"/>`).join('')+'</Relationships>';
  for(const [i,name] of names.entries())files[`xl/worksheets/sheet${i}.xml`]='<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+input.sheets[name].map((row,r)=>'<row>'+row.map((cell,c)=>cell===''?'':`<c r="${String.fromCharCode(65+c)}${r+1}" t="inlineStr"><is><t>${escape(cell)}</t></is></c>`).join('')+'</row>').join('')+'</sheetData></worksheet>';
  const file=put(base,'backlog.xlsx',zipStored(files)),book=backlog.readWorkbook(file);
  assert.equal(book.rows.length,1);assert.equal(book.rows[0].kana,'パン');assert.equal(book.rows[0].selected,true);
});
