const test=require('node:test'),assert=require('node:assert/strict');
const content=require('../language-journey-content/content.js');
const levels=require('../language-journey-content/level-contract.js');
const {createCrashCourseProbe}=require('./app-probe.cjs');

test('visible order preserves content IDs and places the introduction at Level 7',()=>{
  const contracts=levels.makeContracts(content);
  assert.deepEqual(contracts.slice(0,10).map(level=>level.id),['kana-foundation','level-3','level-4','level-5','level-6','level-7','social-intro','level-8','level-9','level-10']);
  assert.deepEqual(levels.contractForVisible(contracts,1).internalIndexes,[0,1]);
  assert.equal(levels.contractForInternal(contracts,6).id,'level-7');
  assert.equal(levels.contractForInternal(contracts,6,'intro').id,'social-intro');
  assert.equal(levels.contractForVisible(contracts,7).examId,'intro-exam');
  assert.equal(levels.contractForVisible(contracts,11).lessonIds[0],'l11-home-1');
  assert.equal(levels.contractForVisible(contracts,15).lessonIds[0],'l11-1');
  assert.deepEqual(levels.validateContracts(contracts,content),[]);
});

test('legacy kana credit needs both directions and is conservative and idempotent',()=>{
  const partial={ranks:{'mix-exam1':{rank:'Gold',last:1,attempts:4}},state:{introducedVocabIds:['vocab-ねこ']}};
  const before=structuredClone(partial);levels.migrateKanaExam(partial);assert.deepEqual(partial,before);
  partial.ranks['mix-exam2']={rank:'Copper',last:.91,attempts:1};
  const originals=structuredClone(partial.ranks);levels.migrateKanaExam(partial);
  assert.equal(partial.ranks[levels.kanaExamId].rank,'Copper');
  assert.deepEqual(partial.ranks['mix-exam1'],originals['mix-exam1']);
  assert.deepEqual(partial.ranks['mix-exam2'],originals['mix-exam2']);
  const once=structuredClone(partial);levels.migrateKanaExam(partial);assert.deepEqual(partial,once);
  partial.ranks[levels.kanaExamId].rank='Silver';levels.migrateKanaExam(partial);assert.equal(partial.ranks[levels.kanaExamId].rank,'Silver');
});

test('only designated exams award levels, and validator catches broken links',()=>{
  const contracts=levels.makeContracts(content),intro=levels.contractForVisible(contracts,7);
  assert.equal(levels.rankFor(intro,{'l7-exam':{rank:'Gold'}}),null);
  assert.equal(levels.rankFor(intro,{'intro-exam':{rank:'Copper'}}),'Copper');
  intro.award.examId='other';intro.lessonIds.push('missing');
  const errors=levels.validateContracts(contracts,content).map(issue=>issue.code);
  assert.ok(errors.includes('EXAM_AWARD'));assert.ok(errors.includes('UNKNOWN_LESSON'));
});

test('level contracts use registered audio for generated kana, examples, introductions and lesson sources',()=>{
  const contracts=levels.makeContracts(content),get=number=>levels.contractForVisible(contracts,number);
  const kana=get(1),small=get(4),intro=get(7),home=get(11);
  assert.ok(kana.audioIds.includes('kana-hiragana-あ'));assert.ok(kana.audioIds.includes('kana-katakana-ア'));assert.ok(kana.audioIds.includes('number-1'));
  assert.ok(small.wordIds.includes('vocab-きゃく'));assert.ok(small.audioIds.includes('vocab-きゃく'));assert.ok(small.audioIds.includes('kana-combo-きゃ'));
  assert.ok(intro.audioIds.includes('vocab-intro-morning'));assert.ok(intro.audioIds.some(id=>content.audioEntryById[id]?.kind==='sentence'));
  assert.ok(home.audioIds.includes('vocab-わたし'));assert.ok(home.audioIds.some(id=>content.audioEntryById[id]?.kind==='passage'));
  assert.deepEqual(home.kanjiIntroductions.find(item=>item.id==='vocab-わたし'),{id:'vocab-わたし',form:'私',point:'11-1-B',lessonId:'l11-home-1'});
  assert.deepEqual(home.kanjiTargets.find(item=>item.id==='vocab-わたし'),{id:'vocab-わたし',lessonId:'l11-home-1',block:'B',exerciseId:'exercise-l11-home-1-watashi-kanji'});
  for(const contract of contracts)for(const id of contract.audioIds)assert.ok(content.audioEntryById[id],`${contract.id}: ${id}`);
  home.audioIds.push('unregistered-audio');assert.ok(levels.validateContracts(contracts,content).some(issue=>issue.code==='UNKNOWN_AUDIO'&&issue.message==='unregistered-audio'));
});

test('combined kana exam covers both directions and its Copper survives a reload',()=>{
  const app=createCrashCourseProbe();app.state.level=1;app.startKanaCompleteExam();
  assert.equal(app.state.quiz.rankId,levels.kanaExamId);
  const questions=app.state.quiz.questions;
  assert.equal(questions.filter(q=>q.type==='scriptReverse').length,92);
  assert.equal(questions.length,184);
  app.state.quiz.score=questions.length;app.finishQuiz();assert.equal(app.levelRank(0),'Copper');
  const saved=app.saved(),reload=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks});
  assert.equal(reload.levelRank(0),'Copper');
});

test('existing two-direction results migrate in the app without changing old ranks or mastery',()=>{
  const old={'mix-exam1':{rank:'Gold',last:.98,attempts:4},'mix-exam2':{rank:'Silver',last:.95,attempts:2}},app=createCrashCourseProbe({savedRanks:old,savedState:{introducedVocabIds:['vocab-ねこ']}});
  assert.equal(app.levelRank(0),'Silver');const saved=app.saved();
  assert.equal(saved.ranks['mix-exam1'].rank,'Gold');assert.equal(saved.ranks['mix-exam2'].rank,'Silver');
  assert.ok(saved.state.introducedVocabIds.includes('vocab-ねこ'));
  const reloaded=createCrashCourseProbe({savedRanks:saved.ranks,savedState:saved.state});assert.equal(reloaded.levelRank(0),'Silver');
  const partial=createCrashCourseProbe({savedRanks:{'mix-exam1':old['mix-exam1']}});assert.equal(partial.levelRank(0),null);
});

test('an existing intro exam result awards only its own Level 7 and persists',()=>{
  const app=createCrashCourseProbe();app.openSocialIntro();app.startIntroExam();
  app.state.quiz.score=app.state.quiz.questions.length;app.finishQuiz();
  assert.equal(app.rankState['intro-exam'].rank,'Copper');assert.equal(app.levelRank(6),null);
  const saved=app.saved(),reload=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks});
  assert.equal(reload.rankState['intro-exam'].rank,'Copper');reload.openSocialIntro();
  assert.match(reload.element('mainView').innerHTML,/Level 7/);assert.match(reload.element('mainView').innerHTML,/Copper/);
});

test('overall progress counts merged kana once and counts introduction under its visible number',()=>{
  const app=createCrashCourseProbe({savedRanks:{'kana-complete-exam':{rank:'Copper'},'intro-exam':{rank:'Copper'},'l4-exam':{rank:'Copper'}}});
  const snapshot=app.knowledgeSnapshot();assert.equal(snapshot.rankedLevels,3);
  assert.deepEqual([...snapshot.completedLevels],[1,3,7]);
});
