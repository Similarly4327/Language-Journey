'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const content=require('../language-journey-content/content.js'),playback=require('../audio/playback.js');
const {createCrashCourseProbe}=require('./app-probe.cjs');
const lessons=content.manifest.lessons.filter(l=>l.didactics);
test('the detailed audit finds no future or unprepared forms in stories or answer choices',()=>{
  const audit=require('../scripts/thematic-didactic-audit.cjs').audit();
  for(const l of audit)for(const p of l.parts){assert.deepEqual(p.missingSentencePreparation,[]);assert.deepEqual(p.instruction?.tooEarly||[],[]);for(const token of [...p.classifiedText,...p.classifiedQuestions])assert.ok(!['toekomstig','onvoorbereid of nader beoordelen'].includes(token.status),`${l.id}: ${token.token}`)}
});
test('all twenty lessons prepare every new word in a short sentence before either source',()=>{
  assert.equal(lessons.length,20);
  for(const l of lessons){
    assert.ok(l.didactics.newWordIds.length<=10,l.id);
    if(l.order===5)assert.ok(l.didactics.newWordIds.length<=3,l.id);
    assert.ok(l.didactics.canDo.length>20);
    const covered=new Set(l.models.flatMap(m=>m.linkedWordIds));
    for(const id of l.didactics.newWordIds){assert.ok(covered.has(id),`${l.id}: ${id}`);const w=content.vocabById[id],forms=[w.kana,...content.manifest.didacticSurfaceForms.filter(f=>f.wordId===id).map(f=>f.form)];assert.ok(l.models.some(m=>m.linkedWordIds.includes(id)&&forms.some(form=>m.sentence.includes(form))),id)}
    for(const p of l.applications){assert.ok(p.questions.every(q=>/[ぁ-んァ-ヶ]/u.test(q.prompt)),l.id);assert.equal(p.questions.length,2);for(const id of p.wordIds)assert.ok(content.pointOrder(content.vocabById[id].introducedAt)<=content.pointOrder(`${l.level}-${l.order}-B`),id)}
    assert.notEqual(l.applications[1].resourceKind,'story');
  }
});
test('lesson and level tests retain the actual practical source and stable source IDs',()=>{
  const app=createCrashCourseProbe();
  for(const l of lessons){const questions=app.thematicQuestions(l);assert.equal(questions.length,4);assert.ok(questions.every(q=>q.context&&q.sourceId&&q.lessonId===l.id));assert.equal(new Set(questions.map(q=>q.sourceId)).size,4)}
});
function questionsApp(index=0){const app=createCrashCourseProbe({feedbackTimers:true});app.state.level=10;app.state.screen='module';app.state.thematic={level:11,lessonIndex:0,part:'A',step:'questions',questionIndex:index,correct:0,answered:false,selected:null,preparedLesson:true,flowRevision:1,optionsRevealed:true};return app}
test('correct uses the common 1500ms clock once; wrong stays red/green until manual next',()=>{
  const app=questionsApp(),q=lessons.find(l=>l.id==='l11-home-1').applications[0].questions[0],srs=JSON.stringify(app.state.flashcardProgress);
  app.thematicAnswer(q.answer,q.answer);app.thematicAnswer(q.answer,q.answer);assert.equal(app.state.thematic.correct,1);
  const timer=app.crashTimers.findIndex(t=>t.delay===1500&&!t.cancelled);assert.ok(timer>=0);assert.equal(app.state.thematic.questionIndex,0);app.fireCrashTimer(timer);assert.equal(app.state.thematic.questionIndex,1);assert.equal(app.state.thematic.optionsRevealed,false);app.fireCrashTimer(timer);assert.equal(app.state.thematic.questionIndex,1);
  app.state.thematic.optionsRevealed=true;const next=lessons.find(l=>l.id==='l11-home-1').applications[0].questions[1];app.thematicAnswer(next.choices[1],next.answer);
  assert.match(app.element('thematicBody').innerHTML,/is-correct/);assert.match(app.element('thematicBody').innerHTML,/is-incorrect/);assert.equal(app.crashTimers.filter(t=>t.delay===1500&&!t.cancelled&&!t.fired).length,0);
  app.thematicNextQuestion(2,'done');assert.equal(app.state.thematic.step,'done');assert.equal(app.state.thematicCompleted['l11-home-1'].A,true);assert.equal(JSON.stringify(app.state.flashcardProgress),srs);assert.equal(app.rankState['l11-home-1'].rank,null);
});
test('last correct auto-completes; navigation invalidates a queued old answer',()=>{
  const app=questionsApp(1),q=lessons.find(l=>l.id==='l11-home-1').applications[0].questions[1];app.thematicAnswer(q.answer,q.answer);let timer=app.crashTimers.findIndex(t=>t.delay===1500&&!t.cancelled);app.fireCrashTimer(timer);assert.equal(app.state.thematic.step,'done');
  const other=questionsApp();other.thematicAnswer('yes','yes');timer=other.crashTimers.findIndex(t=>t.delay===1500&&!t.cancelled);other.thematicAdvance('lesson');other.fireCrashTimer(timer);assert.equal(other.state.thematic.step,'lesson');assert.equal(other.state.thematic.questionIndex,0);
});
test('old ranked words, SRS, scores and timestamps survive the additive migration and reload',()=>{
  const reviews={'vocab-でます::jp-nl':{dueAt:1234567,intervalDays:17,repetitions:4,lapses:1,lastReviewedAt:456,lastGrade:'knew'}};
  const savedState={flashcardProgress:{version:1,cards:reviews},thematicCompleted:{'l11-home-5':{A:true,B:true}},thematicScores:{'l11-home-5':{A:7,B:6}}};
  const savedRanks={'l11-home-5':{rank:'Gold',last:.9,attempts:4},'l12-3':{rank:'Copper',last:1,attempts:1}};
  const app=createCrashCourseProbe({savedState,savedRanks});assert.ok(app.state.historicalIntroducedVocabIds.includes('vocab-でます'));assert.ok(app.flashcardEligibleCards().some(w=>w.id==='vocab-でます'));assert.deepEqual(JSON.parse(JSON.stringify(app.state.flashcardProgress.cards)),reviews);
  const saved=app.saved(),again=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks});assert.deepEqual(JSON.parse(JSON.stringify(again.state.thematicScores)),savedState.thematicScores);assert.equal(again.rankState['l11-home-5'].rank,'Gold');assert.deepEqual(JSON.parse(JSON.stringify(again.state.flashcardProgress.cards)),reviews);
  const fresh=createCrashCourseProbe({savedState:{thematicRevision:1},savedRanks:{'l11-home-5':savedRanks['l11-home-5']}});assert.ok(!fresh.flashcardEligibleCards().some(w=>w.id==='vocab-くうこう'));
});
test('two avatars use selected lead A/B consistently, including Phase 1; missing clips fail closed',()=>{
  assert.equal(playback.dialogueVoiceRole('A','A'),'A');assert.equal(playback.dialogueVoiceRole('B','A'),'B');assert.equal(playback.dialogueVoiceRole('A','B'),'B');assert.equal(playback.dialogueVoiceRole('B','B'),'A');
  const app=createCrashCourseProbe(),id='dialogue-l14-1-B';app.state.avatarGender='male';app.state.avatarName='Kai';assert.match(app.dialogueHtml(id),/Kai/);assert.match(app.dialogueHtml(id),/Miku/);
  app.state.avatarGender='female';app.state.avatarName='Yui';assert.match(app.dialogueHtml(id),/Yui/);assert.match(app.dialogueHtml(id),/Ren/);
  for(const l of ['l9-1','l9-5','l10-5'])assert.ok(content.manifest.lessons.find(x=>x.id===l).models[0].dialogueId);
  assert.equal(playback.resolve(content,{assets:[]},id,null,'B'),null);
  const block=content.audioEntryById[id].entry,assets=block.lines.flatMap(line=>['A','B'].map(role=>{const ref=content.audioEntryById[line.sentenceId];return{entryId:ref.id,displayText:ref.displayText,readingId:'default',audioTextKana:ref.pronunciation.audioTextKana,voiceRole:role,reviewed:true,pipelineVersion:'test',path:`assets/audio/ja/sentences/test-${role}.mp3`}}));
  assert.deepEqual(playback.resolve(content,{pipelineVersion:'test',assets},id,null,'B').assets.map(asset=>asset.voiceRole),['B','A','B']);
  assert.deepEqual(playback.resolve(content,{pipelineVersion:'test',assets},id,null,'A').assets.map(asset=>asset.voiceRole),['A','B','A']);
  const japan=content.manifest.vocabulary.find(w=>w.id==='vocab-country-japan'),counter=content.manifest.vocabulary.find(w=>w.id==='vocab-にほん');assert.equal(japan.meaning,'Japan');assert.equal(counter.meaning,'twee lange voorwerpen');
});
test('an old airport rank cannot silently introduce the newly added Japan sense',()=>{
  const app=createCrashCourseProbe({savedRanks:{'l12-1':{rank:'Gold',attempts:3,last:1}}});
  assert.ok(app.state.deferredVocabIntroductions.includes('vocab-country-japan'));assert.ok(!app.flashcardEligibleCards().some(w=>w.id==='vocab-country-japan'));
  app.state.level=11;app.state.screen='module';app.state.thematic={level:12,lessonIndex:0,part:'A',step:'words',wordBlockIndex:3,questionIndex:0,correct:0,flowRevision:1};app.renderMain();
  assert.ok(!app.state.deferredVocabIntroductions.includes('vocab-country-japan'));assert.ok(app.flashcardEligibleCards().some(w=>w.id==='vocab-country-japan'));assert.equal(app.rankState['l12-1'].rank,'Gold');
});
