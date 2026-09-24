const fs = require('node:fs');
const path = require('node:path');
const content = require('./content.js');

function validate(manifest = content.manifest, options = {}) {
  const diagnostics=[];
  const add=(severity,code,message,location='curriculum')=>diagnostics.push({severity,code,message,location});
  if(!Number.isInteger(manifest.schemaVersion)||manifest.schemaVersion<1)add('ERROR','SCHEMA_VERSION','schemaVersion must be a positive integer');
  if(typeof manifest.contentVersion!=='string'||!/^\d+\.\d+\.\d+$/.test(manifest.contentVersion))add('ERROR','CONTENT_VERSION','contentVersion must use major.minor.patch');
  const registries={vocabulary:manifest.vocabulary,grammar:manifest.grammar,patterns:manifest.patterns,lessons:manifest.lessons,exercises:manifest.exercises,readings:manifest.readings,bonus:manifest.bonus,kanji:manifest.kanji};
  const maps={};
  for(const [name,items] of Object.entries(registries)) {
    maps[name]=new Map();
    for(const item of items||[]) {
      if(!item.id){add('ERROR','MISSING_ID',`${name} item has no id`,name);continue}
      if(maps[name].has(item.id))add('ERROR','DUPLICATE_ID',`${name} id ${item.id} is repeated`,item.id);
      maps[name].set(item.id,item);
    }
  }
  const order=content.pointOrder;
  const known=(kind,id,at,location,{context=false}={})=>{
    const item=maps[kind].get(id);
    if(!item){add('ERROR','UNKNOWN_REFERENCE',`${kind} ${id} does not exist`,location);return}
    if(item.coreOrContext==='legacy'){add('WARNING','LEGACY_REFERENCE',`${id} is only kept for saved progress`,location);return}
    if(!item.availableFrom&&!item.introducedAt){add('ERROR','NO_INTRODUCTION',`${id} has no curriculum point`,location);return}
    const point=item.availableFrom||item.introducedAt;
    if(at&&order(point)>order(at)&&!context)add('ERROR','FUTURE_KNOWLEDGE',`${id} begins at ${point}, after ${at}`,location);
  };
  const vocabByForm=new Map((manifest.vocabulary||[]).filter(v=>v.coreOrContext!=='legacy').map(v=>[v.japanese,v]));
  const knownKanji=new Set((manifest.kanji||[]).flatMap(k=>[...String(k.character||'')]));
  const seenForms=new Map();
  for(const word of manifest.vocabulary||[]){
    if(seenForms.has(word.japanese)&&seenForms.get(word.japanese)!==word.id)add('ERROR','DUPLICATE_VOCAB_FORM',`${word.japanese} is defined by two IDs`,word.id);
    seenForms.set(word.japanese,word.id);
  }
  const inspectSentence=(text,at,location,contextIds=[])=>{
    for(const char of String(text||'').match(/\p{Script=Han}/gu)||[])if(!knownKanji.has(char))add('WARNING','UNKNOWN_KANJI',`${char} is not registered as introduced writing`,location);
    for(const token of String(text||'').split(/[\s。、！？!?]+/).filter(Boolean)){
      const word=vocabByForm.get(token);
      if(word&&word.introducedAt&&order(word.introducedAt)>order(at)&&!contextIds.includes(word.id))add('ERROR','FUTURE_VOCAB_IN_TEXT',`${token} first appears at ${word.introducedAt}, after ${at}`,location);
    }
  };
  for(const lesson of manifest.lessons||[]) {
    const point=`${lesson.level}-${lesson.order}`;
    if(!manifest.levels.some(l=>l.number===lesson.level))add('ERROR','UNKNOWN_LEVEL',`${lesson.id} refers to level ${lesson.level}`,lesson.id);
    for(const id of lesson.wordIds||[])known('vocabulary',id,point,lesson.id);
    for(const id of lesson.exampleIds||[])known('vocabulary',id,point,lesson.id);
    if(new Set([...(lesson.wordIds||[]),...(lesson.exampleIds||[])]).size!==(lesson.wordIds||[]).length+(lesson.exampleIds||[]).length)add('WARNING','DUPLICATE_LESSON_WORD',`${lesson.id} repeats a vocabulary ID`,lesson.id);
    for(const id of lesson.grammarIds||[])known('grammar',id,point,lesson.id);
    for(const id of lesson.patternIds||[])known('patterns',id,point,lesson.id);
    if(lesson.readingId)known('readings',lesson.readingId,null,lesson.id);
    for(const id of lesson.bonusIds||[])known('bonus',id,null,lesson.id);
    for(const model of lesson.models||[])inspectSentence(model.sentence,point,lesson.id,lesson.contextVocabIds||[]);
    for(const builder of lesson.builders||[])inspectSentence(builder[1],point,lesson.id,lesson.contextVocabIds||[]);
    if(lesson.level===4){
      const text=JSON.stringify([lesson.models,lesson.builders,lesson.check]);
      if(/[\u3400-\u9fffぁぃぅぇぉゃゅょゎっァィゥェォャュョヮッー]/u.test(text))add('ERROR','LEVEL4_SCRIPT','Level 4 contains untaught writing',lesson.id);
    }
  }
  for(const level of manifest.levels||[])for(const id of level.lessonIds||[]) {
    const lesson=maps.lessons.get(id);
    if(!lesson)add('ERROR','UNKNOWN_REFERENCE',`Level ${level.number} names missing lesson ${id}`,`level-${level.number}`);
    else if(lesson.level!==level.number)add('ERROR','LEVEL_MISMATCH',`${id} belongs to level ${lesson.level}`,`level-${level.number}`);
  }
  for(const level of (manifest.levels||[]).filter(l=>l.number>=11&&l.status==='playable')){
    if(level.lessonIds?.length!==5)add('ERROR','FUTURE_LEVEL_STRUCTURE',`Level ${level.number} must have five lessons`,`level-${level.number}`);
    const modules=(manifest.modules||[]).filter(x=>x.level===level.number);
    if(!modules.some(x=>x.name==='A')||!modules.some(x=>x.name==='B'))add('ERROR','FUTURE_LEVEL_STRUCTURE',`Level ${level.number} needs Modules A and B`,`level-${level.number}`);
  }
  for(const module of manifest.modules||[]){
    if(!manifest.levels.some(l=>l.number===module.level))add('ERROR','UNKNOWN_LEVEL',`Module ${module.id} has unknown level ${module.level}`,module.id);
    for(const id of module.lessonIds||[])if(!maps.lessons.has(id))add('ERROR','UNKNOWN_REFERENCE',`Module ${module.id} names missing lesson ${id}`,module.id);
    for(const id of module.readingIds||[])if(!maps.readings.has(id))add('ERROR','UNKNOWN_REFERENCE',`Module ${module.id} names missing reading ${id}`,module.id);
  }
  for(const exercise of manifest.exercises||[]) {
    const lesson=maps.lessons.get(exercise.lessonId);
    if(!lesson){add('ERROR','UNKNOWN_REFERENCE',`Exercise ${exercise.id} has unknown lesson ${exercise.lessonId}`,exercise.id);continue}
    const at=`${lesson.level}-${lesson.order}`;
    for(const id of exercise.requiredVocabIds||[])known('vocabulary',id,at,exercise.id);
    for(const id of exercise.requiredGrammarIds||[])known('grammar',id,at,exercise.id);
    for(const id of exercise.contextVocabIds||[])known('vocabulary',id,at,exercise.id,{context:true});
    inspectSentence(exercise.payload?.[1],at,exercise.id,exercise.contextVocabIds||[]);
    inspectSentence(exercise.payload?.[2],at,exercise.id,exercise.contextVocabIds||[]);
  }
  for(const reading of manifest.readings||[]) {
    const lesson=maps.lessons.get(reading.lessonId);
    if(!lesson){add('ERROR','UNKNOWN_REFERENCE',`Reading ${reading.id} has unknown lesson ${reading.lessonId}`,reading.id);continue}
    if(!['story','micro-story','dialogue','shopping-list','menu','sign','notice'].includes(reading.type))add('ERROR','READING_TYPE',`${reading.type} is unsupported`,reading.id);
    const at=reading.introducedAt||`${lesson.level}-${lesson.order}`;
    for(const id of reading.requiredVocabIds||[])known('vocabulary',id,at,reading.id);
    for(const id of reading.contextVocabIds||[]){
      known('vocabulary',id,at,reading.id,{context:true});
      const intro=(reading.contextIntroductions||[]).find(x=>x.vocabId===id);
      if(!intro?.kana||!intro?.romaji||!intro?.meaning)add('ERROR','CONTEXT_NOT_INTRODUCED',`${id} needs kana, romaji and meaning before this reading`,reading.id);
    }
    inspectSentence(reading.text,at,reading.id,reading.contextVocabIds||[]);
  }
  for(const bonus of manifest.bonus||[]){
    if(!maps.lessons.has(bonus.lessonId))add('ERROR','UNKNOWN_REFERENCE',`Bonus ${bonus.id} has unknown lesson ${bonus.lessonId}`,bonus.id);
    if(bonus.optional!==true)add('ERROR','BONUS_MUST_BE_OPTIONAL',`${bonus.id} must not block core completion`,bonus.id);
  }
  for(const grammar of manifest.grammar||[])for(const id of grammar.dependencies||[])known('grammar',id,grammar.introducedAt,grammar.id);
  for(const pattern of manifest.patterns||[])for(const id of pattern.dependencies||[])known('grammar',id,pattern.introducedAt,pattern.id);
  for(const word of manifest.vocabulary||[]) {
    if(!word.japanese||!word.reading||!word.meanings?.length)add('ERROR','VOCAB_FIELDS',`${word.id} lacks form, reading or meaning`,word.id);
    if(word.kanjiForm&&word.kanjiIntroducedAt&&word.introducedAt&&order(word.kanjiIntroducedAt)<order(word.introducedAt))add('ERROR','KANJI_BEFORE_WORD',`${word.id} kanji predates the word`,word.id);
    if(word.kanjiForm&&!word.kanjiIntroducedAt)add('WARNING','KANJI_UNSCHEDULED',`${word.id} has a kanji form but no teaching point`,word.id);
  }
  const audioIds=new Set();
  for(const asset of manifest.audio?.assets||[]) {
    if(audioIds.has(asset.id))add('ERROR','DUPLICATE_AUDIO',`${asset.id} is duplicated`,asset.id);
    audioIds.add(asset.id);
    if(!manifest.audio.speakers.some(s=>s.id===asset.speakerId))add('ERROR','UNKNOWN_SPEAKER',`${asset.speakerId} is not registered`,asset.id);
    if(!asset.path||path.isAbsolute(asset.path)||asset.path.includes('..'))add('ERROR','AUDIO_PATH',`${asset.id} has unsafe or missing path`,asset.id);
    else if(options.checkFiles!==false&&!fs.existsSync(path.resolve(__dirname,asset.path)))add('WARNING','MISSING_AUDIO_FILE',`${asset.path} is not present`,asset.id);
  }
  for(const item of [...(manifest.vocabulary||[]),...(manifest.readings||[]),...(manifest.bonus||[])])if(item.audioId&&!audioIds.has(item.audioId))add('ERROR','UNKNOWN_AUDIO',`${item.audioId} is not registered`,item.id);
  const noAudio=(manifest.vocabulary||[]).filter(v=>v.coreOrContext==='core'&&!v.audioId).length;
  if(noAudio)add('WARNING','AUDIO_COVERAGE',`${noAudio} core vocabulary items have no optional recorded audio`,'audio');
  const usedVocab=new Set((manifest.lessons||[]).flatMap(l=>[...(l.wordIds||[]),...(l.exampleIds||[])]));
  for(const word of manifest.vocabulary||[])if(word.coreOrContext!=='legacy'&&!usedVocab.has(word.id))add('WARNING','ORPHAN_VOCAB',`${word.id} is not used by a lesson`,word.id);
  const usedGrammar=new Set((manifest.lessons||[]).flatMap(l=>l.grammarIds||[]));
  for(const grammar of manifest.grammar||[])if(!usedGrammar.has(grammar.id))add('WARNING','ORPHAN_GRAMMAR',`${grammar.id} is not referenced by a lesson`,grammar.id);
  const usedPatterns=new Set((manifest.lessons||[]).flatMap(l=>l.patternIds||[]));
  for(const pattern of manifest.patterns||[])if(!usedPatterns.has(pattern.id))add('WARNING','ORPHAN_PATTERN',`${pattern.id} is not referenced by a lesson`,pattern.id);
  const legacy=(manifest.vocabulary||[]).filter(v=>v.coreOrContext==='legacy').length;
  if(legacy)add('INFO','LEGACY_COMPAT',`${legacy} historical words remain addressable for saved mastery`,'vocabulary');
  if(!manifest.kanji?.length)add('INFO','NO_KANJI','Levels 1–10 currently introduce no kanji writing in the central registry','kanji');
  const counts={ERROR:0,WARNING:0,INFO:0};for(const item of diagnostics)counts[item.severity]++;
  return {diagnostics,counts,summary:{levels:manifest.levels.length,lessons:manifest.lessons.length,vocabulary:manifest.vocabulary.length,grammar:manifest.grammar.length,patterns:manifest.patterns.length,exercises:manifest.exercises.length,readings:manifest.readings.length,bonus:manifest.bonus.length,audio:manifest.audio.assets.length}};
}

function format(result){
  const lines=result.diagnostics.map(d=>`${d.severity} ${d.code} [${d.location}] ${d.message}`);
  const s=result.summary,c=result.counts;
  lines.push(`SUMMARY ${s.levels} levels · ${s.lessons} lessons · ${s.vocabulary} vocabulary · ${s.grammar} grammar · ${s.patterns} patterns · ${s.exercises} exercises · ${s.readings} readings · ${s.bonus} bonus · ${s.audio} audio`);
  lines.push(`SUMMARY ${c.ERROR} errors · ${c.WARNING} warnings · ${c.INFO} info`);
  return lines.join('\n');
}
if(require.main===module){const result=validate();console.log(format(result));process.exitCode=result.counts.ERROR?1:0}
module.exports={validate,format};
