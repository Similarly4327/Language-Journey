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
  const source=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/\}\)\(\);\s*$/,'globalThis.__probe={state,rankState,advancedCourses,langLessons,lessonNewWords,wordCrashCourseDeck,wordCrashCourseAccepts,beginWordCrashCourse,answerWordCrashCourse,advanceWordCrashCourse,leaveWordCrashCourse,element(id){return $(id)},get activeWordCrashCourse(){return activeWordCrashCourse},get wordCrashCourseTimer(){return wordCrashCourseTimer},fireCrashTimer(id){const timer=window.crashTimers[id];if(timer&&!timer.cancelled&&!timer.fired){timer.fired=true;timer.callback()}},get crashTimers(){return window.crashTimers}};})();');
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
  const source=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/\}\)\(\);\s*$/, 'globalThis.__probe={state,rankState,vocabMastery,itemMastery,renderMain,advancedPracticeQuestions,advancedQuestions,advancedQuestionsFromPool,advancedQuestionPool,advancedExamQuestions,advancedExamQuestionsFromPool,advancedExamQuestionCounts,languagePracticeQuestions,level4QuestionBank,balancedLevel4Questions,selectDistinctLessonQuestions,lessonQuestion,advancedCourses,langLessons,smallLessons,coursePhases,renderCoursePhase,phaseGuideCopy,storageStateSnapshot,loadProgress,renderLanguageExam,renderAdvancedExam,lessonQuestionInstruction,advancedWordStages,lessonNewWords,wordCrashCourseDeck,wordCrashCourseAccepts,renderLanguageWords,renderAdvancedWords,beginWordCrashCourse,answerWordCrashCourse,advanceWordCrashCourse,leaveWordCrashCourse,element(id){return $(id)},get activeWordCrashCourse(){return activeWordCrashCourse},manifest:window.LanguageJourneyContent.manifest};})();');
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
  assert.equal(fixedQuestions.length,150,'the revised fixed bank keeps all 150 Level 4–10 questions');
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
  const level4ExamUsed=new Set(),level4Exam=[];
  for(const category of ['vocab','meaning','structure','build','integration']){
    const selected=context.__probe.balancedLevel4Questions(9,6,[category],level4ExamUsed);
    assert.equal(selected.length,6,`Level 4 exam selects six ${category} questions`);
    level4Exam.push(...selected);
  }
  assert.equal(level4Exam.length,30,'Level 4 exam contains 30 questions');
  assertDistinctTargets(level4Exam,'Level 4 exam');
  for(let index=0;index<context.__probe.langLessons.length;index++)assertQuestionBank(context.__probe.level4QuestionBank(index),`Level 4 lesson ${index+1} generated bank`);
  for(const lesson of context.__probe.smallLessons){
    const bank=lesson.check.map(raw=>context.__probe.lessonQuestion(raw,lesson));
    assert.equal(bank.length,8,`${lesson.id} retains its eight fixed questions`);
    const quick=context.__probe.selectDistinctLessonQuestions(bank,5),exam=context.__probe.selectDistinctLessonQuestions(bank,5);
    assert.equal(quick.length,5,`${lesson.id} quick check selects five questions`);
    assert.equal(exam.length,5,`${lesson.id} contributes five Level 5 exam questions`);
    assertDistinctTargets(quick,`${lesson.id} quick check`);assertDistinctTargets(exam,`${lesson.id} exam selection`);
    assertQuestionBank(bank,`Level 5 lesson ${lesson.id}`);
  }
  for(let level=0;level<content.levels.length;level++){
    context.__probe.state.screen='module';
    context.__probe.state.level=level;
    assert.doesNotThrow(()=>context.__probe.renderMain(),`Level ${level+1} failed`);
  }
  for(let index=0;index<context.__probe.langLessons.length;index++){
    const questions=context.__probe.languagePracticeQuestions(context.__probe.langLessons[index],index);
    const bank=context.__probe.level4QuestionBank(index);
    assert.equal(questions.length,10,`Level 4 lesson ${index+1} practice count (bank ${bank.length}, targets ${new Set(bank.map(question=>question.targetConceptId).filter(Boolean)).size}, builds ${bank.filter(question=>question.kind==='build').length})`);
    assert.equal(questions.filter(question=>question.kind==='build').length,2);
    const availableCurrent=context.__probe.selectDistinctLessonQuestions(bank.filter(question=>question.introducedAt===index),10).length;
    assert.ok(questions.filter(question=>question.introducedAt===index).length>=Math.min(6,availableCurrent),`Level 4 lesson ${index+1} practice uses up to six current targets when distinct lesson material allows`);
    assertDistinctTargets(questions,`Level 4 lesson ${index+1} practice`);
    const mini=context.__probe.balancedLevel4Questions(index,10);
    assert.equal(mini.length,10,`Level 4 lesson ${index+1} mini-check count`);
    assertDistinctTargets(mini,`Level 4 lesson ${index+1} mini-check`);
  }
  const advancedPools=new Map();
  for(const [level,course] of Object.entries(context.__probe.advancedCourses)){
    course.lessons.forEach((lesson,index)=>{
      const questions=context.__probe.advancedPracticeQuestions(course,lesson,index);
      assert.equal(questions.length,10,`Level ${course.number} lesson ${index+1} practice count`);
      assert.equal(questions.filter(question=>question.kind==='build').length,2);
      assertDistinctTargets(questions,`Level ${course.number} lesson ${index+1} practice`);
      const pool=context.__probe.advancedQuestionPool(course,lesson,index),uniqueCurrent=context.__probe.selectDistinctLessonQuestions(pool.current,6);advancedPools.set(lesson.id,pool);
      assertQuestionBank([...pool.current,...pool.review],`Level ${course.number} lesson ${index+1} generated bank`);
      const quick=context.__probe.advancedQuestions(course,lesson,index),quickCurrent=quick.filter(question=>question.isCurrentContent);
      assert.equal(quickCurrent.length,Math.min(6,uniqueCurrent.length),`Level ${course.number} lesson ${index+1} quick check prioritizes distinct current goals`);
      assert.ok(quick.length<=10&&quick.length>=6,`Level ${course.number} lesson ${index+1} quick check is sized to available goals`);
      assertDistinctTargets(quick,`Level ${course.number} lesson ${index+1} quick check`);
      assert.equal(context.__probe.advancedExamQuestions(course,lesson,index,5).length,5,`Level ${course.number} lesson ${index+1} contributes five exam questions`);
      assert.ok(context.__probe.advancedWordStages(lesson).core.length<=2,`Level ${course.number} lesson ${index+1} starts with at most two new words`);
    });
  }
  for(let run=0;run<100;run++){
    const level4ExamUsed=new Set(),level4Exam=[];
    for(const category of ['vocab','meaning','structure','build','integration'])level4Exam.push(...context.__probe.balancedLevel4Questions(9,6,[category],level4ExamUsed));
    assert.equal(level4Exam.length,30,`Level 4 generated exam ${run+1} has 30 questions`);
    assertDistinctTargets(level4Exam,`Level 4 generated exam ${run+1}`);
    for(const [level,course] of Object.entries(context.__probe.advancedCourses)){
      const checkIndex=run%course.lessons.length,checkLesson=course.lessons[checkIndex],check=context.__probe.advancedQuestionsFromPool(advancedPools.get(checkLesson.id));
      assert.ok(check.length>=6&&check.length<=10,`Level ${course.number} generated lesson check ${run+1} is sized to its distinct goals`);
      assertDistinctTargets(check,`Level ${course.number} generated lesson check ${run+1}`);
      const examUsed=new Set(),exam=[],counts=context.__probe.advancedExamQuestionCounts(course);
      for(let index=0;index<course.lessons.length;index++){
        const lesson=course.lessons[index],pool=advancedPools.get(lesson.id);
        const examQuestions=context.__probe.advancedExamQuestionsFromPool(pool,counts[index],examUsed);
        assert.ok(examQuestions.length>=Math.floor(25/course.lessons.length)&&examQuestions.length<=Math.ceil(25/course.lessons.length),`Level ${course.number} generated exam ${run+1} balances lesson question counts`);
        exam.push(...examQuestions);
      }
      assert.equal(exam.length,25,`Level ${course.number} generated exam ${run+1} has 25 questions`);
      assert.equal(new Set(counts).size,course.lessons.length>5?2:1,`Level ${course.number} generated exam ${run+1} assigns any extra question to only one lesson`);
      assertDistinctTargets(exam,`Level ${course.number} generated exam ${run+1}`);
    }
  }
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
  assert.ok(probe.element('advancedWordCrashCourse').onclick);

  const twoWordLesson=probe.advancedCourses[9].lessons.find(lesson=>lesson.id==='l10-2');
  assert.equal(lessonNewWords(twoWordLesson).length,2,'known tea and cake words are not counted again in Level 10, lesson 2');
  probe.renderAdvancedWords(probe.advancedCourses[9],twoWordLesson,9,1);
  wordsMarkup=probe.element('advancedStepBody').innerHTML;
  assert.match(wordsMarkup,/2 nieuwe woorden/);
  assert.doesNotMatch(wordsMarkup,/おちゃ|ケーキ/);
  const manyWordLesson=probe.advancedCourses[7].lessons.find(lesson=>lesson.id==='l8-4');
  assert.equal(lessonNewWords(manyWordLesson).length,5);
  probe.renderAdvancedWords(probe.advancedCourses[7],manyWordLesson,7,3);
  wordsMarkup=probe.element('advancedStepBody').innerHTML;
  lessonNewWords(manyWordLesson).forEach(word=>assert.ok(wordsMarkup.includes(word.jp)));
  assert.doesNotMatch(wordsMarkup,/Daarna uitbreiden|<details/);

  const zeroWordLesson=six.lessons.find(lesson=>lesson.id==='l6-5');
  probe.state.advancedStep[5]='words';probe.renderAdvancedWords(six,zeroWordLesson,5,4);
  assert.doesNotMatch(probe.element('advancedStepBody').innerHTML,/Crash course woorden/);
  assert.ok(probe.element('advancedWordsNext').onclick,'a lesson without new words keeps its normal next step');
  assert.equal(probe.state.advancedStep[5],'words','rendering a no-word lesson does not advance it');

  const progressBeforeCrash=JSON.stringify(probe.state.flashcardProgress),ranksBeforeCrash=JSON.stringify(probe.rankState);
  probe.state.advancedStep[5]='words';probe.state.advancedView[5]='lesson';probe.state.advancedLesson[5]=3;
  probe.renderAdvancedWords(six,fourWordLesson,5,3);
  probe.element('advancedWordCrashCourse').onclick();
  let crash=probe.activeWordCrashCourse;
  assert.equal(crash.phase,'intro');
  lessonNewWords(fourWordLesson).forEach(word=>assert.ok(probe.element('advancedStepBody').innerHTML.includes(word.jp),'all words are shown before testing'));
  probe.element('wordCrashBegin').onclick();
  crash=probe.activeWordCrashCourse;
  let question=crash.queue[0];
  assert.match(probe.element('advancedStepBody').innerHTML,/flashcard-answer-options is-hidden/,'answer options start blurred');
  assert.equal(question.revealed,false);
  probe.element('wordCrashReveal').onclick();
  const wrongIndex=question.choices.findIndex(choice=>!wordCrashCourseAccepts(question,choice));
  probe.element(`wordCrashChoice${wrongIndex}`).onclick();
  assert.match(probe.element('advancedStepBody').innerHTML,/Niet goed\. Juiste antwoord:/);
  assert.equal(probe.answerWordCrashCourse(question.correct),false,'an answer cannot be assessed twice');
  probe.element('wordCrashNext').onclick();
  assert.match(probe.element('advancedStepBody').innerHTML,/flashcard-answer-options is-hidden/,'the blur resets on the next card');
  while(crash.phase==='initial'){
    question=crash.queue[crash.index];question.revealed=true;
    assert.equal(probe.answerWordCrashCourse(question.correct,true),true);
    probe.advanceWordCrashCourse();
  }
  assert.equal(crash.phase,'summary');
  assert.match(probe.element('advancedStepBody').innerHTML,/Crash course afgerond/);
  assert.equal(Object.keys(crash.missed).length,0,'a later correct answer clears an earlier miss for the same direction');
  assert.match(probe.element('advancedStepBody').innerHTML,/Nog een keer/);
  assert.equal(JSON.stringify(probe.state.flashcardProgress),progressBeforeCrash,'the course does not create or reschedule SRS reviews');
  assert.equal(JSON.stringify(probe.rankState),ranksBeforeCrash,'the course does not change lesson ranks');
  assert.equal(probe.state.advancedStep[5],'words','the course does not mark the lesson step complete');
  probe.element('wordCrashAgain').onclick();assert.equal(crash.phase,'intro','the short course can restart');
  probe.element('wordCrashExit').onclick();assert.equal(probe.activeWordCrashCourse,null);
  assert.equal(probe.state.advancedStep[5],'words','interrupting returns to the same lesson step');
  assert.match(probe.element('advancedStepBody').innerHTML,/Naar het nieuwe patroon/);

  probe.beginWordCrashCourse({hostId:'advancedStepBody',lesson:fourWordLesson,words:lessonNewWords(fourWordLesson),returnToLesson:()=>{}});
  probe.element('wordCrashBegin').onclick();crash=probe.activeWordCrashCourse;
  const retryKey=crash.deck[0].key;
  while(crash.phase==='initial'){
    question=crash.queue[crash.index];question.revealed=true;
    if(question.key===retryKey){
      const wrong=question.choices.find(choice=>!wordCrashCourseAccepts(question,choice));
      probe.answerWordCrashCourse(wrong);
    }else probe.answerWordCrashCourse(question.correct);
    probe.advanceWordCrashCourse();
  }
  assert.equal(crash.phase,'review','words missed on both starting assessments return once');
  assert.equal(crash.queue.length,1);
  question=crash.queue[0];question.revealed=true;probe.answerWordCrashCourse(question.correct);probe.advanceWordCrashCourse();
  assert.equal(crash.phase,'summary');
  assert.equal(Object.keys(crash.missed).length,0,'a correct retry removes the miss from the summary');
  probe.leaveWordCrashCourse();

  let returnedToOneWordStep=false;probe.state.langStep='words';
  probe.beginWordCrashCourse({hostId:'langStepBody',lesson:oneWordLesson,words:oneWord,returnToLesson:()=>{returnedToOneWordStep=probe.state.langStep==='words'}});
  probe.element('wordCrashBegin').onclick();
  assert.match(probe.element('langStepBody').innerHTML,/Tik om te tonen/);
  probe.element('wordCrashReveal').onclick();
  assert.match(probe.element('langStepBody').innerHTML,/wordCrashSelfKnown/);
  probe.element('wordCrashSelfAgain').onclick();
  assert.match(probe.element('langStepBody').innerHTML,/Niet goed\. Juiste antwoord:/);
  probe.element('wordCrashNext').onclick();
  probe.leaveWordCrashCourse();
  assert.equal(returnedToOneWordStep,true,'self-reveal practice can be interrupted without advancing the lesson');

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
  const saved={version:7,state:persisted,ranks:{},itemMastery:{},vocabMastery:{}};
  storage.set('taal-japanse-leerapp-v1',JSON.stringify(saved));
  state.openPhaseId=foundation.id;
  loadProgress();
  assert.equal(state.openPhaseId,travel.id,'a returning learner restores the saved phase');
  phaseRows=coursePhases.map(phase=>renderCoursePhase(phase));
  assert.deepEqual(phaseRows.filter(row=>row.open).map(row=>row.className),['course-phase'],'a returning learner sees only the saved phase open');
});

