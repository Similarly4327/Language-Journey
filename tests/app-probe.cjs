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

function createCrashCourseProbe({savedState={},savedRanks={},version=9,seed=1}={}){
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const source=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/\}\)\(\);\s*$/,'globalThis.__probe={state,rankState,advancedCourses,langLessons,lessonNewWords,wordCrashCourseDeck,wordCrashCourseAccepts,beginWordCrashCourse,answerWordCrashCourse,advanceWordCrashCourse,leaveWordCrashCourse,completeWordCrashCourse,element(id){return $(id)},get activeWordCrashCourse(){return activeWordCrashCourse},get wordCrashCourseTimer(){return wordCrashCourseTimer},fireCrashTimer(id){const timer=window.crashTimers[id];if(timer&&!timer.cancelled&&!timer.fired){timer.fired=true;timer.callback()}},get crashTimers(){return window.crashTimers}};})();');
  const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,fakeElement(id));return elements.get(id)};
  const timers=[],storage=new Map();
  const document={body:fakeElement('body'),documentElement:fakeElement('html'),hidden:false,getElementById:get,createElement:()=>fakeElement(),querySelectorAll:()=>[],querySelector:()=>fakeElement(),addEventListener(){}};
  storage.set('taal-japanse-leerapp-v1',JSON.stringify({version,state:savedState,ranks:savedRanks}));
  const localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
  const window={LanguageJourneyContent:content,crashTimers:timers,innerWidth:390,innerHeight:844,addEventListener(){},setTimeout:(callback,delay)=>{timers.push({callback,delay,cancelled:false,fired:false});return timers.length-1},clearTimeout:id=>{if(timers[id])timers[id].cancelled=true},matchMedia:()=>({matches:false,addEventListener(){}})};
  const seededMath=Object.create(Math);seededMath.random=seededRandom(seed);
  const context={document,window,localStorage,location:{hash:''},performance:{now:()=>0},navigator:{},console,setTimeout(){},clearTimeout(){},requestAnimationFrame(){},structuredClone,URL,Date,Math:seededMath,Intl,alert(){},Image:class{}};
  for(const [,relative] of html.matchAll(/<script src="\.\/([^"?]+)(?:\?[^\"]*)?"><\/script>/g)){
    if(relative==='language-journey-content/content.js')continue;
    vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',relative),'utf8'),context,{timeout:5000});
  }
  vm.runInNewContext(source.replace('globalThis.__probe={state,rankState,','globalThis.__probe={state,rankState,smallLessons,wordCoverageReport,assertWordCoverage,buildWordCoveredExam,buildLanguageExamQuestions,buildSmallExamQuestions,renderLanguageModel,renderSmallLessonCard,renderAdvancedModel,startLanguageExam,startSmallExam,startDakExam,lessonCanonicalGoals,renderMonthLesson,startMonthPractice,saveProgress,currentLessonRank,flashcardSelectedCards,advancedQuestions,advancedQuestionPool,buildAdvancedExamQuestions,lessonCoverageReport,levelCoverageReport,applyRank,'),context,{timeout:5000});
  context.__probe.saved=()=>{context.__probe.saveProgress();return JSON.parse(storage.get('taal-japanse-leerapp-v1'))};
  return context.__probe;
}

function seededRandom(seed){let value=seed>>>0;return()=>{value=(value+0x6d2b79f5)>>>0;let t=value;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}

module.exports={createCrashCourseProbe,fakeElement,seededRandom};
