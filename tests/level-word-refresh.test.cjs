const test=require('node:test');
const assert=require('node:assert/strict');
const {createCrashCourseProbe}=require('./app-probe.cjs');

test('thematic exam tile gates a separate choice and refresh preserves all learning state',()=>{
  for(let level=12;level<=15;level++){
    const p=createCrashCourseProbe(),course=p.thematicCourses[level-1],box=p.element('thematicRefreshTest');
    p.state.level=level-1;
    p.renderThematicList(box,course);
    assert.doesNotMatch(box.innerHTML,/Woorden opfrissen/);
    assert.match(box.innerHTML,/id="thematicExam"[^>]*disabled/);
    for(const lesson of course.lessons)p.state.thematicCompleted[lesson.id]={A:true,B:true};
    p.renderThematicList(box,course);
    p.element('thematicExam').onclick();
    assert.match(box.innerHTML,/Start leveltoets/);
    assert.match(box.innerHTML,/Woorden opfrissen/);
    const before=JSON.stringify({state:p.state,ranks:p.rankState,vocab:p.vocabMastery,items:p.itemMastery});
    p.element('levelWordsRefresh').onclick();
    const run=p.activeWordCrashCourse;
    assert.equal(run.refresh,true);
    const expected=new Set(course.lessons.flatMap(l=>l.wordIds||[]));
    assert.equal(run.words.length,expected.size);
    assert.equal(run.deck.length,expected.size*2);
    assert.deepEqual(new Set(run.deck.map(q=>q.direction)),new Set(['jp-nl','nl-jp']));
    while(p.activeWordCrashCourse.phase!=='summary'){
      const q=run.queue[run.index];q.revealed=true;q.answerUnlockAt=0;
      p.answerWordCrashCourse(q.accepted[0]);p.advanceWordCrashCourse();
    }
    assert.match(box.innerHTML,/Terug naar het level-examen/);
    p.completeWordCrashCourse();
    assert.match(box.innerHTML,/Start leveltoets/);
    assert.equal(JSON.stringify({state:p.state,ranks:p.rankState,vocab:p.vocabMastery,items:p.itemMastery}),before);
    p.element('levelWordsRefresh').onclick();p.navigateBack();
    assert.match(box.innerHTML,/Start leveltoets/);
    assert.equal(p.activeWordCrashCourse,null);
  }
});

test('Level 11 integration exam keeps its gate and offers the same optional return path',()=>{
  const p=createCrashCourseProbe(),course=p.thematicCourses[10],box=p.element('level11RefreshTest');
  p.state.level=10;p.state.thematic.level=11;p.state.thematic.lessonIndex=4;p.state.thematic.step='lesson';
  p.renderThematicLesson(box,course);
  assert.match(box.innerHTML,/id="levelWordsRefresh"[^>]*disabled/);
  for(const lesson of course.lessons.slice(0,4))p.state.thematicCompleted[lesson.id]={A:true,B:true};
  p.renderThematicLesson(box,course);
  p.element('levelWordsRefresh').onclick();
  assert.equal(p.activeWordCrashCourse.words.length,40);
  assert.equal(p.activeWordCrashCourse.deck.length,80);
  p.navigateBack();
  assert.match(box.innerHTML,/Begin het examen/);
  assert.match(box.innerHTML,/Woorden opfrissen/);
});

test('refresh never substitutes untaught kanji for the available kana reading',()=>{
  const p=createCrashCourseProbe({savedState:{introducedVocabIds:['vocab-ひと']}}),course=p.thematicCourses[11],box=p.element('level12KanjiRefresh');
  p.state.level=11;
  for(const lesson of course.lessons)p.state.thematicCompleted[lesson.id]={A:true,B:true};
  p.renderThematicList(box,course);p.element('thematicExam').onclick();p.element('levelWordsRefresh').onclick();
  assert.equal(p.activeWordCrashCourse.words.find(word=>word.id==='vocab-ひと').jp,'ひと');
  p.navigateBack();
  p.state.kanjiExposureIds.push('vocab-ひと');
  p.element('levelWordsRefresh').onclick();
  assert.equal(p.activeWordCrashCourse.words.find(word=>word.id==='vocab-ひと').jp,'人');
  assert.equal(p.activeWordCrashCourse.words.find(word=>word.id==='vocab-でんしゃ').jp,'でんしゃ');
});
