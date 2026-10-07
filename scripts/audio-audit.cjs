'use strict';
const fs=require('node:fs'),path=require('node:path');
const content=require('../language-journey-content/content.js'),manifest=require('../assets/audio/ja/manifest.js');
const {currentHash}=require('./audio-batch.cjs');
const {safePath}=require('../audio/playback.js');
const root=path.resolve(__dirname,'..');
function audit(source=content,recordings=manifest,{checkFiles=true}={}){
 const errors=[],warnings=[],seen=new Set(),paths=new Set();
 const entryIds=new Set();for(const ref of source.audioEntries){if(entryIds.has(ref.id))errors.push('duplicate content ID: '+ref.id);entryIds.add(ref.id);if(ref.kind==='dialogue')for(const line of ref.entry.lines){if(!source.audioEntryById[line.sentenceId])errors.push('unknown dialogue line: '+line.sentenceId);if(!['A','B'].includes(line.speakerRole))errors.push('unknown dialogue role: '+line.speakerRole)}}
 for(const lesson of source.manifest.lessons)for(const model of lesson.models||[])if(model.sentenceId&&!source.audioEntryById[model.sentenceId])errors.push('unknown sentence reference: '+model.sentenceId);
 for(const asset of recordings.assets){
  const key=[asset.entryId,asset.readingId,asset.voiceRole].join('@'),ref=source.audioEntryById[asset.entryId];
  if(seen.has(key))errors.push('duplicate asset: '+key);seen.add(key);
  if(!ref?.pronunciation){errors.push('unknown content/reading: '+key);continue}
  if(!ref.pronunciation.audioTextKana){errors.push('missing canonical reading: '+key);continue}
  if(ref.pronunciation.readingId!==asset.readingId)errors.push('unknown reading: '+key);
  if(!safePath(asset.path)){errors.push('unsafe path: '+key);continue}
  if(paths.has(asset.path))errors.push('duplicate path: '+asset.path);paths.add(asset.path);
  if(asset.displayText!==ref.displayText||asset.audioTextKana!==ref.pronunciation.audioTextKana||currentHash(ref,asset)!==asset.generationHash||asset.pipelineVersion!==recordings.pipelineVersion)errors.push('stale asset: '+key);
  if(!['A','B'].includes(asset.voiceRole))errors.push('unknown voice role: '+key);
  if(checkFiles&&!fs.existsSync(path.join(root,asset.path)))errors.push('missing file: '+asset.path);
  if(!asset.reviewed)warnings.push('unreviewed: '+key);
 }
 const contextOnly=source.audioEntries.filter(ref=>ref.pronunciation?.status==='context-only').map(ref=>ref.id);
 const missingReadings=source.audioEntries.filter(ref=>ref.kind!=='dialogue'&&ref.pronunciation?.status!=='context-only'&&!ref.pronunciation?.audioTextKana).map(ref=>ref.id);
 const coverage={};for(const kind of ['word','kana','grammar','sentence','dialogue','passage']){const refs=source.audioEntries.filter(ref=>ref.kind===kind);coverage[kind]={total:refs.length,withReading:refs.filter(ref=>ref.kind==='dialogue'||ref.pronunciation?.audioTextKana).length,withAudio:refs.filter(ref=>require('../audio/playback.js').resolve(source,recordings,ref.id)).length}}
 const orphanFiles=[];if(checkFiles){const walk=dir=>{if(!fs.existsSync(dir))return;for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())walk(file);else if(file.endsWith('.mp3')){const relative=path.relative(root,file).replace(/\\/g,'/');if(!paths.has(relative))orphanFiles.push(relative)}}};walk(path.join(root,'assets/audio/ja'))}
 return{coverage,contextOnly,missingReadings,missingAudio:source.audioEntries.filter(ref=>ref.kind!=='dialogue'&&ref.pronunciation?.audioTextKana&&!require('../audio/playback.js').resolve(source,recordings,ref.id)).map(ref=>ref.id),orphanFiles,errors,warnings};
}
if(require.main===module){const report=audit();console.log(JSON.stringify(report,null,2));if(process.argv.includes('--write')){const dir=path.join(root,'docs/audio-v3');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'audit.json'),JSON.stringify(report,null,2)+'\n')}if(report.errors.length)process.exitCode=1}
module.exports={audit};
