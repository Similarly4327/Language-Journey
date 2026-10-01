const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const content=require('../language-journey-content/content.js');

function fakeElement(id=''){
  const classes=new Set();
  const listeners=new Map();
  return {id,dataset:{},style:{},value:'',textContent:'',innerHTML:'',hidden:false,disabled:false,
    listeners,
    classList:{add:(...names)=>names.forEach(x=>classes.add(x)),remove:(...names)=>names.forEach(x=>classes.delete(x)),toggle:(name,force)=>{if(force===undefined)force=!classes.has(name);force?classes.add(name):classes.delete(name);return force},contains:name=>classes.has(name)},
    setAttribute(){},getAttribute(){return null},removeAttribute(){},appendChild(){},prepend(){},remove(){},addEventListener(type,handler){listeners.set(type,handler)},querySelector(){return fakeElement()},querySelectorAll(){return []},scrollIntoView(){},focus(){},getBoundingClientRect(){return{width:300,height:200,top:0,left:0}}};
}

function createCrashCourseProbe(){
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const source=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/\}\)\(\);\s*$/,'globalThis.__probe={state,rankState,advancedCourses,langLessons,lessonNewWords,wordCrashCourseDeck,wordCrashCourseAccepts,beginWordCrashCourse,answerWordCrashCourse,advanceWordCrashCourse,leaveWordCrashCourse,completeWordCrashCourse,element(id){return $(id)},get activeWordCrashCourse(){return activeWordCrashCourse},get wordCrashCourseTimer(){return wordCrashCourseTimer},fireCrashTimer(id){const timer=window.crashTimers[id];if(timer&&!timer.cancelled&&!timer.fired){timer.fired=true;timer.callback()}},get crashTimers(){return window.crashTimers}};})();');
  const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,fakeElement(id));return elements.get(id)};
  const timers=[],storage=new Map();
  const document={body:fakeElement('body'),documentElement:fakeElement('html'),hidden:false,getElementById:get,createElement:()=>fakeElement(),querySelectorAll:()=>[],querySelector:()=>fakeElement(),addEventListener(){}};
  storage.set('taal-japanse-leerapp-v1',JSON.stringify({version:6,state:{}}));
  const localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
  const window={LanguageJourneyContent:content,crashTimers:timers,innerWidth:390,innerHeight:844,addEventListener(){},setTimeout:(callback,delay)=>{timers.push({callback,delay,cancelled:false,fired:false});return timers.length-1},clearTimeout:id=>{if(timers[id])timers[id].cancelled=true},matchMedia:()=>({matches:false,addEventListener(){}})};
  const context={document,window,localStorage,location:{hash:''},performance:{now:()=>0},navigator:{},console,setTimeout(){},clearTimeout(){},requestAnimationFrame(){},structuredClone,URL,Date,Math,Intl,alert(){},Image:class{}};
  for(const [,relative] of html.matchAll(/<script src="\.\/([^"?]+)(?:\?[^\"]*)?"><\/script>/g)){
    if(relative==='language-journey-content/content.js')continue;
    vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',relative),'utf8'),context,{timeout:5000});
  }
  vm.runInNewContext(source,context,{timeout:5000});
  return context.__probe;
}

