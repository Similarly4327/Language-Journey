const test=require('node:test');
const assert=require('node:assert/strict');
const {createCrashCourseProbe}=require('./app-probe.cjs');
function ready(existing){
  const app=createCrashCourseProbe(existing||{});app.state.level=10;app.state.screen='module';app.openThematicLesson(0);
  const lesson=app.thematicCourses[10].lessons[0];app.state.thematicCompleted[lesson.id]={A:true,B:true};
  return {app,lesson,course:app.thematicCourses[10]};
}
function start(app,course,offered){
  app.state.thematic.part='B';app.state.thematic.step=offered?'done':'lesson';
  app.renderThematicLesson(app.element('testHost'),course);
  app.element(offered?'thematicDoneNext':'thematicCheck').onclick();
}
function complete(app,correct){app.state.quiz.score=correct;app.state.quiz.index=app.state.quiz.questions.length;app.finishQuiz()}
test('offered and direct thematic lesson tests use the same identity and persist the same completion',()=>{
  const snapshots=[];
  for(const offered of [true,false]){
    const {app,lesson,course}=ready();start(app,course,offered);
    assert.equal(app.state.quiz.rankId,lesson.id);assert.equal(app.state.quiz.thematicLessonId,lesson.id);assert.equal(app.state.quiz.official,true);
    complete(app,app.state.quiz.questions.length);
    const persisted=app.persisted();assert.equal(persisted.ranks[lesson.id].rank,'Copper');assert.equal(persisted.ranks[lesson.id].attempts,1);
    assert.equal(persisted.ranks['l11-exam'].rank,null);assert.ok(!app.element('nextBtn').classList.contains('hidden'));
    snapshots.push(persisted);
    const reloaded=createCrashCourseProbe({savedState:persisted.state,savedRanks:persisted.ranks});assert.equal(reloaded.rankState[lesson.id].rank,'Copper');assert.deepEqual({...reloaded.state.thematicCompleted[lesson.id]},{A:true,B:true});
  }
  assert.equal(snapshots[0].ranks['l11-home-1'].rank,snapshots[1].ranks['l11-home-1'].rank);
});
test('failure cannot award a first lesson medal; repeating preserves existing higher rank and applies only once',()=>{
  let {app,lesson,course}=ready();start(app,course,true);complete(app,0);assert.equal(app.rankState[lesson.id].rank,null);assert.ok(app.element('nextBtn').classList.contains('hidden'));
  ({app,lesson,course}=ready({savedRanks:{'l11-home-1':{rank:'Gold',last:1,attempts:4}}}));start(app,course,false);complete(app,4);const before=app.rankState[lesson.id].attempts;app.finishQuiz();assert.equal(app.rankState[lesson.id].attempts,before);assert.equal(app.rankState[lesson.id].rank,'Platinum');
});

test('storage failure hides the continuation and explicitly warns the result is not saved',()=>{
  const {app,lesson,course}=ready({failSave:true});start(app,course,true);complete(app,4);
  assert.match(app.element('resultRank').textContent,/niet worden opgeslagen/);
  assert.ok(app.element('nextBtn').classList.contains('hidden'));
  assert.equal(app.persisted().ranks[lesson.id],undefined);
});
