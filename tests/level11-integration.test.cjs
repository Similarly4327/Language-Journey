const test=require('node:test'),assert=require('node:assert/strict');
const content=require('../language-journey-content/content.js');
const {createCrashCourseProbe}=require('./app-probe.cjs');
const lessons=content.thematicCourses[10].lessons,day=86400000,now=Date.UTC(2026,9,15,9);
const plain=value=>JSON.parse(JSON.stringify(value));
function appAt(index=0,options={}){const app=createCrashCourseProbe(options);app.state.level=10;app.state.screen='module';app.openThematicLesson(index);return app}
test('each Level 11 part introduces five together and trains only those five, once per direction',()=>{
  for(let index=0;index<4;index++){
    const app=appAt(index),lesson=lessons[index];
    for(const part of lesson.applications){
      app.startThematicPart(part.part);
      assert.equal(part.newWordIds.length,5);assert.equal(app.state.thematic.step,'words');
      assert.equal((app.element('thematicBody').innerHTML.match(/class="panel audio-content-block"/g)||[]).length,5);
      if(part.part==='A')for(const id of lesson.applications[1].newWordIds)assert.ok(!app.state.introducedVocabIds.includes(id),id);
      app.element('thematicWordsNext').onclick();
      const deck=app.activeWordCrashCourse.deck;assert.equal(deck.length,10);
      for(const id of part.newWordIds)for(const direction of ['jp-nl','nl-jp'])assert.equal(deck.filter(q=>q.word.id===id&&q.direction===direction).length,1);
      app.completeWordCrashCourse();assert.equal(app.state.thematic.step,'sentences');
      for(const model of part.models){
        for(const id of model.linkedWordIds)assert.ok(content.pointOrder(content.vocabById[id].introducedAt)<=content.pointOrder(`11-${index+1}-${part.part}`));
      }
      let count=0;while(app.state.thematic.step==='sentences'&&count++<12)app.element('thematicSentenceNext').onclick();
      assert.equal(app.state.thematic.step,'questions','no separate long story/practical-source screen before application');
      if(part.part==='A')for(const id of lesson.applications[1].newWordIds)assert.ok(!app.element('thematicBody').innerHTML.includes(content.vocabById[id].kana),id);
    }
  }
});
test('lesson 1 UI stays Dutch throughout A, B, application and Lestoets; lesson 2 uses learned labels',()=>{
  const app=appAt();app.state.introducedVocabIds=[...lessons[0].wordIds];
  for(const part of ['A','B'])for(const step of ['lesson','words','sentences','questions','done']){
    app.state.thematic={level:11,lessonIndex:0,part,step,questionIndex:0,correct:0,answered:false,flowRevision:2};app.renderMain();
    assert.equal(app.thematicLevelLabel(11),'Level 11');assert.equal(app.thematicLessonLabel(1),'Les 1');assert.equal(app.thematicUiLabel('れんしゅう','Oefenen'),'Oefenen');
    assert.doesNotMatch(app.thematicInstructionHtml('choose-answer'),/lang="ja"/);
  }
  app.state.screen='quiz';assert.ok(app.thematicQuizTitle(content.thematicCourses[10],lessons[0]).startsWith('Level 11 · Les 1'));
  app.state.screen='module';app.openThematicLesson(1);assert.equal(app.thematicLessonLabel(2),'レッスン 2');
});
test('integration exam is three coherent sources, four questions each, varied targets from all four lessons',()=>{
  const signatures=new Set();
  for(let seed=1;seed<10;seed++){
    const app=appAt(4,{seed}),questions=app.buildLevel11IntegrationQuestions();assert.equal(questions.length,12);
    assert.equal(lessons[4].wordIds.length,0);assert.equal(lessons[4].didactics.newWordIds.length,0);
    for(const source of lessons[4].integrationExam.sources){assert.equal(source.text.split('\n').length,3);assert.equal(questions.filter(q=>q.integrationSourceId===source.id).length,4)}
    const targets=new Set(questions.flatMap(q=>q.targetVocabIds));
    for(const lesson of lessons.slice(0,4))assert.ok(lesson.wordIds.some(id=>targets.has(id)),lesson.id);
    for(const id of targets)assert.equal(content.vocabById[id].level,11);
    signatures.add([...targets].sort().join(','));
    assert.ok(!app.activeWordCrashCourse);app.renderThematicLesson(app.element('exam'),content.thematicCourses[10]);assert.match(app.element('exam').innerHTML,/Integratie-examen/);assert.doesNotMatch(app.element('exam').innerHTML,/thematicWordsNext|woordintroductie/);
  }
  assert.ok(signatures.size>1);
});
test('first qualifying pass records actual targets once, persists rank/progress and offers only optional continuation',()=>{
  const app=appAt(4,{now});for(const l of lessons.slice(0,4))app.state.thematicCompleted[l.id]={A:true,B:true};
  app.startLevel11IntegrationExam();const c=app.state.quiz;c.score=c.questions.length;
  const expected=[...new Set(c.questions.flatMap(q=>q.targetVocabIds))].sort();
  app.finishQuiz();assert.equal(app.state.level,10);assert.equal(app.rankState['l11-exam'].rank,'Copper');assert.equal(app.state.level11IntegrationPass.passedAt,now);
  assert.deepEqual(plain(app.state.level11IntegrationPass.targetVocabIds).sort(),expected);assert.match(app.element('nextBtn').textContent,/Optioneel/);
  const pass=plain(app.state.level11IntegrationPass);app.setNow(now+3*day);app.startLevel11IntegrationExam();app.state.quiz.score=12;app.finishQuiz();assert.deepEqual(plain(app.state.level11IntegrationPass),pass);
  const saved=app.saved(),again=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks,now:now+3*day});assert.deepEqual(plain(again.state.level11IntegrationPass),pass);assert.equal(again.rankState['l11-exam'].rank,'Silver');
});
function recallApp(){
  const ranks=Object.fromEntries(content.manifest.lessons.filter(l=>l.level>=4&&l.level<=11).map(l=>[l.id,{rank:'Copper',last:1,attempts:1}]));
  return createCrashCourseProbe({now,savedRanks:ranks,savedState:{level11IntegrationRevision:1,thematicRevision:1,introducedVocabIds:content.vocabCatalog.filter(w=>w.level<=11&&!w.legacy).map(w=>w.id)}});
}
test('bonus targets only introduced, untested Copper cards; expires day 6, never pulls future due or mutates either SRS direction',()=>{
  const app=recallApp(),tested=lessons[0].wordIds[0],untested=lessons[3].wordIds.at(-1);
  app.state.level11IntegrationPass={revision:1,passedAt:now,targetVocabIds:[tested]};
  assert.ok(!app.level11RecallBonusIds(now+day).has(tested));assert.ok(app.level11RecallBonusIds(now+day).has(untested));assert.equal(app.level11RecallBonusIds(now+5*day).size,0);
  app.state.introducedVocabIds=app.state.introducedVocabIds.filter(id=>id!==untested);assert.ok(!app.level11RecallBonusIds(now+day).has(untested));app.state.introducedVocabIds.push(untested);
  app.rankState[lessons[3].id].rank=null;assert.ok(!app.level11RecallBonusIds(now+day).has(untested));app.rankState[lessons[3].id].rank='Copper';
  for(const card of app.flashcardEligibleCards())for(const direction of ['jp-nl','nl-jp'])app.state.flashcardProgress.cards[`${card.id}::${direction}`]={dueAt:now-day,intervalDays:3,repetitions:2,lapses:1,lastReviewedAt:now-4*day,lastGrade:'knew'};
  const future=app.state.flashcardProgress.cards[`${untested}::nl-jp`];future.dueAt=now+9*day;
  const before=JSON.stringify(app.state.flashcardProgress),pass=app.state.level11IntegrationPass;
  app.state.level11IntegrationPass=null;const baseline=app.getRecallSession(now+day).queue.map(q=>`${q.cardId}::${q.direction}`).sort();app.state.level11IntegrationPass=pass;
  const bonus=app.getRecallSession(now+day).queue.map(q=>`${q.cardId}::${q.direction}`).sort();assert.deepEqual(plain(bonus),plain(baseline),'no due card loses its session slot');assert.ok(!bonus.includes(`${untested}::nl-jp`));
  app.getRecallSession(now+6*day);assert.equal(JSON.stringify(app.state.flashcardProgress),before);
  const saved=app.saved(),reload=createCrashCourseProbe({now:now+day,savedState:saved.state,savedRanks:saved.ranks});assert.equal(JSON.stringify(reload.state.flashcardProgress),before);
});
test('new-card bonus is capped at two slots and respects new limit; legacy or incomplete results give no bonus',()=>{
  const app=recallApp();const baseline=app.getRecallSession(now).queue.map(q=>`${q.cardId}::${q.direction}`);
  app.state.level11IntegrationPass={revision:1,passedAt:now,targetVocabIds:[lessons[0].wordIds[0]]};const boosted=app.getRecallSession(now).queue.map(q=>`${q.cardId}::${q.direction}`);
  const extras=boosted.filter(key=>!baseline.includes(key));assert.ok(extras.length>0&&extras.length<=2);assert.equal(boosted.length,20);assert.equal(app.getRecallSession(now,{newLimit:0}).queue.length,0);
  for(let index=1;index<boosted.length;index++)assert.notEqual(boosted[index].split('::')[0],boosted[index-1].split('::')[0]);
  for(const pass of [null,{passedAt:now},{revision:1,passedAt:now,targetVocabIds:[]}]){app.state.level11IntegrationPass=pass;assert.equal(app.level11RecallBonusIds(now).size,0)}
  const legacy=createCrashCourseProbe({savedState:{level11IntegrationPass:{revision:1,passedAt:now}},savedRanks:{'l11-exam':{rank:'Gold',attempts:3}},now});assert.equal(legacy.state.level11IntegrationPass,null);
});
test('all old lesson-5 words keep stable IDs and explicit later sources; old knowledge survives without false new unlocks',()=>{
  const expected={'りょこう':'11-4-B','じゅんび':'11-4-B','ひこうき':'11-4-B','しゅっぱつ':'12-4-A','にもつ':'12-2-B','くうこう':'12-1-A','あんないじょ':'12-1-B','ひょうじ':'12-1-B','でぐち':'12-1-B','のりば':'12-4-B','ぜんぶ':'12-5-A','あと':'12-2-B','すすめます':'12-3-A'};
  for(const [form,at] of Object.entries(expected)){const w=content.vocabById[`vocab-${form}`];assert.equal(w.introducedAt,at);assert.ok(w.sourceFound)}
  const old=createCrashCourseProbe({savedState:{thematicRevision:1},savedRanks:{'l11-home-5':{rank:'Gold',attempts:3}}});
  for(const form of ['りょこう','じゅんび','ひこうき'])assert.ok(old.flashcardEligibleCards().some(w=>w.id===`vocab-${form}`));
  const notLearned=createCrashCourseProbe({savedState:{thematicRevision:1},savedRanks:{'l12-1':{rank:'Copper',attempts:1}}});
  for(const form of ['りょこう','じゅんび','ひこうき'])assert.ok(!notLearned.flashcardEligibleCards().some(w=>w.id===`vocab-${form}`));
  const oldFourth=createCrashCourseProbe({savedState:{thematicRevision:1},savedRanks:{'l11-home-4':{rank:'Gold',attempts:3}}});
  for(const form of ['りょこう','じゅんび','ひこうき'])assert.ok(!oldFourth.flashcardEligibleCards().some(w=>w.id===`vocab-${form}`),'old destination rank cannot introduce a swapped-in word');
  for(const form of ['ぜんぶ','あと','すすめます'])assert.ok(oldFourth.flashcardEligibleCards().some(w=>w.id===`vocab-${form}`),'formerly learned words remain eligible after relocation');
});
