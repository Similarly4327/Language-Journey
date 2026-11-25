const test=require('node:test');
const assert=require('node:assert/strict');
const {createCrashCourseProbe}=require('./app-probe.cjs');

test('quiz result returns to its captured level and keeps the saved medal',()=>{
  const app=createCrashCourseProbe();
  app.state.level=11;app.state.screen='module';app.openThematicLesson(2);
  const lesson=app.thematicCourses[11].lessons[2];
  app.state.thematicCompleted[lesson.id]={A:true,B:true};
  app.renderThematicLesson(app.element('host'),app.thematicCourses[11]);
  app.element('thematicCheck').onclick();
  app.state.quiz.score=app.state.quiz.questions.length;
  app.finishQuiz();
  app.state.level=3; // An unrelated state change must not redirect the result.
  app.element('backBtn').onclick();
  assert.equal(app.state.level,11);
  assert.equal(app.state.screen,'level');
  assert.equal(app.persisted().ranks[lesson.id].rank,'Copper');
});

test('both thematic parts return to the level overview from completion',()=>{
  for(const level of [10,11])for(const part of ['A','B']){
    const app=createCrashCourseProbe();app.state.level=level;app.state.screen='module';app.openThematicLesson(2);
    app.state.thematic.part=part;app.state.thematic.step='done';
    app.renderThematicLesson(app.element('host'),app.thematicCourses[level]);
    app.element('thematicDoneOverview').onclick();
    assert.equal(app.state.screen,'level');assert.equal(app.state.level,level);
  }
});
