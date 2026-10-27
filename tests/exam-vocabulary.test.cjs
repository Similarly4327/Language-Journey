const test=require('node:test');
const assert=require('node:assert/strict');
const content=require('../language-journey-content/content.js');
const {createCrashCourseProbe}=require('./app-probe.cjs');

const now=Date.UTC(2026,9,27,12),day=86400000;
const plain=value=>JSON.parse(JSON.stringify(value));
const ids=words=>Array.from(words,word=>word.id).sort();
const currentState={thematicRevision:1,level11IntegrationRevision:2};
const levelWords=level=>content.vocabCatalog.filter(word=>!word.legacy&&word.sourceFound&&word.level===level);
function startExam(app,level,{official=true,rankId=`l${level}-exam`}={}){
  app.state.level=level-1;
  app.startQuiz({source:'advanced',title:`Level ${level} examen`,rankId,official,rankThreshold:level===11?.8:.9,
    questions:Array.from({length:10},()=>({kind:'mc',prompt:'Vraag',correct:'Goed',choices:['Goed','Fout']}))});
}
function finish(app,score=app.state.quiz.questions.length){
  app.state.quiz.score=score;app.state.quiz.index=app.state.quiz.questions.length;app.finishQuiz();
}

test('a passed exam registers the exact current level vocabulary before recording word growth, once only',()=>{
  for(let level=4;level<=15;level++){
    const app=createCrashCourseProbe({savedState:currentState,now}),expected=ids(levelWords(level));
    assert.ok(expected.length,`Level ${level} has lexical targets`);
    startExam(app,level);
    assert.equal(app.learnedVocabEntries().length,0,'starting an exam does not introduce its vocabulary');
    finish(app,level===11?8:9);
    assert.equal(app.state.quiz.newWordCount,expected.length);
    assert.deepEqual(ids(app.learnedVocabEntries()),expected,`Level ${level}: no earlier, future, legacy or kana items`);
    assert.deepEqual(Array.from(app.state.introducedVocabIds).sort(),expected);
    assert.deepEqual(ids(app.flashcardEligibleCards()),expected,'Recall uses the same source-backed words');
    assert.equal(app.rankState[`l${level}-exam`].rank,'Copper');
    assert.ok(levelWords(level).every(word=>!app.rankState[word.lessonId]?.rank),'lesson ranks are not invented');
    const session=app.state.studyTracker.sessions.at(-1);
    assert.equal(session.snapshotStart.vocab,0);assert.equal(session.snapshotEnd.vocab,expected.length);
    assert.ok(app.state.studyTracker.events.some(event=>event.sessionId===session.id&&event.title===`+${expected.length} woorden geleerd`));
    const saved=app.persisted(); // Read storage without forcing another save.
    const reopened=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks,now:now+120*day});
    assert.deepEqual(ids(reopened.learnedVocabEntries()),expected,'words survive a long absence');
    assert.deepEqual(ids(reopened.flashcardEligibleCards()),expected);
    startExam(reopened,level);finish(reopened);
    assert.equal(reopened.state.quiz.newWordCount,0,'a repeated pass counts no word twice');
    assert.equal(reopened.state.studyTracker.sessions.at(-1).snapshotEnd.vocab,expected.length);
    assert.equal(new Set(reopened.state.introducedVocabIds).size,expected.length);
  }
});

