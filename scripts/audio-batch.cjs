'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const content=require('../language-journey-content/content.js');
const {kanaOnly}=require('../language-journey-content/audio-foundation.js');
const config=require('../audio/config.json');
const quality=require('../audio/quality-set.json');
const manifestFile=path.join(root,'assets/audio/ja/manifest.js');
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const voiceFingerprint=voice=>hash(voice);
function settingsFor(ref,settings=config){const {entry_overrides,audio_profiles,...base}=settings,profile=audio_profiles?.[ref.audioProfile],override=entry_overrides?.[ref.id];return{...base,...profile,...override,voice_settings:{...base.voice_settings,...profile?.voice_settings,...override?.voice_settings}}}
function generationHash(ref,role,voice,settings=config){return hash({entryId:ref.id,displayText:ref.displayText,readingId:ref.pronunciation.readingId,audioTextKana:ref.pronunciation.audioTextKana,voiceRole:role,voiceFingerprint:voiceFingerprint(voice),settings:settingsFor(ref,settings)})}
function currentHash(ref,asset,settings=config){return hash({entryId:ref.id,displayText:ref.displayText,readingId:ref.pronunciation.readingId,audioTextKana:ref.pronunciation.audioTextKana,voiceRole:asset.voiceRole,voiceFingerprint:asset.voiceFingerprint,settings:settingsFor(ref,settings)})}
function jobsFor(ref,role='A'){
  if(ref.kind==='dialogue')return ref.entry.lines.flatMap(line=>jobsFor(content.audioEntryById[line.sentenceId],line.speakerRole));
  if(!kanaOnly(ref.pronunciation?.audioTextKana))throw new Error('Uitspraak moet eerst gecontroleerd worden: '+ref.id);
  return[{ref,role}];
}
function planJobs(jobs,assets,voices,args={},exists=file=>fs.existsSync(path.join(root,file))){return jobs.map(({ref,role})=>{const old=assets.find(a=>a.entryId===ref.id&&a.readingId===ref.pronunciation.readingId&&a.voiceRole===role),voice=voices[role],generation=voice?generationHash(ref,role,voice):null;return{ref,role,old,generation,action:args.force||args.regenerate?'generate':old&&generation===old.generationHash&&exists(old.path)?'skip':old?'stale':'missing'}})}
function selectJobs(args){
  if(args.voiceRole&&!['A','B','both'].includes(args.voiceRole))throw new Error('Stemrol: A, B of both.');
  if(args.quality&&args.voiceRole)throw new Error('De testset gebruikt haar eigen stemrollen.');
  let selected;
  if(args.quality)selected=quality.items.flatMap(item=>{const ref=content.audioEntryById[item.entryId];if(!ref)throw new Error('Onbekend quality-ID: '+item.entryId);return jobsFor(ref,item.voiceRole||'A')});
  else{
    const ids=args.ids?.split(','),range=args.range?.split('-').map(Number),level=Number(args.level);
    if(!ids&&!args.lesson&&!args.level&&!range)throw new Error('Kies --quality, --ids, --lesson, --level of --range.');
    if(range&&(range.length!==2||!range.every(Number.isInteger)||range[0]>range[1]))throw new Error('Bereik: --range 1-5');
    if(ids)for(const id of ids)if(!content.audioEntryById[id])throw new Error('Onbekend content-ID: '+id);
    selected=content.audioEntries.filter(ref=>ids?ids.includes(ref.id):args.lesson?ref.lessonId===args.lesson:range?ref.level>=range[0]&&ref.level<=range[1]:ref.level===level).filter(ref=>ref.kind==='dialogue'||kanaOnly(ref.pronunciation?.audioTextKana)).flatMap(ref=>ref.kind==='dialogue'?jobsFor(ref):(args.voiceRole==='both'||(!args.voiceRole&&ref.kind==='avatarCelebration')?['A','B']:[args.voiceRole||'A']).flatMap(role=>jobsFor(ref,role)));
  }
  return [...new Map(selected.map(job=>[job.ref.id+'@'+job.role,job])).values()];
}
function replaceManifest(tmp){
  // Windows virus scanners or readers can briefly lock an otherwise valid destination.
  for(let attempt=0;;attempt++){try{fs.renameSync(tmp,manifestFile);return}catch(error){
    if(!['EPERM','EACCES','EBUSY'].includes(error.code)||attempt>=5)throw error;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100);
  }}
}
function writeManifest(manifest){const tmp=manifestFile+'.tmp';fs.writeFileSync(tmp,'(function(root){\n  const manifest='+JSON.stringify(manifest,null,2)+';\n  if(typeof module!=="undefined"&&module.exports)module.exports=manifest;else root.LanguageJourneyAudioManifest=manifest;\n})(typeof globalThis!=="undefined"?globalThis:this);\n');replaceManifest(tmp)}
function parseArgs(argv){const args={};for(let i=0;i<argv.length;i++){if(!argv[i].startsWith('--'))throw new Error('Onbekend argument');const name=argv[i].slice(2);if(['quality','dry-run','force','approve-quality','missing','regenerate'].includes(name))args[name.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=true;else if(['ids','lesson','level','range','reviewer','voice-role'].includes(name)){if(!argv[i+1]||argv[i+1].startsWith('--'))throw new Error('Ontbrekende waarde: --'+name);args[name.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=argv[++i]}else throw new Error('Onbekende optie: --'+name)}return args}
async function requestAudio(ref,role,{env,fetchImpl=fetch}){
  if(!kanaOnly(ref.pronunciation?.audioTextKana))throw new Error('Uitspraak moet eerst gecontroleerd worden: '+ref.id);
  const settings=settingsFor(ref),body={text:ref.pronunciation.audioTextKana,model_id:settings.model_id,voice_settings:settings.voice_settings};
  if(settings.language_code)body.language_code=settings.language_code;
  if(settings.apply_language_text_normalization!==undefined)body.apply_language_text_normalization=settings.apply_language_text_normalization;
  if(settings.previous_text)body.previous_text=settings.previous_text;
  if(settings.next_text)body.next_text=settings.next_text;
  let response;try{response=await fetchImpl('https://api.elevenlabs.io/v1/text-to-speech/'+encodeURIComponent(env['VOICE_'+role+'_ID'])+'?output_format='+settings.output_format,{method:'POST',signal:AbortSignal.timeout(60000),headers:{'xi-api-key':env.ELEVENLABS_API_KEY,'Content-Type':'application/json',Accept:'audio/mpeg'},body:JSON.stringify(body)})}catch{throw new Error('ElevenLabs-netwerkfout voor '+ref.id)}
  if(!response.ok)throw new Error('ElevenLabs HTTP '+response.status+' voor '+ref.id);
  const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length<100)throw new Error('Lege of ongeldige audio voor '+ref.id);return bytes;
}
async function processJobs(jobs,generate,concurrency=1){
  if(![1,2].includes(concurrency))throw new Error('Generatie gebruikt één of twee gelijktijdige verzoeken.');
  let cursor=0,failure;
  const worker=async()=>{while(!failure&&cursor<jobs.length){const job=jobs[cursor++];try{await generate(job)}catch(error){failure=error}}};
  // Wait for in-flight recordings to be saved before surfacing a failure; do not retry paid requests.
  await Promise.all(Array.from({length:concurrency},worker));if(failure)throw failure;
}
function qualityApprovedFor(jobs,qualityJobs,manifest,voices,exists=file=>fs.existsSync(path.join(root,file))){
  const profiles=new Set(jobs.map(j=>j.ref.audioProfile||'default'));
  const scoped=qualityJobs.filter(j=>profiles.has(j.ref.audioProfile||'default'));
  return [qualityJobs,scoped].some(selection=>selection.length&&manifest.qualityGate?.signature===hash(selection.map(({ref,role})=>generationHash(ref,role,voices[role]||'')))&&selection.every(({ref,role})=>manifest.assets.some(a=>a.entryId===ref.id&&a.voiceRole===role&&a.reviewed&&a.generationHash===generationHash(ref,role,voices[role])&&exists(a.path))));
}
async function run(args,{env=process.env,fetchImpl=fetch,log=console.log,concurrency=1}={}){
  const manifest=structuredClone(require(manifestFile)),jobs=selectJobs(args),voices={A:env.VOICE_A_ID,B:env.VOICE_B_ID};
  if(manifest.pipelineVersion!==config.pipelineVersion&&!args.dryRun)throw new Error('Werk manifest.pipelineVersion bij voor een gewijzigde pipeline.');
  const planned=planJobs(jobs,manifest.assets,voices,args);
  if(args.dryRun){log(JSON.stringify({dryRun:true,jobs:planned.map(j=>({entryId:j.ref.id,displayText:j.ref.displayText,audioTextKana:j.ref.pronunciation.audioTextKana,readingId:j.ref.pronunciation.readingId,voiceRole:j.role,action:j.action,voiceConfigured:!!voices[j.role]}))},null,2));return planned}
  for(const {role} of jobs)if(!voices[role])throw new Error('Stel VOICE_'+role+'_ID in via de omgeving.');
  const qualityJobs=selectJobs({quality:true});
  const qualitySignatures=qualityJobs.map(({ref,role})=>generationHash(ref,role,voices[role]||''));
  if(args.approveQuality){
    if(!args.quality||!args.reviewer?.trim())throw new Error('Gebruik --quality --approve-quality --reviewer naam, nadat alle quality-opnamen zijn beluisterd.');
    for(const {ref,role} of qualityJobs){const asset=manifest.assets.find(a=>a.entryId===ref.id&&a.voiceRole===role);if(!asset||asset.generationHash!==generationHash(ref,role,voices[role])||!fs.existsSync(path.join(root,asset.path)))throw new Error('Quality-testset ontbreekt of is verouderd: '+ref.id);asset.reviewed=true}
    manifest.qualityGate={signature:hash(qualitySignatures),reviewer:args.reviewer.trim(),approvedAt:new Date().toISOString(),checks:quality.checks};writeManifest(manifest);log('Quality-testset goedgekeurd.');return;
  }
  const qualityReady=qualityApprovedFor(jobs,qualityJobs,manifest,voices);
  if(!args.quality&&!qualityReady)throw new Error('Genereer en beluister eerst --quality; keur daarna de testset expliciet goed.');
  if(!env.ELEVENLABS_API_KEY)throw new Error('Stel ELEVENLABS_API_KEY in via de omgeving.');
  await processJobs(planned,async job=>{
    if(job.action==='skip'){log('skip '+job.ref.id+' '+job.role);return}
    // Never log request bodies, headers, provider responses or voice IDs.
    const bytes=await requestAudio(job.ref,job.role,{env,fetchImpl});
    const folder=job.ref.kind==='word'?'words':job.ref.kind==='passage'?'passages':job.ref.kind==='kana'?'kana':job.ref.kind==='grammar'?'grammar':'sentences';
    const relative=`assets/audio/ja/${folder}/${hash(job.ref.id).slice(0,16)}-${job.role}-${job.generation.slice(0,16)}.mp3`,file=path.join(root,relative);
    fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',bytes);fs.renameSync(file+'.tmp',file);
    const isQuality=qualityJobs.some(q=>q.ref.id===job.ref.id&&q.role===job.role);
    if(isQuality)delete manifest.qualityGate;
    const asset={entryId:job.ref.id,displayText:job.ref.displayText,readingId:job.ref.pronunciation.readingId,audioTextKana:job.ref.pronunciation.audioTextKana,voiceRole:job.role,voiceFingerprint:voiceFingerprint(voices[job.role]),path:relative,generationHash:job.generation,pipelineVersion:config.pipelineVersion,reviewed:!isQuality,generatedAt:new Date().toISOString()};
    manifest.assets=manifest.assets.filter(a=>!(a.entryId===asset.entryId&&a.readingId===asset.readingId&&a.voiceRole===asset.voiceRole));manifest.assets.push(asset);writeManifest(manifest);log('generated '+job.ref.id+' '+job.role);
  },concurrency);
  log('Gereed. Voer daarna npm run assets:version en npm run audio:audit uit.');
}
if(require.main===module)run(parseArgs(process.argv.slice(2))).catch(error=>{console.error(error.message);process.exitCode=1});
module.exports={hash,generationHash,currentHash,settingsFor,jobsFor,planJobs,selectJobs,parseArgs,requestAudio,processJobs,qualityApprovedFor,run};
