const test=require('node:test'),assert=require('node:assert/strict');
const content=require('../language-journey-content/content.js'),{createCrashCourseProbe}=require('./app-probe.cjs');
const plain=x=>JSON.parse(JSON.stringify(x));

test('known microblocks retain sentences and both sources without empty screens or awarding ranks',()=>{
  for(const [level,index] of [[12,2],[12,3],[13,2]]){
    const lesson=content.thematicCourses[level-1].lessons[index],ids=lesson.didactics.microblocks.flatMap(b=>b.wordIds);
    const app=createCrashCourseProbe({width:375,savedState:{introducedVocabIds:ids}});
    app.state.level=level-1;app.state.screen='module';app.openThematicLesson(index);
    const before=plain({ranks:app.rankState,srs:app.state.flashcardProgress});
    for(const part of ['A','B']){
      app.startThematicPart(part);let sentences=0,guard=0;
      while(app.state.thematic.step==='sentences'&&guard++<30){sentences++;assert.doesNotMatch(app.element('thematicBody').innerHTML,/Geen nieuwe woorden|combineer ze nu/);app.element('thematicSentenceNext').onclick()}
      assert.ok(sentences>0);assert.equal(app.state.thematic.step,'questions');assert.match(app.element('thematicBody').innerHTML,/thematic-question-source/);
    }
    assert.deepEqual(plain({ranks:app.rankState,srs:app.state.flashcardProgress}),before);
  }
});

test('partial known block introduces and practices only unknown words, including after reload',()=>{
  const lesson=content.thematicCourses[11].lessons[2],block=lesson.didactics.microblocks[0],known=block.wordIds[0];
  const app=createCrashCourseProbe({savedState:{introducedVocabIds:[known]}});app.state.level=11;app.state.screen='module';app.openThematicLesson(2);app.startThematicPart('A');
  assert.deepEqual(plain(app.state.thematic.introWordIds),block.wordIds.slice(1));
  const saved=app.saved(),reload=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks});reload.state.level=11;reload.state.screen='module';reload.renderMain();
  assert.deepEqual(plain(reload.state.thematic.introWordIds),block.wordIds.slice(1));reload.element('thematicWordsNext').onclick();
  assert.equal(reload.state.thematic.step,'practice');assert.equal(reload.activeWordCrashCourse.deck.length,2*(block.wordIds.length-1));reload.completeWordCrashCourse();assert.equal(reload.state.thematic.step,'sentences');
});
