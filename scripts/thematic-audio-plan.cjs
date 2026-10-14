'use strict';
// Read-only generation plan: no credentials, requests or paid TTS calls.
const fs=require('node:fs'),path=require('node:path');
const content=require('../language-journey-content/content.js'),recordings=require('../assets/audio/ja/manifest.js');
const {currentHash}=require('./audio-batch.cjs');
function plan(){
 const dialogueIds=new Set(content.manifest.dialogueBlocks.filter(b=>b.speakerPolicy==='avatars').flatMap(b=>b.lines.map(l=>l.sentenceId)));
 const refs=content.audioEntries.filter(ref=>ref.kind!=='dialogue'&&((ref.level>=11&&ref.level<=14)||dialogueIds.has(ref.id)));
 const jobs=refs.flatMap(ref=>(dialogueIds.has(ref.id)?['A','B']:['A']).map(voiceRole=>{
  const asset=recordings.assets.find(a=>a.entryId===ref.id&&a.voiceRole===voiceRole),kana=ref.pronunciation?.audioTextKana;
  const action=!kana?'needs-review':!asset?'missing':asset.displayText!==ref.displayText||asset.audioTextKana!==kana||asset.generationHash!==currentHash(ref,asset)?'stale':fs.existsSync(path.resolve(__dirname,'..',asset.path))?'current':'missing-file';
  return{entryId:ref.id,lessonId:ref.lessonId||null,kind:ref.kind,voiceRole,displayText:ref.displayText,audioTextKana:kana,action,regenerate:['stale','missing','missing-file'].includes(action)};
 }));
 return{pipeline:recordings.pipelineVersion,paidRequests:0,summary:Object.fromEntries(['current','stale','missing','missing-file','needs-review'].map(action=>[action,jobs.filter(j=>j.action===action).length])),jobs};
}
module.exports={plan};
if(require.main===module){const report=plan();fs.writeFileSync(path.resolve(__dirname,'../docs/didactic-11-14/audio-regeneration.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.summary))}
