const test=require('node:test');
const assert=require('node:assert/strict');
const content=require('../language-journey-content/content.js');
const {createCrashCourseProbe}=require('./app-probe.cjs');

test('Japanese UI follows actual introduced words, not a level or lesson number',()=>{
  const app=createCrashCourseProbe();app.state.level=11;
  assert.equal(app.thematicLevelLabel(12),'Level 12');assert.equal(app.thematicLessonLabel(2),'Les 2');
  assert.match(app.thematicInstructionHtml('choose-answer'),/Kies het juiste antwoord/);
  const first=app.thematicCourses[10].lessons[0];
  app.state.introducedVocabIds=[...first.applications[0].wordIds];
  assert.equal(app.thematicLevelLabel(11),'レベル 11');assert.equal(app.thematicLessonLabel(2),'レッスン 2');
  assert.equal(app.thematicUiLabel('れんしゅう','Oefenen'),'Oefenen','part B is not inferred from part A');
  app.state.introducedVocabIds=[...first.wordIds];
  assert.equal(app.thematicUiLabel('れんしゅう','Oefenen'),'れんしゅう');
  assert.match(app.thematicInstructionHtml('choose-answer'),/ただしい こたえ を えらんでください/);
  assert.doesNotMatch(app.thematicInstructionHtml('read-text'),/lang="ja"/,'unintroduced reading instructions retain support language');
  assert.equal(app.thematicUiLabel('つぎ','Volgende'),'Volgende','next is actually introduced in lesson 4, not lesson 1');
  assert.equal(app.localizedLevel(3)[0],'Level 4','earlier levels keep their interface');
});

test('Level 11 lessons 2–5, later headers and quiz contexts share the same learned labels',()=>{
  const app=createCrashCourseProbe(),first=app.thematicCourses[10].lessons[0];app.state.introducedVocabIds=[...first.wordIds];
  const learningBefore=JSON.stringify({words:app.state.introducedVocabIds,ranks:app.rankState,srs:app.state.flashcardProgress});
  for(const level of [11,12,13,14,15]){
    app.state.level=level-1;const course=app.thematicCourses[level-1];
    for(let index=level===11?1:0;index<5;index++){
      app.state.thematic={level,lessonIndex:index,part:'A',step:'lesson',correct:0};
      app.renderThematicLesson(app.element('testThematic'),course);
      assert.match(app.element('testThematic').innerHTML,new RegExp(`レベル ${level} · レッスン ${index+1}/5`));
      assert.ok(app.thematicQuizTitle(course,course.lessons[index]).includes(`レッスン ${index+1}`));
      assert.match(app.element('thematicBody').innerHTML,/Lestoets/);
      assert.doesNotMatch(app.element('testThematic').innerHTML,/\bLes \d/);
    }
  }
  assert.equal(JSON.stringify({words:app.state.introducedVocabIds,ranks:app.rankState,srs:app.state.flashcardProgress}),learningBefore,'rendering cannot grant knowledge or mutate ranks/SRS');
});

test('central Japanese titles require their own known vocabulary; grammar explanations stay Dutch',()=>{
  const app=createCrashCourseProbe(),course=app.thematicCourses[10],second=course.lessons[1];
  assert.equal(app.thematicLessonTitle(second),second.title);
  app.state.introducedVocabIds=[...second.applications[0].wordIds];assert.equal(app.thematicLessonTitle(second),'ことば と いみ');
  for(const level of [12,13,14,15]){
    const state=content.getKnowledgeState(`${level}-5-B`);app.state.introducedVocabIds=state.vocabulary.map(word=>word.id);
    for(const lesson of app.thematicCourses[level-1].lessons){assert.ok(lesson.titleJa);assert.equal(app.thematicLessonTitle(lesson),lesson.titleJa)}
  }
  for(const lesson of content.manifest.lessons.filter(lesson=>lesson.kind==='thematic'))for(const id of lesson.titleVocabIds)assert.ok(content.manifest.vocabulary.some(word=>word.id===id),`${lesson.id} title has stable vocabulary`);
  for(const label of Object.values(content.manifest.interfaceLabels))for(const id of label.requiredVocabIds)assert.ok(content.manifest.vocabulary.some(word=>word.id===id));
  app.state.level=12;app.state.thematic={level:13,lessonIndex:0,part:'A',step:'sentences',sentenceIndex:0};app.renderThematicLesson(app.element('testThematic'),app.thematicCourses[12]);
  assert.match(app.element('thematicBody').innerHTML,/het beginpunt/);
});

test('only lexical Japanese items get an unbreakable word unit, not sentences or arbitrary text',()=>{
  const app=createCrashCourseProbe();
  for(const word of ['ください','きっぷ','おねがいします','よんでください','レッスン'])assert.match(app.japaneseWordHtml(word),/^<span class="jp-word" lang="ja">/);
  assert.equal(app.japaneseWordHtml('きっぷ を ください。'),'きっぷ を ください。');
  assert.equal(app.japaneseWordHtml('きっぷをください。'),'きっぷをください。');
  assert.equal(app.japaneseWordHtml('<img src=x>'),'&lt;img src=x&gt;');
  const snapshot=()=>JSON.stringify({words:app.state.introducedVocabIds,firstSeen:app.state.vocabFirstSeen,ranks:app.rankState,srs:app.state.flashcardProgress});
  const before=snapshot();app.japaneseWordHtml('ください');assert.equal(snapshot(),before,'token presentation never introduces words');
});
