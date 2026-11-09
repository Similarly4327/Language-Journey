'use strict';
// A bounded, separate listening experiment. Never changes production assets or config.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {parseEnv}=require('node:util');
const root=path.resolve(__dirname,'..');
const output=path.join(root,'output','audio-model-comparison-2026-11-09');
const config=require('../audio/config.json');
const samples=[
  {id:'january',text:'いちがつ'},
  {id:'february',text:'にがつ'},
  {id:'short-word',text:'ねこ'},
  {id:'level11-sentence',text:'こたえ お えらびます。',sourceId:'sentence-l11-1-A-compact-3'}
];
const models=['eleven_multilingual_v2','eleven_v4'];
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
function request(model,text,voice){
  return model==='eleven_v4'
    ? {endpoint:'/v1/text-to-dialogue',body:{inputs:[{text,voice_id:voice}],model_id:model,language_code:'ja',seed:1149,apply_text_normalization:'off'}}
    : {endpoint:'/v1/text-to-speech/'+encodeURIComponent(voice),body:{text,model_id:model,voice_settings:config.voice_settings,seed:1149}};
}
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(report){
  const rows=samples.map(sample=>`<section><h2 lang="ja">${escape(sample.text)}</h2>${models.map(model=>{const clip=report.clips.find(c=>c.sampleId===sample.id&&c.model===model);return `<article><strong>${escape(model)}</strong>${clip?.file?`<audio controls preload="none" src="${escape(clip.file)}"></audio>`:`<p>${escape(clip?.error||'Nog niet gegenereerd')}</p>`}</article>`}).join('')}</section>`).join('');
  return `<!doctype html><html lang="nl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LJ — v2/v4 luisterproef</title><style>body{font:17px system-ui;max-width:840px;margin:auto;padding:20px;background:#f6f5ef;color:#23332d}section{background:white;border-radius:16px;padding:18px;margin:18px 0}article{display:grid;gap:8px;margin:18px 0}audio{width:100%}h2{margin-top:0}</style><h1>Japanse audio: v2 en v4</h1><p>Dezelfde stem (Sakura), exact dezelfde kana-brontekst en hetzelfde MP3-formaat. v2 gebruikt de huidige productie-instellingen; v4 gebruikt de nieuwe Dialogue API met expliciet Japans. Geen nabewerking of trimming. Dit is een luisterproef; geen kwaliteitsgoedkeuring.</p><p>Let op de eerste klank, extra klinkers, volledige uitspraak, ritme en verstaanbaarheid. Het model gebruikt per API zijn ondersteunde instellingen; een gedeelde seed garandeert geen gelijke uitvoering.</p>${rows}</html>`;
}
async function main(){
  const generate=process.argv.includes('--generate');
  const local=parseEnv(fs.readFileSync(path.join(root,'.env.elevenlabs.local'),'utf8'));
  const env={...local,...process.env},voice=env.VOICE_A_ID;
  if(!voice||!env.ELEVENLABS_API_KEY)throw new Error('ElevenLabs-configuratie ontbreekt.');
  fs.mkdirSync(output,{recursive:true});
  const reportPath=path.join(output,'report.json');
  const report=fs.existsSync(reportPath)?JSON.parse(fs.readFileSync(reportPath,'utf8')):{date:'2026-11-09',voiceName:'Sakura - Sweet, Gentle',voiceFingerprint:digest(voice),outputFormat:'mp3_44100_128',listeningStatus:'not-reviewed',clips:[]};
  const save=()=>{fs.writeFileSync(reportPath,JSON.stringify(report,null,2));fs.writeFileSync(path.join(output,'index.html'),render(report))};
  if(report.voiceFingerprint!==digest(voice))throw new Error('Stem is gewijzigd; gebruik een nieuwe experimentmap.');
  for(const sample of samples)for(const model of models){
    const {endpoint,body}=request(model,sample.text,voice),signature=digest({endpoint,body});
    const old=report.clips.find(c=>c.signature===signature);
    if(old?.file&&fs.existsSync(path.join(output,old.file))){console.log('skip '+sample.id+' '+model);continue}
    if(old?.error){console.log('previous-error '+sample.id+' '+model);continue}
    if(!generate){console.log('planned '+sample.id+' '+model+' '+[...sample.text].length+' characters');continue}
    const started=Date.now();
    const response=await fetch('https://api.elevenlabs.io'+endpoint+'?output_format=mp3_44100_128',{method:'POST',headers:{'xi-api-key':env.ELEVENLABS_API_KEY,'Content-Type':'application/json',Accept:'audio/mpeg'},body:JSON.stringify(body),signal:AbortSignal.timeout(60000)});
    const clip={sampleId:sample.id,model,text:sample.text,sourceId:sample.sourceId,signature,endpoint:endpoint.includes('text-to-speech')?'/v1/text-to-speech/{voice_id}':endpoint,settings:model==='eleven_v4'?{language_code:'ja',seed:1149,apply_text_normalization:'off'}:{voice_settings:config.voice_settings,seed:1149},generatedAt:new Date().toISOString(),latencyMs:Date.now()-started,status:response.status,characters:[...sample.text].length};
    clip.reportedUsage=Object.fromEntries([...response.headers].filter(([key,value])=>/char|credit|cost/.test(key)&&/^\d+(\.\d+)?$/.test(value)));
    if(response.ok){const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length<100)throw new Error('Ongeldige audio');clip.file=sample.id+'-'+model+'.mp3';clip.bytes=bytes.length;fs.writeFileSync(path.join(output,clip.file),bytes)}
    else{const error=await response.json().catch(()=>({}));clip.error=String(error.detail?.status||'HTTP '+response.status).replace(/[^a-zA-Z0-9 _-]/g,'').slice(0,100)}
    report.clips.push(clip);save();console.log((clip.file?'generated ':'error ')+sample.id+' '+model+' HTTP '+clip.status);
    if(!response.ok)break;
  }
  save();console.log('Report: output/audio-model-comparison-2026-11-09/index.html');
}
if(require.main===module)main().catch(()=>{console.error('Luisterproef onderbroken; opgeslagen resultaten blijven behouden. Geen automatische retry.');process.exitCode=1});
module.exports={request,render,samples,models};