function seededRandom(seed){let value=seed>>>0;return()=>{value=(value+0x6d2b79f5)>>>0;let t=value;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}

test('all level screens render through the imported content adapter',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const source=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/\}\)\(\);\s*$/, 'globalThis.__probe={state,rankState,vocabMastery,itemMastery,renderMain,advancedPracticeQuestions,advancedQuestions,advancedQuestionPool,advancedExamQuestions,advancedExamQuestionCounts,buildAdvancedExamQuestions,languagePracticeQuestions,level4QuestionBank,balancedLevel4Questions,buildLanguageExamQuestions,selectDistinctLessonQuestions,lessonQuestion,lessonCanonicalGoals,lessonCoverageReport,levelCoverageReport,smallQuestionPool,smallLessonQuestions,buildSmallExamQuestions,advancedCourses,langLessons,smallLessons,coursePhases,renderCoursePhase,phaseGuideCopy,storageStateSnapshot,loadProgress,renderLanguageExam,renderAdvancedExam,lessonQuestionInstruction,advancedWordStages,lessonNewWords,wordCrashCourseDeck,wordCrashCourseAccepts,renderLanguageWords,renderLanguageModel,renderAdvancedWords,renderAdvancedModel,beginWordCrashCourse,answerWordCrashCourse,advanceWordCrashCourse,leaveWordCrashCourse,completeWordCrashCourse,revealQuizOptions,hideQuizOptions,answer,element(id){return $(id)},get activeWordCrashCourse(){return activeWordCrashCourse},manifest:window.LanguageJourneyContent.manifest};})();');
  const elements=new Map();
  const get=id=>{if(!elements.has(id))elements.set(id,fakeElement(id));return elements.get(id)};
  const document={body:fakeElement('body'),documentElement:fakeElement('html'),hidden:false,getElementById:get,createElement:()=>fakeElement(),querySelectorAll:()=>[],querySelector:()=>fakeElement(),addEventListener(){}};
  const storage=new Map();
  storage.set('taal-japanse-leerapp-v1',JSON.stringify({version:6,state:{screen:'home',userName:'Testgebruiker',introducedVocabIds:['vocab-ねこ','vocab-かばん'],flashcardProgress:{cards:{'vocab-ねこ::jp-nl':{dueAt:123456789,intervalDays:3,repetitions:2,lapses:0,lastGrade:'knew'}}}},ranks:{'l4-1':{rank:'Silver',last:.95,attempts:3}},vocabMastery:{'vocab-ねこ':{score:40}},itemMastery:{'hiragana-あ':{score:20}}}));
  const localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
  const window={LanguageJourneyContent:content,innerWidth:390,innerHeight:844,addEventListener(){},setTimeout(){},clearTimeout(){},matchMedia:()=>({matches:false,addEventListener(){}})};
  const seededMath=Object.create(Math);seededMath.random=seededRandom(0x4c4a2026);
  const context={document,window,localStorage,location:{hash:''},performance:{now:()=>0},navigator:{},console,setTimeout(){},clearTimeout(){},requestAnimationFrame(){},structuredClone,URL,Date,Math:seededMath,Intl,alert(){},Image:class{}};
  for(const [,relative] of html.matchAll(/<script src="\.\/([^"?]+)(?:\?[^"]*)?"><\/script>/g)){
    if(relative==='language-journey-content/content.js')continue;
    vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',relative),'utf8'),context,{timeout:5000});
  }
  vm.runInNewContext(source,context,{timeout:5000});
  assert.ok(context.__probe);
  assert.equal(context.__probe.state.userName,'Testgebruiker');
  assert.equal(context.__probe.rankState['l4-1'].rank,'Silver');
  assert.ok(context.__probe.state.introducedVocabIds.includes('vocab-ねこ'));
  assert.ok(context.__probe.state.introducedVocabIds.includes('vocab-かばん'));
  assert.equal(context.__probe.state.flashcardProgress.cards['vocab-ねこ::jp-nl'].repetitions,2);
  assert.equal(context.__probe.vocabMastery['vocab-ねこ'].score,40);
  assert.equal(context.__probe.itemMastery['hiragana-あ'].score,20);
  const fixedQuestionIds=new Set(),fixedQuestions=[];
  for(const lesson of context.__probe.manifest.lessons.filter(item=>item.level>=4&&item.level<=10)){
    for(const raw of lesson.check||[])fixedQuestions.push({raw,lessonId:lesson.id});
    if(Array.isArray(lesson.focus))fixedQuestions.push({raw:lesson.focus,lessonId:lesson.id});
  }
  for(const reading of context.__probe.manifest.readings.filter(item=>/^reading-l(?:[4-9]|10)-/.test(item.id)))fixedQuestions.push({reading});
  assert.equal(fixedQuestions.length,151,'the revised fixed bank includes the new second months lesson');
  for(const {raw,reading,lessonId} of fixedQuestions){
    if(reading){
      assert.ok(reading.text&&reading.question&&reading.answer,`${reading.id} shows its passage and question`);
      assert.ok(reading.choices.includes(reading.answer),`${reading.id} includes its correct answer among choices`);
      assert.equal(fixedQuestionIds.has(reading.id),false,`${reading.id} is unique`);fixedQuestionIds.add(reading.id);
      continue;
    }
    const [kind,prompt,correct,choices,,acceptedOrGoal,instruction,contextText,sourceId,,targetConceptId]=raw;
    assert.ok(instruction,`${sourceId} has a visible instruction`);
    assert.ok(sourceId,`${lessonId} fixed question has a stable source ID`);
    assert.ok(targetConceptId,`${sourceId} has a target concept`);
    assert.ok(prompt&&correct,`${sourceId} has a prompt and answer`);
    assert.ok(Array.isArray(choices)&&choices.length>=2,`${sourceId} has answer options or build tiles`);
    assert.equal(fixedQuestionIds.has(sourceId),false,`${sourceId} is unique`);fixedQuestionIds.add(sourceId);
    if(kind==='build')assert.deepEqual([...choices].sort(),correct.split(/\s+/).sort(),`${sourceId} contains exactly the required sentence tiles`);
    else assert.ok(choices.includes(correct),`${sourceId} includes its correct answer among choices`);
  }
  const l5Lessons=context.__probe.manifest.lessons.filter(item=>item.level===5),vocabulary=context.__probe.manifest.vocabulary;
  const katakanaVowel={ア:'a',カ:'a',サ:'a',タ:'a',ナ:'a',ハ:'a',マ:'a',ヤ:'a',ラ:'a',ワ:'a',イ:'i',キ:'i',シ:'i',チ:'i',ニ:'i',ヒ:'i',ミ:'i',リ:'i',ウ:'u',ク:'u',ス:'u',ツ:'u',ヌ:'u',フ:'u',ム:'u',ユ:'u',ル:'u',エ:'e',ケ:'e',セ:'e',テ:'e',ネ:'e',ヘ:'e',メ:'e',レ:'e',オ:'o',コ:'o',ソ:'o',ト:'o',ノ:'o',ホ:'o',モ:'o',ヨ:'o',ロ:'o'};
  for(const lesson of l5Lessons){
    const introduced=vocabulary.filter(word=>word.introducedAt===`5-${lesson.order}`);
    for(const [form] of lesson.newItems.filter(([form])=>/[ゃゅょャュョ]/u.test(form))){
      const matching=introduced.filter(word=>word.japanese.includes(form));
      assert.ok(matching.length<=2,`${lesson.id} introduces at most two words for ${form}`);
    }
    if(lesson.newItems.some(([form])=>form==='っ'))assert.ok(introduced.filter(word=>word.japanese.includes('っ')).length<=2,`${lesson.id} introduces at most two hiragana small-tsu words`);
    if(lesson.newItems.some(([form])=>form==='ッ'))assert.ok(introduced.filter(word=>word.japanese.includes('ッ')).length<=2,`${lesson.id} introduces at most two katakana small-tsu words`);
    if(lesson.newItems.some(([form])=>form==='ー')){
      const perVowel=new Map();
      for(const word of introduced){const vowels=new Set([...word.japanese].flatMap((char,index)=>char==='ー'&&katakanaVowel[word.japanese[index-1]]?[katakanaVowel[word.japanese[index-1]]]:[]));for(const vowel of vowels)perVowel.set(vowel,(perVowel.get(vowel)||0)+1)}
      for(const [vowel,count] of perVowel)assert.ok(count<=2,`${lesson.id} introduces at most two long-vowel words for ${vowel}`);
    }
    for(const raw of lesson.check.filter(q=>q[0]==='meaning'&&q[9])){
      const word=vocabulary.find(item=>item.id===raw[9]);
      assert.ok(word&&Number(word.introducedAt.split('-')[0])<=5&&word.introducedAt.localeCompare(`5-${lesson.order}`,undefined,{numeric:true})<=0,`${raw[8]} tests a word introduced by its lesson`);
    }
  }
  const revisedL5=Object.fromEntries(l5Lessons.flatMap(lesson=>lesson.check.map(q=>[q[8],q])));
  assert.equal(revisedL5['exercise-l5-1-5'][1],'きゃく','the Level 5 meaning prompt matches its answer and target word');
  assert.equal(revisedL5['exercise-l5-1-5'][2],'gast');
  assert.equal(revisedL5['exercise-l5-3-4'][1],'cho','the Level 5 prompt does not imply a long vowel');
  assert.equal(revisedL5['exercise-l5-3-7'][1],'josei');
  assert.equal(revisedL5['exercise-l5-5-7'][2],'コーヒー','the coffee question tests the long mark after コ');
  assert.ok(context.__probe.manifest.lessons.find(item=>item.id==='l8-6').focus[1].includes('さんじ に えき'),'Level 8 time example includes に');
  const assertDistinctTargets=(questions,label)=>{
    const seen=new Set();
    for(const question of questions){
      const keys=[...(question.targetLemmaIds||[]).map(id=>`lemma:${id}`),...(question.targetConceptId?[question.targetConceptId]:[])];
      for(const key of keys){assert.equal(seen.has(key),false,`${label} repeats target ${key}`);seen.add(key)}
    }
  };
  const assertQuestionBank=(questions,label)=>{
    const ids=new Set();
    for(const question of questions){
      assert.ok(question.instruction,`${label} ${question.sourceId} has an instruction`);
      assert.ok(question.sourceId,`${label} has stable source IDs`);
      assert.ok(question.targetConceptId,`${label} ${question.sourceId} has a target concept`);
      assert.equal(ids.has(question.sourceId),false,`${label} source IDs are unique`);ids.add(question.sourceId);
      if(question.kind==='build')assert.deepEqual([...question.choices].sort(),question.correct.split(/\s+/).sort(),`${label} ${question.sourceId} has exactly the required tiles`);
      else assert.ok(question.choices.includes(question.correct),`${label} ${question.sourceId} includes its correct option`);
      if(question.kind==='order'||question.category==='reading')assert.ok(question.context,`${label} ${question.sourceId} shows its referenced meaning or text`);
    }
  };
  for(let index=0;index<context.__probe.langLessons.length;index++)assertQuestionBank(context.__probe.level4QuestionBank(index),`Level 4 lesson ${index+1} generated bank`);
  for(const lesson of context.__probe.smallLessons){
    const bank=context.__probe.smallQuestionPool(lesson),quick=context.__probe.smallLessonQuestions(lesson,8,'test');
    assert.equal(context.__probe.lessonCoverageReport(lesson,quick).missing.length,0,`${lesson.id} quick check covers all canonical goals`);
    assert.ok(quick.length>=context.__probe.lessonCanonicalGoals(lesson).length,`${lesson.id} grows when its goal count exceeds the old fixed length`);
    assertQuestionBank(bank,`Level 5 lesson ${lesson.id}`);
  }
  for(let level=0;level<content.levels.length;level++){
    context.__probe.state.screen='module';
    context.__probe.state.level=level;
    assert.doesNotThrow(()=>context.__probe.renderMain(),`Level ${level+1} failed`);
  }
  for(let index=0;index<context.__probe.langLessons.length;index++){
    const lesson=context.__probe.langLessons[index],questions=context.__probe.languagePracticeQuestions(lesson,index),words=context.__probe.lessonNewWords(lesson);
    assert.equal(questions.length,words.length*4,`Level 4 lesson ${index+1} practice contains exactly four cards per new word`);
    assert.ok(questions.every(question=>words.some(word=>word.id===question.word.id)),`Level 4 lesson ${index+1} practice has no old target words`);
    const mini=context.__probe.balancedLevel4Questions(index,10);
    assert.equal(context.__probe.lessonCoverageReport(lesson,mini).missing.length,0,`Level 4 lesson ${index+1} mini-check covers all canonical goals`);
    assert.ok(mini.every(question=>(question.introducedAt??0)===index),`Level 4 lesson ${index+1} mini-check has no standalone old targets`);
  }
  for(const [level,course] of Object.entries(context.__probe.advancedCourses)){
    course.lessons.forEach((lesson,index)=>{
      const questions=context.__probe.advancedPracticeQuestions(course,lesson,index),words=context.__probe.lessonNewWords(lesson);
      assert.equal(questions.length,words.length*4,`Level ${course.number} lesson ${index+1} practice contains exactly four cards per new word`);
      assert.ok(questions.every(question=>words.some(word=>word.id===question.word.id)),`Level ${course.number} lesson ${index+1} practice has no old target words`);
      const pool=context.__probe.advancedQuestionPool(course,lesson,index);
      assertQuestionBank([...pool.current,...pool.review],`Level ${course.number} lesson ${index+1} generated bank`);
      const quick=context.__probe.advancedQuestions(course,lesson,index);
      assert.equal(context.__probe.lessonCoverageReport(lesson,quick).missing.length,0,`Level ${course.number} lesson ${index+1} quick check covers every new goal`);
      assert.ok(quick.every(question=>question.isCurrentContent),`Level ${course.number} lesson ${index+1} mini-check contains only current-lesson questions`);
      for(const goal of context.__probe.lessonCanonicalGoals(lesson).filter(goal=>goal.kind==='vocab')){const question=quick.find(item=>(item.targetGoalIds||[]).includes(goal.id));assert.ok(question?.context,`${lesson.id} tests ${goal.id} in a visible situation`)}
      for(const goal of context.__probe.lessonCanonicalGoals(lesson).filter(goal=>goal.kind!=='vocab')){const question=quick.find(item=>(item.targetGoalIds||[]).includes(goal.id));assert.ok(['order','build','fill'].includes(question?.kind),`${lesson.id} tests ${goal.id} through an actual pattern application`)}
      assert.ok(context.__probe.advancedWordStages(lesson).core.length<=2,`Level ${course.number} lesson ${index+1} starts with at most two new words`);
    });
  }
  for(let run=0;run<100;run++){
    seededMath.random=seededRandom(run+1);
    const level4Exam=context.__probe.buildLanguageExamQuestions();
    assert.equal(context.__probe.levelCoverageReport(context.__probe.langLessons,level4Exam).missing.length,0,`Level 4 exam run ${run+1} covers every level goal`);
    const level5Exam=context.__probe.buildSmallExamQuestions();
    assert.equal(context.__probe.levelCoverageReport(context.__probe.smallLessons,level5Exam).missing.length,0,`Level 5 exam run ${run+1} covers every level goal`);
    for(const course of Object.values(context.__probe.advancedCourses)){
      const checkLesson=course.lessons[run%course.lessons.length],check=context.__probe.advancedQuestions(course,checkLesson,run%course.lessons.length);
      const missing=context.__probe.lessonCoverageReport(checkLesson,check).missing;
      assert.equal(missing.length,0,`${checkLesson.id} seeded run ${run+1} missing ${missing.map(goal=>goal.id).join(', ')}`);
      const exam=context.__probe.buildAdvancedExamQuestions(course),examMissing=context.__probe.levelCoverageReport(course.lessons,exam).missing;
      assert.equal(examMissing.length,0,`Level ${course.number} exam run ${run+1} missing ${examMissing.map(goal=>goal.id).join(', ')}`);
    }
  }
  const level8Lesson1=context.__probe.advancedCourses[7].lessons[0],level8Questions=context.__probe.advancedQuestions(context.__probe.advancedCourses[7],level8Lesson1,0),weekdayGoals=context.__probe.lessonCanonicalGoals(level8Lesson1).filter(goal=>goal.kind==='vocab');
  assert.deepEqual(Array.from(weekdayGoals,goal=>goal.label.split(' · ')[0]),['げつようび','かようび','すいようび','もくようび']);
  for(const goal of weekdayGoals){const question=level8Questions.find(item=>(item.targetGoalIds||[]).includes(goal.id));assert.ok(question,`Level 8 lesson 1 has a target question for ${goal.label}`);assert.equal(question.correct,goal.label.split(' · ')[0],`${goal.label} is the required answer, not merely a distractor`);assert.match(question.context,/plant|afspraak/i)}
  const probe=context.__probe,{lessonNewWords,wordCrashCourseDeck,wordCrashCourseAccepts}=probe;
  const wordLessons=[...probe.langLessons,...Object.values(probe.advancedCourses).flatMap(course=>course.lessons)];
  for(const lesson of wordLessons){
    const point=`${lesson.level}-${lesson.order}`,metadata=probe.manifest.vocabulary;
    let expected=metadata.filter(word=>word.introducedAt===point);
    if(!expected.length)expected=metadata.filter(word=>word.coreOrContext==='legacy'&&word.legacyLessonId===lesson.id);
    assert.equal(JSON.stringify(lessonNewWords(lesson).map(word=>word.id)),JSON.stringify([...new Set(expected.map(word=>word.id))]),`${lesson.id} follows canonical first-introduction metadata`);
    const words=lessonNewWords(lesson),deck=wordCrashCourseDeck(words);
    assert.equal(deck.length,4*words.length,`${lesson.id} has four starting assessments per new word`);
    const counts=new Map();deck.forEach(question=>counts.set(question.key,(counts.get(question.key)||0)+1));
    words.forEach(word=>['jp-nl','nl-jp'].forEach(direction=>assert.equal(counts.get(`${word.id}|${direction}`),2,`${lesson.id} asks each direction twice`)));
    assert.ok(deck.every((question,index)=>index===0||question.key!==deck[index-1].key),`${lesson.id} never repeats the identical question consecutively`);
    if(words.length>1)assert.ok(deck.every((question,index)=>index===0||question.word.id!==deck[index-1].word.id),`${lesson.id} avoids consecutive word repeats when possible`);
    if(words.length)assert.ok(deck.filter((question,index)=>index>0&&question.direction!==deck[index-1].direction).length>=2,`${lesson.id} interleaves the two directions`);
    for(const question of deck.filter(question=>!question.selfReveal)){
      const sameLessonAnswers=new Set(words.map(word=>question.direction==='jp-nl'?word.meaning:word.jp));
      assert.ok(question.choices.every(choice=>sameLessonAnswers.has(choice)),`${lesson.id} uses only words introduced there as answer options`);
      assert.ok(question.choices.includes(question.correct));
    }
  }
  assert.equal(wordCrashCourseAccepts({accepted:['jongere broer','broertje']},'broertje'),true,'valid alternate meanings are accepted');
  const seeWordLesson=wordLessons.find(lesson=>lessonNewWords(lesson).some(word=>word.id==='vocab-みます'));
  const seeWord=lessonNewWords(seeWordLesson).find(word=>word.id==='vocab-みます');
  const seeQuestion=wordCrashCourseDeck([seeWord]).find(question=>question.direction==='jp-nl');
  assert.equal(wordCrashCourseAccepts(seeQuestion,seeQuestion.correct),true,'the visible compound meaning is accepted');
  assert.equal(wordCrashCourseAccepts(seeQuestion,'kijken'),true,'each listed valid meaning is accepted');
  assert.equal(wordCrashCourseAccepts(seeQuestion,'zien'),true,'alternate valid meanings are accepted');
  const oneWordLesson=probe.langLessons.find(lesson=>lesson.id==='l4-8'),oneWord=lessonNewWords(oneWordLesson);
  assert.equal(oneWord.length,1);
  const six=probe.advancedCourses[5],fourWordLesson=six.lessons.find(lesson=>lesson.id==='l6-4');
  probe.state.screen='module';probe.state.level=5;probe.state.tabs.advanced='learn';probe.state.advancedView[5]='lesson';probe.state.advancedStep[5]='words';probe.state.advancedLesson[5]=3;
  probe.renderAdvancedWords(six,fourWordLesson,5,3);
  let wordsMarkup=probe.element('advancedStepBody').innerHTML;
  lessonNewWords(fourWordLesson).forEach(word=>assert.ok(wordsMarkup.includes(word.jp),`${word.jp} appears immediately`));
  assert.match(wordsMarkup,/4 nieuwe woorden/);
  assert.doesNotMatch(wordsMarkup,/Eerst voor het patroon|Daarna uitbreiden|<details/);
  assert.doesNotMatch(wordsMarkup,/Crash course woorden/);
  assert.match(wordsMarkup,/Naar Oefenen/);

  const twoWordLesson=probe.advancedCourses[9].lessons.find(lesson=>lesson.id==='l10-2');
  assert.equal(lessonNewWords(twoWordLesson).length,2,'known tea and cake words are not counted again in Level 10, lesson 2');
  probe.renderAdvancedWords(probe.advancedCourses[9],twoWordLesson,9,1);
  wordsMarkup=probe.element('advancedStepBody').innerHTML;
  assert.match(wordsMarkup,/2 nieuwe woorden/);
  assert.doesNotMatch(wordsMarkup,/おちゃ|ケーキ/);
  const manyWordLesson=probe.advancedCourses[7].lessons.find(lesson=>lesson.id==='l8-4');
  assert.equal(lessonNewWords(manyWordLesson).length,6);
  probe.renderAdvancedWords(probe.advancedCourses[7],manyWordLesson,7,3);
  wordsMarkup=probe.element('advancedStepBody').innerHTML;
  lessonNewWords(manyWordLesson).forEach(word=>assert.ok(wordsMarkup.includes(word.jp)));
  assert.doesNotMatch(wordsMarkup,/Daarna uitbreiden|<details/);

  const zeroWordLesson=six.lessons.find(lesson=>lesson.id==='l6-5');
  probe.state.advancedStep[5]='words';probe.renderAdvancedWords(six,zeroWordLesson,5,4);
  assert.doesNotMatch(probe.element('advancedStepBody').innerHTML,/Crash course woorden/);
  assert.ok(probe.element('advancedWordsNext').onclick,'a lesson without new words keeps its normal next step');
  assert.equal(probe.state.advancedStep[5],'words','rendering a no-word lesson does not advance it');

  const months2=probe.advancedCourses[7].lessons.find(lesson=>lesson.id==='l8-months-2');
  assert.deepEqual(Array.from(lessonNewWords(manyWordLesson),word=>word.meaning),['januari','februari','maart','april','mei','juni']);
  assert.deepEqual(Array.from(lessonNewWords(months2),word=>word.meaning),['juli','augustus','september','oktober','november','december']);
  assert.equal(probe.advancedCourses[7].lessons.findIndex(lesson=>lesson.id==='l8-5'),5,'the stable hours lesson moved to position 6');
  assert.equal(probe.advancedCourses[7].lessons.findIndex(lesson=>lesson.id==='l8-6'),6,'the stable planning lesson moved to position 7');
  assert.ok(probe.rankState['l8-5']&&probe.rankState['l8-6'],'existing progress IDs remain addressable');
  for(const lesson of [manyWordLesson,months2]){
    const deck=wordCrashCourseDeck(lessonNewWords(lesson));
    assert.equal(deck.length,24,`${lesson.id} practices six months four times each`);
    const mini=context.__probe.advancedQuestions(context.__probe.advancedCourses[7],lesson,context.__probe.advancedCourses[7].lessons.indexOf(lesson));
    for(const word of lessonNewWords(lesson)){const goal=`vocab:${word.id}`,question=mini.find(item=>(item.targetGoalIds||[]).includes(goal));assert.ok(question?.context,`${lesson.id} tests ${word.jp} in context`)}
  }
  assert.equal(probe.manifest.vocabulary.filter(word=>['vocab-ついたち','vocab-ふつか','vocab-みっか'].includes(word.id)&&word.introducedAt.startsWith('8-')).length,0,'date forms are no longer Level 8 targets');

  assert.match(html,/#qChoices\.quiz-options-hidden/,'all quiz option lists have a blurred state');
  assert.match(html,/reveal\.textContent='Toon antwoorden'/,'the reveal control has a clear visible label');
  const blurQuestion=context.__probe.lessonQuestion({kind:'mc',prompt:'test',correct:'goed',choices:['goed','fout'],category:'vocab',sourceId:'blur-test',targetConceptId:'blur-test'});
  context.__probe.state.quiz={source:'advanced',questions:[blurQuestion],index:0,score:0,mistakes:[],optionsRevealed:false,answerUnlockAt:0};
  assert.equal(context.__probe.revealQuizOptions(),true);
  assert.equal(context.__probe.state.quiz.score,0,'revealing does not change the score');
  assert.equal(context.__probe.answer(false,fakeElement('choice'),'fout'),false,'a rapid second tap cannot submit immediately after reveal');
  assert.equal(context.__probe.state.quiz.mistakes.length,0);
  context.__probe.state.quiz.answerUnlockAt=0;
  assert.equal(context.__probe.answer(false,fakeElement('choice'),'fout'),true,'a later deliberate tap submits once');
  assert.equal(context.__probe.state.quiz.mistakes.length,1);

  context.__probe.rankState['l4-10'].rank=null;
  context.__probe.renderLanguageExam();
  assert.equal(get('langExam').disabled,false,'Level 4 exam is available without a prerequisite rank');
  assert.equal(typeof get('langExam').onclick,'function');
  for(const [level,course] of Object.entries(context.__probe.advancedCourses)){
    context.__probe.rankState[course.lessons.at(-1).id].rank=null;
    context.__probe.renderAdvancedExam(course,Number(level));
    assert.equal(get('advancedExamStart').disabled,false,`Level ${course.number} exam is available without a prerequisite rank`);
    assert.equal(typeof get('advancedExamStart').onclick,'function');
  }
  assert.equal(context.__probe.lessonQuestionInstruction({kind:'fill',prompt:'パン を ふたつ ___'}),'Vul het ontbrekende blok in.');

  const {state,rankState,coursePhases,renderCoursePhase,phaseGuideCopy,storageStateSnapshot,loadProgress}=context.__probe;
  const foundation=coursePhases.find(phase=>phase.id==='foundation');
  const travel=coursePhases.find(phase=>phase.id==='usable-japanese');
  assert.ok(foundation&&travel,'both current phases are available');
  Object.values(rankState).forEach(record=>{record.rank=null;record.last=null;record.attempts=0});
  state.level=0;state.openPhaseId=foundation.id;state.introducedVocabIds=[];state.studyTracker={sessions:[]};
  let phaseRows=coursePhases.map(phase=>renderCoursePhase(phase));
  assert.deepEqual(phaseRows.filter(row=>row.open).map(row=>row.className),['course-phase'],'a new learner sees only the first phase open');
  assert.match(phaseGuideCopy(foundation).detail,/Hiragana → Leerroute → Klinkers, stap 1/);
  assert.match(phaseRows[coursePhases.indexOf(foundation)].innerHTML,/Klinkers, stap 1/,'the first Hiragana action is visible in the phase guide');

  state.level=10;state.openPhaseId=travel.id;
  state.studyTracker={sessions:[{level:11,status:'afgerond',title:'Level 11 · Les 1 · A',startedAt:'2026-09-27T08:00:00.000Z',endedAt:'2026-09-27T08:10:00.000Z',result:{score:8,total:10}}]};
  state.openPhaseId=foundation.id;
  phaseRows=coursePhases.map(phase=>renderCoursePhase(phase));
  const phaseContainer=fakeElement('phases');phaseContainer.querySelectorAll=()=>phaseRows;
  phaseRows.forEach(row=>{row.parentElement=phaseContainer});
  const travelRow=phaseRows[coursePhases.indexOf(travel)];
  const foundationRow=phaseRows[coursePhases.indexOf(foundation)];
  travelRow.open=true;travelRow.listeners.get('toggle')();
  assert.equal(state.openPhaseId,travel.id,'opening another phase updates the remembered phase');
  assert.equal(foundationRow.open,false,'opening another phase closes the previous phase');
  assert.ok(phaseRows.filter(row=>row.open).every(row=>row===travelRow));
  assert.match(phaseGuideCopy(travel).message,/8\/10 goed/,'the avatar uses a real completed exercise result');

  const persisted=storageStateSnapshot();
  assert.equal(persisted.openPhaseId,travel.id,'the open phase is included in the saved state');
  const saved={version:7,state:{...persisted,advancedLesson:{...persisted.advancedLesson,7:5}},ranks:{'l8-5':{rank:'Gold',last:.9,attempts:2},'l8-6':{rank:'Silver',last:.82,attempts:1}},itemMastery:{},vocabMastery:{}};
  storage.set('taal-japanse-leerapp-v1',JSON.stringify(saved));
  state.openPhaseId=foundation.id;
  loadProgress();
  assert.equal(state.openPhaseId,travel.id,'a returning learner restores the saved phase');
  assert.equal(state.advancedLesson[7],6,'a saved Level 8 planning position follows the same stable lesson after the inserted months lesson');
  assert.equal(rankState['l8-5'].rank,'Gold','the existing hours rank stays attached to the hours lesson');
  assert.equal(rankState['l8-6'].rank,'Silver','the existing planning rank stays attached to the planning lesson');
  phaseRows=coursePhases.map(phase=>renderCoursePhase(phase));
  assert.deepEqual(phaseRows.filter(row=>row.open).map(row=>row.className),['course-phase'],'a returning learner sees only the saved phase open');
});

