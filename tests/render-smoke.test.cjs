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

test('all level screens render through the imported content adapter',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const source=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/\}\)\(\);\s*$/, 'globalThis.__probe={state,rankState,vocabMastery,itemMastery,renderMain,advancedPracticeQuestions,languagePracticeQuestions,advancedCourses,langLessons,coursePhases,renderCoursePhase,phaseGuideCopy,storageStateSnapshot,loadProgress,renderLanguageExam,renderAdvancedExam,lessonQuestionInstruction,advancedWordStages,lessonNewWords,wordCrashCourseDeck,wordCrashCourseAccepts,renderLanguageWords,renderAdvancedWords,beginWordCrashCourse,answerWordCrashCourse,advanceWordCrashCourse,leaveWordCrashCourse,element(id){return $(id)},get activeWordCrashCourse(){return activeWordCrashCourse},manifest:window.LanguageJourneyContent.manifest};})();');
  const elements=new Map();
  const get=id=>{if(!elements.has(id))elements.set(id,fakeElement(id));return elements.get(id)};
  const document={body:fakeElement('body'),documentElement:fakeElement('html'),hidden:false,getElementById:get,createElement:()=>fakeElement(),querySelectorAll:()=>[],querySelector:()=>fakeElement(),addEventListener(){}};
  const storage=new Map();
  storage.set('taal-japanse-leerapp-v1',JSON.stringify({version:6,state:{screen:'home',userName:'Testgebruiker',introducedVocabIds:['vocab-ねこ','vocab-かばん'],flashcardProgress:{cards:{'vocab-ねこ::jp-nl':{dueAt:123456789,intervalDays:3,repetitions:2,lapses:0,lastGrade:'knew'}}}},ranks:{'l4-1':{rank:'Silver',last:.95,attempts:3}},vocabMastery:{'vocab-ねこ':{score:40}},itemMastery:{'hiragana-あ':{score:20}}}));
  const localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
  const window={LanguageJourneyContent:content,innerWidth:390,innerHeight:844,addEventListener(){},setTimeout(){},matchMedia:()=>({matches:false,addEventListener(){}})};
  const context={document,window,localStorage,location:{hash:''},performance:{now:()=>0},navigator:{},console,setTimeout(){},clearTimeout(){},requestAnimationFrame(){},structuredClone,URL,Date,Math,Intl,alert(){},Image:class{}};
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
  for(let level=0;level<content.levels.length;level++){
    context.__probe.state.screen='module';
    context.__probe.state.level=level;
    assert.doesNotThrow(()=>context.__probe.renderMain(),`Level ${level+1} failed`);
  }
  for(let index=0;index<context.__probe.langLessons.length;index++){
    const questions=context.__probe.languagePracticeQuestions(context.__probe.langLessons[index],index);
    assert.equal(questions.length,10,`Level 4 lesson ${index+1} practice count`);
    assert.equal(questions.filter(question=>question.kind==='build').length,2);
  }
  for(const [level,course] of Object.entries(context.__probe.advancedCourses)){
    course.lessons.forEach((lesson,index)=>{
      const questions=context.__probe.advancedPracticeQuestions(course,lesson,index);
      assert.equal(questions.length,10,`Level ${course.number} lesson ${index+1} practice count`);
      assert.equal(questions.filter(question=>question.kind==='build').length,2);
      assert.ok(context.__probe.advancedWordStages(lesson).core.length<=2,`Level ${course.number} lesson ${index+1} starts with at most two new words`);
    });
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
  assert.ok(wordCrashCourseDeck(oneWord).every(question=>question.selfReveal),'one-word lessons use a reveal and self-assessment instead of outside distractors');

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
  assert.equal(context.__probe.lessonQuestionInstruction({kind:'fill',prompt:'パン を ふたつ ___'}),'Maak de Japanse zin af met het juiste blok.');

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