test('crash course mixes all planned questions and safely auto-advances correct answers',()=>{
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
  const begin=()=>probe.beginWordCrashCourse({hostId:'crashHost',lesson,words,returnToLesson:()=>{probe.returned=true}});
  begin();probe.element('wordCrashBegin').onclick();
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

  probe.returned=false;begin();probe.element('wordCrashBegin').onclick();
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
  assert.match(probe.element('crashHost').innerHTML,/Crash course afgerond/);
  const firstSessionDeck=crash.deck;
  probe.element('wordCrashAgain').onclick();
  assert.notEqual(crash.deck,firstSessionDeck,'restart shuffles a fresh question order');
  probe.element('wordCrashExit').onclick();
  assert.equal(probe.activeWordCrashCourse,null);

  probe.returned=false;begin();probe.element('wordCrashBegin').onclick();
  crash=probe.activeWordCrashCourse;question=crash.queue[0];question.revealed=true;
  probe.answerWordCrashCourse(question.correct);const pending=probe.wordCrashCourseTimer;
  probe.leaveWordCrashCourse();
  assert.equal(probe.crashTimers[pending].cancelled,true,'leaving cancels the timer');
  probe.fireCrashTimer(pending);
  assert.equal(probe.activeWordCrashCourse,null,'a stale callback cannot reopen the course');
  assert.equal(probe.returned,true,'leaving returns to the originating lesson');
  assert.equal(JSON.stringify(probe.state.flashcardProgress),progressBefore,'the crash course never writes SRS');
  assert.equal(JSON.stringify(probe.rankState),ranksBefore,'the crash course never writes ranks');
});
