const test=require('node:test'),assert=require('node:assert/strict');
const {createCrashCourseProbe}=require('./app-probe.cjs');
const content=require('../language-journey-content/content.js');
const plain=x=>JSON.parse(JSON.stringify(x));
test('kanji exposure is explicit and persists without changing existing vocabulary or Recall',()=>{
  const savedState={introducedVocabIds:['vocab-わたし'],thematicCompleted:{'l11-home-1':{A:true,B:true}},flashcardProgress:{version:1,cards:{'vocab-わたし::jp-nl':{dueAt:9000,intervalDays:4,repetitions:3,lapses:0,lastReviewedAt:100,lastGrade:'knew'}}}};
  const app=createCrashCourseProbe({savedState});assert.deepEqual(plain(app.state.kanjiExposureIds),[]);
  const before=plain(app.state.flashcardProgress);app.state.level=10;app.state.screen='module';app.openThematicLesson(0);app.startThematicPart('A');
  assert.match(app.element('thematicBody').innerHTML,/わたし → 私（わたし）/);assert.deepEqual(plain(app.state.kanjiExposureIds),[]);
  app.element('thematicWordsNext').onclick();assert.deepEqual(plain(app.state.kanjiExposureIds),['vocab-わたし']);
  const saved=app.saved(),reload=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks});assert.deepEqual(plain(reload.state.kanjiExposureIds),['vocab-わたし']);assert.deepEqual(plain(reload.state.flashcardProgress),before);
  assert.match(reload.dictionaryArticleHtml(reload.dictionaryById['vocab-わたし']),/私/);
});
test('kanji points follow known lexemes and Japan is distinct from the counter',()=>{
  for(const id of ['vocab-わたし','vocab-ひと','vocab-えき','vocab-でんしゃ','vocab-みず','vocab-country-japan']){const w=content.vocabById[id];assert.ok(content.pointOrder(w.introducedAt)<content.pointOrder(w.kanjiIntroducedAt),id)}
  assert.equal(content.vocabById['vocab-country-japan'].kanjiIntroducedAt,'12-5-A');assert.equal(content.vocabById['vocab-にほん'].kanji,null);
});
test('whole-word support stays separate from answer buttons and respects lesson boundaries',()=>{
 const app=createCrashCourseProbe({savedState:{thematicRevision:1,introducedVocabIds:['vocab-えき'],kanjiExposureIds:['vocab-えき']}});
 app.state.level=11;app.state.screen='module';app.openThematicLesson(0);app.state.thematic={level:12,lessonIndex:0,part:'A',step:'questions',questionIndex:0,correct:0,answered:false,optionsRevealed:true,flowRevision:1};app.renderMain();
 assert.doesNotMatch(app.element('thematicBody').innerHTML,/reading-support[^>]*[^]*?駅/);
 app.state.level=12;app.openThematicLesson(2);const lesson=content.thematicCourses[12].lessons[2],part=lesson.applications.find(p=>p.part==='B'),index=part.questions.findIndex(q=>q.choices.includes('えき'));assert.ok(index>=0);
 app.state.thematic={level:13,lessonIndex:2,part:'B',step:'questions',questionIndex:index,correct:0,answered:false,optionsRevealed:true,flowRevision:1};app.renderMain();const html=app.element('thematicBody').innerHTML;
 assert.match(html,/>駅<\/button><details class="reading-support"/);assert.match(html,/>駅<\/summary><span>えき<\/span><\/details>/);assert.doesNotMatch(html,/<details class="reading-support"[^]*?<span>station<\/span>/);
});