test('lesson word practice mixes the exact word deck and safely advances answers',()=>{
  const probe=createCrashCourseProbe(),courseDef=probe.advancedCourses[5],lesson=courseDef.lessons.find(item=>item.id==='l6-4'),words=probe.lessonNewWords(lesson);
  assert.equal(words.length,4);
  const makeDeck=()=>probe.wordCrashCourseDeck(words);
  const deck=makeDeck(),counts=new Map();
  deck.forEach(question=>counts.set(question.key,(counts.get(question.key)||0)+1));
  assert.equal(deck.length,16);
  for(const word of words)for(const direction of ['jp-nl','nl-jp'])assert.equal(counts.get(`${word.id}|${direction}`),2);
  assert.ok(deck.every((question,index)=>index===0||question.word.id!==deck[index-1].word.id));
  assert.ok(deck.filter((question,index)=>index>0&&question.direction!==deck[index-1].direction).length>=8,'the two directions are thoroughly interleaved');

  const oneWord=probe.lessonNewWords(probe.langLessons.find(item=>item.id==='l4-8'));
  assert.equal(oneWord.length,1);
  assert.ok(probe.wordCrashCourseDeck(oneWord).every(question=>question.selfReveal));
  const twoWords=probe.lessonNewWords(probe.advancedCourses[9].lessons.find(item=>item.id==='l10-2'));
  const twoDeck=probe.wordCrashCourseDeck(twoWords);
  assert.equal(twoDeck.length,8);
  assert.ok(twoDeck.every((question,index)=>index===0||question.word.id!==twoDeck[index-1].word.id));

  const progressBefore=JSON.stringify(probe.state.flashcardProgress),ranksBefore=JSON.stringify(probe.rankState);
  const begin=()=>probe.beginWordCrashCourse({hostId:'crashHost',lesson,words,returnToLesson:()=>{probe.returned=true},onComplete:()=>{probe.completed=true}});
  begin();
  let crash=probe.activeWordCrashCourse,question=crash.queue[0];question.revealed=true;
  const wrong=question.choices.find(choice=>!probe.wordCrashCourseAccepts(question,choice));
  assert.ok(wrong);
  assert.equal(probe.answerWordCrashCourse(wrong),true);
  assert.equal(crash.index,0,'wrong feedback stays on the same question');
  assert.equal(probe.wordCrashCourseTimer,null,'wrong feedback waits for the learner');
  assert.match(probe.element('crashHost').innerHTML,/Niet goed\. Juiste antwoord:/);
  assert.match(probe.element('crashHost').innerHTML,/wordCrashNext/);
  assert.equal(probe.answerWordCrashCourse(question.correct),false,'a quick double-submit is ignored');
  assert.equal(crash.initialCorrect,0,'one wrong answer registers once');
  probe.element('wordCrashNext').onclick();
  assert.equal(crash.index,1,'manual next only navigates');
  probe.leaveWordCrashCourse();

  probe.returned=false;begin();
  crash=probe.activeWordCrashCourse;question=crash.queue[0];question.revealed=true;
  assert.equal(probe.answerWordCrashCourse(question.correct),true);
  const timer=probe.wordCrashCourseTimer;
  assert.equal(probe.crashTimers[timer].delay,1000);
  assert.match(probe.element('crashHost').innerHTML,/Goed!/);
  assert.doesNotMatch(probe.element('crashHost').innerHTML,/wordCrashNext/);
  assert.equal(probe.answerWordCrashCourse(question.correct),false);
  assert.equal(crash.initialCorrect,1);
  probe.fireCrashTimer(timer);
  assert.equal(crash.index,1,'correct answers advance after the feedback pause');
  crash.index=crash.queue.length-1;question=crash.queue[crash.index];question.revealed=true;
  assert.equal(probe.answerWordCrashCourse(question.correct),true);
  probe.fireCrashTimer(probe.wordCrashCourseTimer);
  assert.equal(crash.phase,'summary','the final correct answer reaches the normal summary');
  assert.match(probe.element('crashHost').innerHTML,/Oefenen afgerond/);
  const firstSessionDeck=crash.deck;
  probe.element('wordCrashAgain').onclick();
  assert.notEqual(crash.deck,firstSessionDeck,'restart shuffles a fresh question order');
  probe.leaveWordCrashCourse();
  assert.equal(probe.activeWordCrashCourse,null);

  probe.returned=false;begin();
  crash=probe.activeWordCrashCourse;question=crash.queue[0];question.revealed=true;
  probe.answerWordCrashCourse(question.correct);const pending=probe.wordCrashCourseTimer;
  probe.leaveWordCrashCourse();
  assert.equal(probe.crashTimers[pending].cancelled,true,'leaving cancels the timer');
  probe.fireCrashTimer(pending);
  assert.equal(probe.activeWordCrashCourse,null,'a stale callback cannot reopen the course');
  assert.equal(probe.returned,true,'leaving returns to the originating lesson');
  assert.equal(JSON.stringify(probe.state.flashcardProgress),progressBefore,'word practice never writes SRS');
  assert.equal(JSON.stringify(probe.rankState),ranksBefore,'word practice never writes ranks');
});
