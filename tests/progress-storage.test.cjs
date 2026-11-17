const test=require('node:test');
const assert=require('node:assert/strict');
const {createCrashCourseProbe}=require('./app-probe.cjs');

const storageKey='taal-japanse-leerapp-v1';
const reviewKey='vocab-ねこ::jp-nl';
const read=storage=>JSON.parse(storage.get(storageKey));

test('an older tab cannot overwrite a saved medal and Recall review when it closes',()=>{
  const sharedStorage=new Map();
  const current=createCrashCourseProbe({sharedStorage});
  const older=createCrashCourseProbe({sharedStorage});
  current.applyRank('l11-home-1',1);
  current.state.flashcardProgress.cards[reviewKey]={dueAt:2000,repetitions:2};
  assert.equal(current.saveProgress(),true);
  const saved=sharedStorage.get(storageKey);

  // The closing document may have missed the storage event.
  older.fireWindowEvent('pagehide');
  assert.equal(sharedStorage.get(storageKey),saved);
  assert.equal(older.element('progressConflict').classList.contains('hidden'),false);
  const reopened=createCrashCourseProbe({sharedStorage});
  assert.equal(reopened.currentLessonRank('l11-home-1'),'Copper');
  assert.equal(reopened.state.flashcardProgress.cards[reviewKey].repetitions,2);
  assert.equal(reopened.element('progressConflict').classList.contains('hidden'),true);
});

test('simultaneous saves recheck the current version inside the shared lock',async()=>{
  const sharedStorage=new Map();
  let previous=Promise.resolve();
  const locks={request(name,action){
    assert.equal(name,storageKey);
    const result=previous.then(action);
    previous=result;
    return result;
  }};
  const first=createCrashCourseProbe({sharedStorage,locks});
  const second=createCrashCourseProbe({sharedStorage,locks});
  first.applyRank('l11-home-1',1);
  second.applyRank('l11-home-2',1);
  assert.deepEqual(await Promise.all([first.saveProgress(),second.saveProgress()]),[true,false]);
  assert.equal(read(sharedStorage).ranks['l11-home-1'].rank,'Copper');
  assert.equal(read(sharedStorage).ranks['l11-home-2'].rank,null);

  first.fireWindowEvent('storage',{key:storageKey,newValue:'een verouderde gebeurtenis'});
  assert.equal(first.element('progressConflict').classList.contains('hidden'),true);
  sharedStorage.delete(storageKey);
  first.fireWindowEvent('storage',{key:storageKey,newValue:null});
  assert.equal(first.element('progressConflict').classList.contains('hidden'),false);
  assert.equal(await first.saveProgress(),false);
  assert.equal(sharedStorage.has(storageKey),false,'an older tab cannot restore deleted progress');
});

test('reload recovers a pending save only if its starting version is still current',()=>{
  for(const newerSave of [false,true]){
    const sharedStorage=new Map(),tabStorage=new Map();
    // Simulate reloading before the pending lock request can run.
    const locks={request(){return new Promise(()=>{})}};
    const closing=createCrashCourseProbe({sharedStorage,tabStorage,locks});
    closing.applyRank('l11-home-1',1);
    closing.fireWindowEvent('pagehide');
    assert.equal(tabStorage.size,1);
    if(newerSave){
      const other=createCrashCourseProbe({sharedStorage});
      other.applyRank('l11-home-2',1);
      other.saveProgress();
    }
    const reopened=createCrashCourseProbe({sharedStorage,tabStorage});
    assert.equal(reopened.currentLessonRank('l11-home-1'),newerSave?null:'Copper');
    assert.equal(reopened.currentLessonRank('l11-home-2'),newerSave?'Copper':null);
    assert.equal(tabStorage.size,0);
  }
});

test('a thematic quiz can continue after the browser has committed its rank',async()=>{
  const sharedStorage=new Map();
  let previous=Promise.resolve();
  const locks={request(_name,action){previous=previous.then(action);return previous}};
  const app=createCrashCourseProbe({sharedStorage,locks});
  app.state.level=10;app.openThematicLesson(0);
  const course=app.thematicCourses[10],lesson=course.lessons[0];
  app.state.thematicCompleted[lesson.id]={A:true,B:true};
  app.renderThematicLesson(app.element('testHost'),course);
  app.element('thematicCheck').onclick();
  app.state.quiz.score=app.state.quiz.questions.length;
  const finish=app.finishQuiz();
  assert.equal(app.element('nextBtn').classList.contains('hidden'),true);
  await finish;
  assert.equal(read(sharedStorage).ranks[lesson.id].rank,'Copper');
  assert.equal(app.element('nextBtn').classList.contains('hidden'),false);
});