test('partial knowledge, original first-seen dates, manual Recall selection and both SRS directions survive an exam',()=>{
  const words=levelWords(4),known=words.slice(0,3),priorDate='2026-09-01';
  const cards=Object.fromEntries(['jp-nl','nl-jp'].map(direction=>[`${known[0].id}::${direction}`,{dueAt:now+12*day,intervalDays:12,repetitions:5,lapses:1,lastReviewedAt:now-day,lastGrade:'knew'}]));
  const app=createCrashCourseProbe({now,savedState:{...currentState,introducedVocabIds:[known[0].id],vocabFirstSeen:{[known[1].id]:priorDate},flashcardProgress:{cards},flashcardSelection:{auto:false,lessonIds:[words[0].lessonId],direction:'nl-jp'}}});
  app.rankState[known[2].lessonId].rank='Copper';
  const before=app.knowledgeSnapshot().vocab,srs=JSON.stringify(app.state.flashcardProgress),selection=JSON.stringify(app.state.flashcardSelection),mastery=JSON.stringify(app.vocabMastery);
  const knownBefore=new Set(ids(app.learnedVocabEntries()));
  startExam(app,4);finish(app);
  assert.equal(app.state.quiz.newWordCount,words.length-before);
  assert.equal(app.knowledgeSnapshot().vocab-before,words.length-before);
  assert.equal(app.state.vocabFirstSeen[known[1].id],priorDate);
  for(const word of words)if(knownBefore.has(word.id)&&word.id!==known[1].id)assert.equal(app.state.vocabFirstSeen[word.id],undefined,'undated old knowledge keeps its unknown date');
  assert.equal(JSON.stringify(app.state.flashcardProgress),srs,'a pass is not an SRS review');
  assert.equal(JSON.stringify(app.state.flashcardSelection),selection,'manual selection remains selected');
  assert.equal(JSON.stringify(app.vocabMastery),mastery,'unseen words get no invented mastery');
  assert.deepEqual(ids(app.flashcardSelectedCards()),ids(words.filter(word=>word.lessonId===words[0].lessonId)));
  const saved=app.persisted(),reloaded=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks,now:now+day});
  assert.equal(JSON.stringify(reloaded.state.flashcardProgress),srs);
  assert.equal(JSON.stringify(reloaded.state.flashcardSelection),selection);
  assert.deepEqual(plain(saved.vocabMastery),plain(app.vocabMastery));
});

test('only a fresh passed level exam registers words; failed, abandoned, lesson and practice attempts do not',()=>{
  for(const mode of ['failed','abandoned','lesson','practice']){
    const app=createCrashCourseProbe({savedState:currentState,now});
    startExam(app,4,{official:mode!=='practice',rankId:mode==='lesson'?'l4-1':'l4-exam'});
    if(mode==='abandoned')app.goToLevels();else finish(app,mode==='failed'?8:10);
    assert.deepEqual(Array.from(app.state.introducedVocabIds),[],mode);
    assert.deepEqual(Object.keys(app.state.vocabFirstSeen),[],mode);
    if(mode==='failed'||mode==='abandoned')assert.equal(app.rankState['l4-exam'].rank,null);
    const saved=app.persisted();assert.deepEqual(saved.state.introducedVocabIds,[],mode);
  }
  for(const [level,rankId] of [[1,'hiragana-exam1'],[2,'mix-exam1'],[3,'dak-examA']]){
    const app=createCrashCourseProbe({savedState:currentState,now});startExam(app,level,{rankId});finish(app);
    assert.equal(app.state.quiz.newWordCount,0,'kana exams cannot add sounds to the word counter');
    assert.equal(app.knowledgeSnapshot().vocab,0);
  }
});

test('a fresh current exam unlocks deferred level words while preserving deferred future words',()=>{
  const current=levelWords(11),future=levelWords(12)[0].id;
  const app=createCrashCourseProbe({savedState:{...currentState,deferredVocabIntroductions:[...current.map(word=>word.id),future]},now});
  startExam(app,11);finish(app,8);
  assert.deepEqual(ids(app.flashcardEligibleCards()),ids(current));
  assert.deepEqual(Array.from(app.state.deferredVocabIntroductions),[future]);
  assert.equal(app.state.quiz.newWordCount,current.length);
});

test('pagehide and hidden-page events flush pending word changes even without an active study session',()=>{
  for(const event of ['pagehide','visibilitychange']){
    const app=createCrashCourseProbe({savedState:currentState,now}),id=levelWords(4)[0].id;
    app.state.introducedVocabIds.push(id);app.scheduleSave();
    assert.equal(app.state.studyTracker.active,null);
    assert.ok(!app.persisted().state.introducedVocabIds?.includes(id),'debounced write has not fired');
    if(event==='pagehide')app.fireWindowEvent(event);else{app.document.hidden=true;app.fireDocumentEvent(event)}
    assert.ok(app.persisted().state.introducedVocabIds.includes(id),event);
    const saved=app.persisted(),reopened=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks,now:now+120*day});
    assert.ok(reopened.state.introducedVocabIds.includes(id));
  }
});
