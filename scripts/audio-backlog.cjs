'use strict';
// Local files only. This module deliberately has no synthesis/network command.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const content=require('../language-journey-content/content.js');
const config=require('../audio/config.json');
const batch=require('./audio-batch.cjs');
const {loadEnvironment}=require('./audio-pipeline.cjs');
const {kanaOnly}=require('../language-journey-content/audio-foundation.js');
const {safePath}=require('../audio/playback.js');
const root=path.resolve(__dirname,'..');
const tabs=['Overzicht','Woorden','Zinnen','Dialogen','Stemmen','Codex'];
const roles={NARRATOR:'A',LEAD_A:'A',PARTNER_B:'B'};
const sha256=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const inside=(base,file)=>file===base||file.startsWith(base+path.sep);
function localFile(base,relative){
  const file=path.resolve(base,relative),realBase=fs.realpathSync(base);
  if(!inside(path.resolve(base),file))throw Error('Bestandspad valt buiten de importmap.');
  let parent=file;
  while(!fs.existsSync(parent))parent=path.dirname(parent);
  if(!inside(realBase,fs.realpathSync(parent)))throw Error('Symlink buiten de importmap.');
  return file;
}
function table(rows,required){
  const start=rows.findIndex(row=>required.every(name=>row.includes(name)));
  if(start<0)throw Error('Ontbrekende backlogkolommen.');
  const headers=rows[start];
  if(required.some(name=>headers.filter(header=>header===name).length!==1))throw Error('Dubbele backlogkolommen.');
  return rows.slice(start+1).filter(row=>row.some(cell=>String(cell??'').trim())).map(row=>Object.fromEntries(headers.filter(Boolean).map(name=>[name,String(row[headers.indexOf(name)]??'').trim()])));
}
function workbook(data){
  if(data.schemaVersion!==1||!tabs.every(name=>Array.isArray(data.sheets?.[name])))throw Error('Verwacht schemaVersion 1 met alle zes backlogtabbladen.');
  const seen=new Set(),rows=[];
  for(const tab of ['Woorden','Zinnen','Dialogen'])for(const row of table(data.sheets[tab],['Audio ID','Audio tekst kana','Genereren?','Generation status','Output bestand','Voice key','Prioriteit','Werkelijke credits'])){
    const id=row['Audio ID'];
    if(!/^(?:w-\d{4}|s-\d{4}|dlg-\d{4}-\d{2})$/.test(id)||seen.has(id))throw Error('Ongeldig of dubbel Audio ID.');
    seen.add(id);
    const folder=tab==='Woorden'?'words':tab==='Zinnen'?'sentences':'dialogues';
    if(row['Output bestand']!==`audio/${folder}/${id}.mp3`)throw Error(`Ongeldig outputpad voor ${id}.`);
    if(!['JA','NEE'].includes(row['Genereren?'])||!['P1','P2','P3'].includes(row.Prioriteit))throw Error(`Ongeldige selectie voor ${id}.`);
    if(!Object.hasOwn(roles,row['Voice key']))throw Error(`Onbekende stemrol voor ${id}.`);
    if(tab==='Dialogen'&&(!/^dlg-\d{4}$/.test(row['Dialoog ID'])||!Number.isInteger(Number(row.Regel))||Number(row.Regel)<1||!['A','B'].includes(row.Spreker)||roles[row['Voice key']]!==row.Spreker||row['Voice key']==='NARRATOR'))throw Error(`Ongeldige dialoogrol voor ${id}.`);
    if(tab!=='Dialogen'&&row['Voice key']!=='NARRATOR')throw Error(`Losse audio verwacht NARRATOR: ${id}.`);
    rows.push({id,tab,priority:row.Prioriteit,selected:row['Genereren?']==='JA',kana:row['Audio tekst kana'],display:row['Display JP']||row['Audio tekst kana'],voiceKey:row['Voice key'],role:roles[row['Voice key']],output:row['Output bestand'],status:row['Generation status'],actualCredits:row['Werkelijke credits'],dialogueId:row['Dialoog ID']||null,line:tab==='Dialogen'?Number(row.Regel):null});
  }
  const voiceRows=table(data.sheets.Stemmen,['Voice key','ElevenLabs voice ID']);
  if(!Object.keys(roles).every(key=>voiceRows.filter(row=>row['Voice key']===key).length===1))throw Error('Stemmen verwacht NARRATOR, LEAD_A en PARTNER_B precies eenmaal.');
  const declaredVoices=Object.fromEntries(voiceRows.map(row=>[row['Voice key'],row['ElevenLabs voice ID']]));
  const reserveRow=data.sheets.Overzicht.find(row=>row[0]==='Buffer voor retries');
  const reserve=reserveRow?Number(reserveRow[1]):3500;
  if(!Number.isFinite(reserve)||reserve<0)throw Error('Ongeldige retrybuffer.');
  return{rows,declaredVoices,reserve:Math.max(3500,reserve)};
}
function readWorkbook(file){
  if(path.extname(file).toLowerCase()==='.xlsx'){
    const result=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','RemoteSigned','-File',path.join(__dirname,'audio-backlog-xlsx.ps1'),'-WorkbookPath',path.resolve(file)],{encoding:'utf8',maxBuffer:16*1024*1024,windowsHide:true});
    if(result.status!==0)throw Error('Excel-export kon niet lokaal gelezen worden; gebruik Windows PowerShell of een schemaVersion 1 JSON-export.');
    return workbook(JSON.parse(result.stdout.replace(/^\uFEFF/,'')));
  }
  return workbook(JSON.parse(fs.readFileSync(file,'utf8')));
}
function bindings(data={bindings:[]}){
  if(!Array.isArray(data.bindings))throw Error('Mapping verwacht een bindings-array.');
  const result=new Map();
  for(const row of data.bindings){
    if(!row||!/^(?:w-\d{4}|s-\d{4}|dlg-\d{4}-\d{2})$/.test(row.audioId||'')||typeof row.entryId!=='string'||!row.entryId.trim()||result.has(row.audioId))throw Error('Ongeldige of dubbele binding.');
    result.set(row.audioId,row.entryId);
  }
  return result;
}
function assess(book,mapping,{includeP3=false,voices={},source=content}={}){
  return book.rows.map(row=>{
    const item={...row,entryId:mapping.get(row.id)||null};
    const reject=reason=>({...item,reason});
    if(!row.selected)return reject('not-selected');
    if(row.priority==='P3'&&!includeP3)return reject('p3-held');
    if(!kanaOnly(row.kana))return reject('invalid-kana');
    const ref=source.audioEntryById[item.entryId];
    if(!ref)return reject(item.entryId?'unknown-canonical-id':'unmapped');
    if(ref.kind==='dialogue'||(row.tab==='Woorden'&&ref.kind!=='word')||(row.tab!=='Woorden'&&ref.kind!=='sentence'))return reject('not-a-canonical-utterance');
    if(ref.pronunciation?.status!=='specified'||!kanaOnly(ref.pronunciation.audioTextKana))return reject('unverified-canonical-reading');
    if(row.kana!==ref.pronunciation.audioTextKana)return reject('reading-mismatch');
    if(row.display!==ref.displayText)return reject('display-mismatch');
    if(!voices[row.role])return reject('voice-not-configured');
    if(book.declaredVoices[row.voiceKey]&&book.declaredVoices[row.voiceKey]!==voices[row.role])return reject('voice-configuration-mismatch');
    if(row.tab==='Dialogen'&&(!voices.A||!voices.B||voices.A===voices.B))return reject('dialogue-needs-distinct-voices');
    return{...item,ref,reason:null,generationHash:batch.generationHash(ref,row.role,voices[row.role]),voiceFingerprint:batch.hash(voices[row.role])};
  });
}
function existing(item,manifest,base=root){
  return manifest.assets.find(asset=>asset.entryId===item.entryId&&asset.voiceRole===item.role&&asset.readingId===item.ref.pronunciation.readingId&&asset.displayText===item.ref.displayText&&asset.audioTextKana===item.ref.pronunciation.audioTextKana&&asset.generationHash===item.generationHash&&asset.pipelineVersion===config.pipelineVersion&&safePath(asset.path)&&fs.existsSync(localFile(base,asset.path)));
}
function publicRow(item,action){
  const result={audioId:item.id,entryId:item.entryId,priority:item.priority,voiceKey:item.voiceKey,voiceRole:item.role,action};
  if(item.ref)Object.assign(result,{audioTextKana:item.ref.pronunciation.audioTextKana,displayText:item.ref.displayText,readingId:item.ref.pronunciation.readingId,generationHash:item.generationHash,voiceFingerprint:item.voiceFingerprint,settings:batch.settingsFor(item.ref),output:item.output});
  return result;
}
function inspect(book,mapping,options={}){
  const rows=assess(book,mapping,options).map(item=>{
    const row=publicRow(item,item.reason||'canonical-match');
    if(item.reason){
      row.sheetAudioTextKana=item.kana;row.sheetDisplay=item.display;
      const ref=(options.source||content).audioEntryById[item.entryId];
      if(ref)Object.assign(row,{canonicalDisplay:ref.displayText,canonicalAudioTextKana:ref.pronunciation?.audioTextKana||null});
    }
    if(item.reason==='unmapped')row.exactCandidates=(options.source||content).audioEntries.filter(ref=>ref.kind===(item.tab==='Woorden'?'word':'sentence')&&ref.displayText===item.display&&ref.pronunciation?.status==='specified'&&ref.pronunciation.audioTextKana===item.kana).map(ref=>ref.id);
    return row;
  });
  return{mode:'inspect',rows,counts:rows.reduce((out,row)=>(out[row.action]=(out[row.action]||0)+1,out),{})};
}
function plan(book,mapping,{balance,creditFactor,reserve=3500,manifest,base=root,...options}){
  if(!Number.isFinite(balance)||balance<0||!Number.isFinite(creditFactor)||creditFactor<=0||!Number.isFinite(reserve)||reserve<3500)throw Error('Planning vereist een actuele --balance, positieve --credit-factor en buffer van minstens 3500.');
  reserve=Math.max(reserve,book.reserve);let estimatedCredits=0,blocked=false;
  const rows=[],seen=new Set();
  for(const item of assess(book,mapping,options).sort((a,b)=>a.priority.localeCompare(b.priority))){
    let action=item.reason;
    const key=`${item.entryId}@${item.role}`;
    if(!action){
      if(seen.has(key))action='duplicate-recording';
      else if(existing(item,manifest,base)){action='reuse-existing';seen.add(key)}
      else{
        const cost=Math.ceil([...item.ref.pronunciation.audioTextKana].length*creditFactor);
        if(blocked||balance-estimatedCredits-cost<reserve){action='budget-held';blocked=true}
        else{action='pending';estimatedCredits+=cost;seen.add(key)}
      }
    }
    rows.push(publicRow(item,action));
  }
  return{mode:'plan',networkCalls:0,balanceProvidedByCaller:balance,reserve,creditFactor,estimatedCredits,estimatedRemaining:balance-estimatedCredits,estimateOnly:true,rows};
}
function mp3Bytes(file){
  const bytes=fs.readFileSync(file);
  if(bytes.length<100||!(bytes.subarray(0,3).toString()==='ID3'||bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0))throw Error('Ongeldig lokaal MP3-bestand.');
  return bytes;
}
function importAssets(book,mapping,{receipts,assetsRoot,manifest,reviewer,base=root,...options}){
  if(!reviewer?.trim())throw Error('Import vereist --reviewer na beluisteren en controle van de koppelingen.');
  if(manifest.pipelineVersion!==config.pipelineVersion)throw Error('Manifest en pipelineversie verschillen.');
  if(!Array.isArray(receipts.assets))throw Error('Ontbrekende lokale generatiebewijzen.');
  const proof=new Map();for(const receipt of receipts.assets){if(!receipt||proof.has(receipt.audioId))throw Error('Dubbel generatiebewijs.');proof.set(receipt.audioId,receipt)}
  const assessed=assess(book,mapping,options),selected=[],rows=[],seen=new Set();
  // Preflight every file/hash before any writes. Repeated imports preserve originals.
  for(const item of assessed.sort((a,b)=>a.priority.localeCompare(b.priority))){
    let action=item.reason;
    if(!action&&item.status!=='GEGENEREERD')action='not-generated';
    const key=`${item.entryId}@${item.role}`;
    if(!action&&seen.has(key))action='duplicate-recording';
    if(!action){
      seen.add(key);
      if(existing(item,manifest,base))action='reuse-existing';
      else{
        const receipt=proof.get(item.id);
        if(!receipt||receipt.entryId!==item.entryId||receipt.voiceRole!==item.role||receipt.generationHash!==item.generationHash||receipt.voiceFingerprint!==item.voiceFingerprint||!Number.isFinite(receipt.actualCredits)||receipt.actualCredits<0||!/^\d{4}-\d\d-\d\dT/.test(receipt.generatedAt||'')||!Number.isFinite(Date.parse(receipt.generatedAt)))throw Error(`Ontbrekend of verouderd generatiebewijs: ${item.id}.`);
        if(item.actualCredits!==''&&Number(item.actualCredits)!==receipt.actualCredits)throw Error(`Werkelijke credits verschillen: ${item.id}.`);
        const sourceFile=localFile(assetsRoot,item.output),bytes=mp3Bytes(sourceFile);
        if(receipt.sha256!==sha256(bytes))throw Error(`Bestandshash verschilt: ${item.id}.`);
        const relative=`assets/audio/ja/backlog/${item.output.slice(6)}`,destination=localFile(base,relative);
        if(manifest.assets.some(asset=>asset.path===relative))throw Error(`Bestaand manifestpad wordt niet hergebruikt: ${item.id}.`);
        if(fs.existsSync(destination)&&sha256(fs.readFileSync(destination))!==receipt.sha256)throw Error(`Bestaand bestand wordt niet overschreven: ${item.id}.`);
        const old=manifest.assets.find(asset=>asset.entryId===item.entryId&&asset.voiceRole===item.role&&asset.readingId===item.ref.pronunciation.readingId);
        if(old)throw Error(`Bestaande canonieke opname wordt niet vervangen: ${item.id}.`);
        selected.push({item,receipt,bytes,relative,destination});action='import';
      }
    }
    rows.push(publicRow(item,action));
  }
  const voices=options.voices||{},qualityJobs=batch.selectJobs({quality:true});
  const nonQuality=selected.filter(({item})=>!qualityJobs.some(job=>job.ref.id===item.entryId&&job.role===item.role));
  if(nonQuality.length&&!batch.qualityApprovedFor(nonQuality.map(({item})=>({ref:item.ref,role:item.role})),qualityJobs,manifest,voices,file=>safePath(file)&&fs.existsSync(localFile(base,file))))throw Error('De bestaande audiokwaliteitstest is niet actueel goedgekeurd voor deze stemmen/instellingen.');
  const next=structuredClone(manifest);
  for(const {item,receipt,bytes,relative,destination} of selected){
    const quality=qualityJobs.some(job=>job.ref.id===item.entryId&&job.role===item.role);
    if(quality)delete next.qualityGate;
    fs.mkdirSync(path.dirname(destination),{recursive:true});
    if(!fs.existsSync(destination))fs.writeFileSync(destination,bytes,{flag:'wx'});
    next.assets.push({entryId:item.entryId,displayText:item.ref.displayText,readingId:item.ref.pronunciation.readingId,audioTextKana:item.ref.pronunciation.audioTextKana,voiceRole:item.role,voiceFingerprint:item.voiceFingerprint,generationHash:item.generationHash,pipelineVersion:config.pipelineVersion,path:relative,reviewed:!quality,reviewer:reviewer.trim(),generatedAt:receipt.generatedAt,backlogAudioId:item.id,backlogOutput:item.output,sha256:receipt.sha256,actualCredits:receipt.actualCredits});
  }
  if(selected.length){
    const file=localFile(base,'assets/audio/ja/manifest.js');fs.mkdirSync(path.dirname(file),{recursive:true});
    fs.writeFileSync(file+'.tmp','(function(root){\n  const manifest='+JSON.stringify(next,null,2)+';\n  if(typeof module!=="undefined"&&module.exports)module.exports=manifest;else root.LanguageJourneyAudioManifest=manifest;\n})(typeof globalThis!=="undefined"?globalThis:this);\n');
    for(let attempt=0;;attempt++){
      try{fs.renameSync(file+'.tmp',file);break}catch(error){
        if(!['EPERM','EACCES','EBUSY'].includes(error.code)||attempt>=5)throw error;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100);
      }
    }
  }
  return{mode:'import',networkCalls:0,imported:selected.length,reused:rows.filter(row=>row.action==='reuse-existing').length,qualityApprovalRequired:selected.filter(({item})=>qualityJobs.some(job=>job.ref.id===item.entryId&&job.role===item.role)).length,rows};
}
function parseArgs(argv){
  const [command,...args]=argv,out={command};
  if(!['inspect','plan','import'].includes(command))throw Error('Commando: inspect, plan of import. Genereren is niet beschikbaar.');
  for(let i=0;i<args.length;i++){
    const key=args[i];
    if(key==='--include-p3'){out.includeP3=true;continue}
    if(!['--workbook','--bindings','--balance','--credit-factor','--reserve','--receipts','--assets-root','--reviewer','--report'].includes(key)||!args[i+1]||args[i+1].startsWith('--'))throw Error('Ongeldige backlogoptie.');
    const name=key.slice(2).replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
    if(Object.hasOwn(out,name))throw Error('Dubbele backlogoptie.');out[name]=args[++i];
  }
  if(!out.workbook)throw Error('Gebruik --workbook met een lokale .xlsx- of JSON-export.');
  for(const name of ['balance','creditFactor','reserve'])if(out[name]!==undefined)out[name]=Number(out[name]);
  return out;
}
function run(argv,{env=loadEnvironment(),log=console.log}={}){
  const args=parseArgs(argv),book=readWorkbook(args.workbook),mapping=bindings(args.bindings?JSON.parse(fs.readFileSync(args.bindings,'utf8')):undefined);
  const voices={A:env.VOICE_A_ID,B:env.VOICE_B_ID};
  const file=path.join(root,'assets/audio/ja/manifest.js');delete require.cache[file];
  const manifest=require(file),options={...args,voices,manifest};
  let report;
  if(args.command==='inspect')report=inspect(book,mapping,options);
  else if(args.command==='plan')report=plan(book,mapping,options);
  else{
    if(!args.bindings||!args.receipts||!args.assetsRoot)throw Error('Import vereist --bindings, --receipts en --assets-root.');
    report=importAssets(book,mapping,{...options,receipts:JSON.parse(fs.readFileSync(args.receipts,'utf8'))});
    if(report.imported){
      delete require.cache[file];
      const audit=require('./audio-audit.cjs').audit(content,require(file));
      if(audit.errors.length)throw Error('Audio-audit na import mislukt; voer npm run audio:audit uit.');
      const version=spawnSync(process.execPath,[path.join(__dirname,'version-client-assets.cjs')],{cwd:root,encoding:'utf8',windowsHide:true});
      if(version.status!==0)throw Error('Werk de clientversie bij met npm run assets:version.');
    }
  }
  if(args.report){fs.mkdirSync(path.dirname(path.resolve(args.report)),{recursive:true});fs.writeFileSync(args.report,JSON.stringify(report,null,2)+'\n')}
  log(JSON.stringify({mode:report.mode,networkCalls:0,imported:report.imported,reused:report.reused,qualityApprovalRequired:report.qualityApprovalRequired,estimateOnly:report.estimateOnly,estimatedCredits:report.estimatedCredits,estimatedRemaining:report.estimatedRemaining,reserve:report.reserve,counts:report.rows.reduce((out,row)=>(out[row.action]=(out[row.action]||0)+1,out),{})},null,2));
  return report;
}
if(require.main===module){try{run(process.argv.slice(2))}catch(error){console.error(error.code?'Lokaal backlogbestand kon niet verwerkt worden.':error instanceof SyntaxError?'Ongeldige JSON-export.':error.message);process.exitCode=1}}
module.exports={workbook,readWorkbook,bindings,assess,inspect,plan,importAssets,parseArgs,run,sha256};
