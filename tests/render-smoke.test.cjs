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
  const source=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/\}\)\(\);\s*$/, 'globalThis.__probe={state,rankState,vocabMastery,itemMastery,renderMain,advancedPracticeQuestions,languagePracticeQuestions,advancedCourses,langLessons,coursePhases,renderCoursePhase,phaseGuideCopy,storageStateSnapshot,loadProgress,renderLanguageExam,renderAdvancedExam,lessonQuestionInstruction,advancedWordStages};})();');
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
