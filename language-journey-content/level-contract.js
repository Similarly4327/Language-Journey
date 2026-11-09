/* Visible course order is independent of the stable IDs used by saved progress. */
(function(root){
  'use strict';
  const rankOrder=[null,'Copper','Silver','Gold','Platinum'];
  const kanaExamId='kana-complete-exam';
  const legacyKanaExams=['mix-exam1','mix-exam2'];
  const normalRank=value=>rankOrder.find(rank=>rank&&rank.toLowerCase()===String(value||'').trim().toLowerCase())||null;

  function makeContracts(content){
    const manifest=content.manifest;
    const byNumber=new Map(manifest.levels.map(level=>[level.number,level]));
    const allLessons=new Map(manifest.lessons.map(lesson=>[lesson.id,lesson]));
    const definitions=[
      {id:'kana-foundation',number:1,internalIndexes:[0,1],title:'Kana Complete',lessonIds:[],examId:kanaExamId,generated:'kana-foundation'},
      {id:'level-3',number:2,internalIndexes:[2],examId:'dak-examA',generated:'dakuten'},
      ...[4,5,6,7].map(number=>({id:`level-${number}`,number:number-1,internalIndexes:[number-1],examId:`l${number}-exam`,sourceNumber:number})),
      {id:'social-intro',number:7,internalIndexes:[6],title:manifest.socialIntro.title,lessonIds:[...manifest.socialIntro.lessonIds],examId:manifest.socialIntro.examId},
      ...manifest.levels.filter(level=>level.number>=8&&level.status==='playable').map(level=>({id:`level-${level.number}`,number:level.number,internalIndexes:[level.number-1],examId:`l${level.number}-exam`,sourceNumber:level.number}))
    ];
    return definitions.map((def,index)=>{
      const level=byNumber.get(def.sourceNumber),lessonIds=def.lessonIds||level?.lessonIds||[];
      const lessons=lessonIds.map(id=>allLessons.get(id)).filter(Boolean);
      const wordIds=[...new Set(lessons.flatMap(lesson=>[...(lesson.wordIds||[]),...(lesson.exampleIds||[])]))];
      const words=wordIds.map(id=>manifest.vocabulary.find(word=>word.id===id)).filter(Boolean);
      const kanjiIntroductions=(manifest.vocabulary||[]).filter(word=>word.kanjiForm&&String(word.kanjiIntroducedAt||'').startsWith(`${def.sourceNumber}-`)).map(word=>{
        const order=Number(String(word.kanjiIntroducedAt).split('-')[1]),lesson=lessons.find(item=>item.order===order);
        return{id:word.id,form:word.kanjiForm,point:word.kanjiIntroducedAt,lessonId:lesson?.id||null};
      }).filter(item=>item.lessonId);
      const kanjiTargets=lessons.flatMap(lesson=>(lesson.didactics?.microblocks||[]).flatMap(block=>(block.kanjiWordIds||[]).map(id=>({id,lessonId:lesson.id,block:block.key,exerciseId:block.kanjiRecognition?.wordId===id?block.kanjiRecognition.sourceId:null}))));
      const generatedLessons=def.generated==='kana-foundation'?
        ['hiragana','katakana'].flatMap(script=>content.rowNames.map((name,row)=>({id:`${script}-row-${row}`,title:name,script,characters:content[script==='hiragana'?'hira':'kata'][row].map(item=>item[0])}))).concat(content.numberLessons.map((lesson,index)=>({id:lesson.id||`number-step-${index}`,title:lesson.name,values:[...lesson.values||[]]}))):
        def.generated==='dakuten'?content.dakutenPatterns.map(pattern=>({id:`dak-pattern-${pattern.id}`,title:pattern.name,characters:[...pattern.newH,...pattern.newK].map(item=>item[0])})):[];
      const registry=content.audioEntryById||{},entries=content.audioEntries||[];
      const wordAudio=[...words,...[...kanjiIntroductions,...kanjiTargets].map(item=>manifest.vocabulary.find(word=>word.id===item.id)).filter(Boolean)].flatMap(word=>word.audioId?[word.audioId]:registry[word.id]?[word.id]:[]);
      const lessonAudio=entries.filter(entry=>lessonIds.includes(entry.lessonId)||(entry.entry?.sourceLessonIds||[]).some(id=>lessonIds.includes(id))).map(entry=>entry.id);
      const grammarAudio=lessons.flatMap(lesson=>lesson.grammarIds||[]).filter(id=>registry[id]);
      const generatedAudio=def.generated?entries.filter(entry=>['kana','number'].includes(entry.kind)&&entry.level===(def.generated==='kana-foundation'?1:3)).map(entry=>entry.id):[];
      return {...def,title:def.title||level?.theme||'',lessonIds:[...lessonIds],wordIds,
        generatedLessons,kanjiIntroductions,kanjiTargets,
        introductions:words.map(word=>({id:word.id,point:word.introducedAt,kanjiPoint:word.kanjiIntroducedAt||null})),
        exerciseIds:manifest.exercises.filter(exercise=>lessonIds.includes(exercise.lessonId)).map(exercise=>exercise.id),
        audioIds:[...new Set([...wordAudio,...lessonAudio,...grammarAudio,...generatedAudio])],
        overviewSource:def.generated||'lesson-word-ids',dictionarySource:'vocabCatalog',recallSource:'lesson-and-exam-ranks',
        award:{examId:def.examId,threshold:'existing-exam',rankRule:'promote-one'},nextId:definitions[index+1]?.id||null};
    });
  }

  function contractForVisible(contracts,number){return contracts.find(level=>level.number===Number(number))||null}
  function contractForInternal(contracts,index,screen=''){return screen==='intro'?contracts.find(level=>level.id==='social-intro')||null:contracts.find(level=>level.id!=='social-intro'&&level.internalIndexes.includes(Number(index)))||null}
  function rankFor(contract,ranks){return normalRank(ranks?.[contract?.award?.examId]?.rank)}

  // Both old comprehensive exams together prove both directions. Preserve the old
  // records untouched, and credit no higher than the weaker of those two results.
  function migrateKanaExam(saved){
    if(!saved||typeof saved!=='object')return saved;
    const ranks=saved.ranks&&typeof saved.ranks==='object'?saved.ranks:(saved.ranks={});
    if(ranks[kanaExamId])return saved;
    const old=legacyKanaExams.map(id=>ranks[id]),ranksOld=old.map(record=>normalRank(record?.rank));
    if(ranksOld.every(Boolean)){
      const rank=rankOrder[Math.min(...ranksOld.map(value=>rankOrder.indexOf(value)))];
      ranks[kanaExamId]={rank,last:null,attempts:0,migratedFrom:[...legacyKanaExams]};
    }
    return saved;
  }

  function validateContracts(contracts,content){
    const errors=[],ids=new Set(),numbers=new Set(),assigned=new Set(),exams=new Set();
    const lessons=new Map(content.manifest.lessons.map(lesson=>[lesson.id,lesson]));
    const vocabulary=new Map(content.manifest.vocabulary.map(word=>[word.id,word]));
    const exercises=new Map(content.manifest.exercises.map(exercise=>[exercise.id,exercise]));
    const audio=content.audioEntryById?new Set(Object.keys(content.audioEntryById)):new Set((content.manifest.audio?.assets||[]).map(asset=>asset.id));
    const add=(code,id,message)=>errors.push({code,id,message});
    for(const level of contracts){
      if(!level.id||ids.has(level.id))add('LEVEL_ID',level.id,'Missing or duplicate stable level ID');ids.add(level.id);
      if(!Number.isInteger(level.number)||numbers.has(level.number))add('VISIBLE_NUMBER',level.id,'Missing or duplicate visible number');numbers.add(level.number);
      if(!level.examId||level.award?.examId!==level.examId)add('EXAM_AWARD',level.id,'A level exam must award this level');
      if(exams.has(level.examId))add('DUPLICATE_EXAM',level.id,level.examId);exams.add(level.examId);
      const expectedExam=level.id==='kana-foundation'?kanaExamId:level.id==='social-intro'?'intro-exam':level.id==='level-3'?'dak-examA':/^level-\d+$/.test(level.id)?`l${level.id.slice(6)}-exam`:null;
      if(!expectedExam||level.examId!==expectedExam)add('EXAM_ID',level.id,'Exam must match the stable level identity');
      if(!level.overviewSource||!level.dictionarySource||!level.recallSource||!level.award?.rankRule)add('LEVEL_FIELDS',level.id,'Missing overview, dictionary, Recall or rank rule');
      for(const id of level.lessonIds){if(!lessons.has(id))add('UNKNOWN_LESSON',level.id,id);if(assigned.has(id))add('DUPLICATE_LESSON',level.id,id);assigned.add(id)}
      for(const id of level.wordIds)if(!vocabulary.has(id))add('UNKNOWN_WORD',level.id,id);
      for(const introduction of level.introductions){
        if(!introduction.point)add('NO_INTRODUCTION',level.id,introduction.id);
        if(introduction.kanjiPoint&&introduction.point&&content.pointOrder(introduction.kanjiPoint)<content.pointOrder(introduction.point))add('EARLY_KANJI',level.id,introduction.id);
      }
      for(const target of level.kanjiIntroductions||[]){if(!vocabulary.has(target.id)||!level.lessonIds.includes(target.lessonId)||!target.point)add('KANJI_INTRODUCTION',level.id,target.id)}
      for(const target of level.kanjiTargets||[]){if(!vocabulary.has(target.id)||!level.lessonIds.includes(target.lessonId)||!target.block||target.exerciseId&&!exercises.has(target.exerciseId))add('KANJI_TARGET',level.id,target.id)}
      for(const id of level.exerciseIds){const exercise=exercises.get(id);if(!exercise||!level.lessonIds.includes(exercise.lessonId))add('ORPHAN_EXERCISE',level.id,id)}
      for(const id of level.audioIds)if(!audio.has(id))add('UNKNOWN_AUDIO',level.id,id);
      if(level.nextId&&!contracts.some(next=>next.id===level.nextId))add('NEXT_LEVEL',level.id,level.nextId);
    }
    for(const lesson of lessons.values())if(!lesson.optional&&!lesson.legacy&&!assigned.has(lesson.id))add('ORPHAN_LESSON',lesson.id,'Lesson is not assigned to a level');
    for(let i=0;i<contracts.length;i++){
      if(contracts[i].number!==i+1)add('LEVEL_ORDER',contracts[i].id,'Visible numbers must follow the course order');
      if(contracts[i].nextId!==(contracts[i+1]?.id||null))add('NEXT_LEVEL_ORDER',contracts[i].id,'Next level must follow the visible course order');
    }
    return errors;
  }
  const api={kanaExamId,legacyKanaExams,makeContracts,contractForVisible,contractForInternal,rankFor,migrateKanaExam,validateContracts};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else {root.LanguageJourneyLevelContract=api;if(root.window)root.window.LanguageJourneyLevelContract=api}
})(typeof globalThis!=='undefined'?globalThis:this);
