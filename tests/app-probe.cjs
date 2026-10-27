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
    setAttribute(){},getAttribute(){return null},removeAttribute(){},appendChild(){},insertAdjacentHTML(){},insertBefore(){},prepend(){},remove(){},addEventListener(type,handler){listeners.set(type,handler)},querySelector(){return fakeElement()},querySelectorAll(){return []},scrollIntoView(){},focus(){},getBoundingClientRect(){return{width:300,height:200,top:0,left:0}}};
}

function createCrashCourseProbe({savedState={},savedRanks={},version=9,seed=1,now=null,feedbackTimers=false}={}){
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').replace('let hadSavedProgress=false;','globalThis.__thematic={thematicQuestions,startThematicPart,thematicAnswer,thematicAdvance,thematicNextQuestion,renderMain,dialogueHtml,cancelQuestionAdvance,flashcardEligibleCards};let hadSavedProgress=false;');
const source=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/\}\)\(\);\s*$/,'globalThis.__probe={state,rankState,openThematicLesson,buildLevel11IntegrationQuestions,startLevel11IntegrationExam,level11ExamReady,recordLevel11IntegrationPass,level11RecallBonusIds,getRecallSession,flashcardRate,freePracticeCards,advancedCourses,langLessons,lessonNewWords,wordCrashCourseDeck,wordCrashCourseAccepts,compactExamReport,assertCompactExam,examQuestionBudget,buildDakExamQuestions,dakutenPatterns,beginWordCrashCourse,answerWordCrashCourse,advanceWordCrashCourse,leaveWordCrashCourse,completeWordCrashCourse,element(id){return $(id)},get activeWordCrashCourse(){return activeWordCrashCourse},get wordCrashCourseTimer(){return wordCrashCourseTimer},fireCrashTimer(id){const timer=window.crashTimers[id];if(timer&&!timer.cancelled&&!timer.fired){timer.fired=true;timer.callback()}},get crashTimers(){return window.crashTimers},thematicCourses,thematicLevelLabel,thematicLessonLabel,thematicLessonTitle,thematicUiLabel,thematicInstructionHtml,thematicQuizTitle,renderThematicList,renderThematicLesson,japaneseWordHtml,localizedLevel};})();');
  const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,fakeElement(id));return elements.get(id)};
  const timers=[],storage=new Map(),windowEvents=new Map(),documentEvents=new Map();
  const listen=(events,type,handler)=>{if(!events.has(type))events.set(type,[]);events.get(type).push(handler)};
  const document={body:fakeElement('body'),documentElement:fakeElement('html'),hidden:false,getElementById:get,createElement:()=>fakeElement(),querySelectorAll:()=>[],querySelector:()=>fakeElement(),addEventListener:(type,handler)=>listen(documentEvents,type,handler)};
  storage.set('taal-japanse-leerapp-v1',JSON.stringify({version,state:savedState,ranks:savedRanks}));
  const localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
  const window={LanguageJourneyContent:content,crashTimers:timers,innerWidth:390,innerHeight:844,scrollTo(){},addEventListener:(type,handler)=>listen(windowEvents,type,handler),setTimeout:(callback,delay)=>{timers.push({callback,delay,cancelled:false,fired:false});return timers.length-1},clearTimeout:id=>{if(timers[id])timers[id].cancelled=true},matchMedia:()=>({matches:false,addEventListener(){}})};
  const seededMath=Object.create(Math);seededMath.random=seededRandom(seed);
  const clock={now:now??Date.now()};const NativeDate=Date;class FixedDate extends NativeDate{constructor(...args){super(...(args.length?args:[clock.now]))}static now(){return clock.now}}
  const context={document,window,localStorage,location:{hash:''},performance:{now:()=>0},navigator:{},console,setTimeout:feedbackTimers?window.setTimeout:()=>{},clearTimeout:feedbackTimers?window.clearTimeout:()=>{},requestAnimationFrame(){},structuredClone,URL,Date:now===null?Date:FixedDate,Math:seededMath,Intl,alert(){},Image:class{}};
  for(const [,relative] of html.matchAll(/<script src="\.\/([^"?]+)(?:\?[^\"]*)?"><\/script>/g)){
    if(relative==='language-journey-content/content.js')continue;
    vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',relative),'utf8'),context,{timeout:5000});
  }
  vm.runInNewContext(source.replace('globalThis.__probe={state,rankState,','globalThis.__probe={state,rankState,vocabMastery,itemMastery,document,learnedVocabEntries,knowledgeSnapshot,registerPassedLevelExamWords,scheduleSave,beginStudySession,completeStudySession,pauseActiveStudySession,resumeActiveStudySession,recoverInterruptedStudySession,activeElapsedSeconds,studySessions,totalStudySeconds,studyTotals,normalizeStudySession,progressSummaryPoints,progressDailyMeasurements,createFlashcardSession,pauseFlashcardSession,resumeFlashcardSession,flashcardNextCard,flashcardSkip,renderFlashcardsScreen,openFlashcards,openDictionaryModal,closeDictionaryModal,goToLevels,show,startQuiz,finishQuiz,renderStudyActivities,smallLessons,wordCoverageReport,assertWordCoverage,buildWordCoveredExam,buildLanguageExamQuestions,buildSmallExamQuestions,smallExamQuestionPool,renderDakExams,levelRankIds,levelRank,quizMetaText,recommendedNextStep,buildDakExamQuestions,renderQuestion,renderLanguageModel,renderSmallLessonCard,renderAdvancedModel,startLanguageExam,startSmallExam,startDakExam,lessonCanonicalGoals,renderMonthLesson,startMonthPractice,saveProgress,currentLessonRank,flashcardSelectedCards,advancedQuestions,advancedQuestionPool,buildAdvancedExamQuestions,lessonCoverageReport,levelCoverageReport,applyRank,'),context,{timeout:5000});
  Object.assign(context.__probe,context.__thematic);
  context.__probe.saved=()=>{context.__probe.saveProgress();return JSON.parse(storage.get('taal-japanse-leerapp-v1'))};
  context.__probe.persisted=()=>JSON.parse(storage.get('taal-japanse-leerapp-v1'));
  context.__probe.fireWindowEvent=type=>(windowEvents.get(type)||[]).forEach(handler=>handler());
  context.__probe.fireDocumentEvent=type=>(documentEvents.get(type)||[]).forEach(handler=>handler());
  context.__probe.setNow=value=>clock.now=value;
  return context.__probe;
}

function seededRandom(seed){let value=seed>>>0;return()=>{value=(value+0x6d2b79f5)>>>0;let t=value;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}

module.exports={createCrashCourseProbe,fakeElement,seededRandom};
