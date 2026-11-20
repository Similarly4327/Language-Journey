const test=require('node:test');
const assert=require('node:assert/strict');
const {createCrashCourseProbe}=require('./app-probe.cjs');
const content=require('../language-journey-content/content.js');

const now=Date.parse('2026-11-20T10:00:00Z');
const groups=content.manifest.music.groups;
const first=groups[0];
const key=`words:${first.join('|')}`;
const list=values=>Array.from(values);

function musicApp(options={}){
  const app=createCrashCourseProbe({now,...options});
  app.state.screen='music';
  app.renderMain();
  return app;
}
function wordList(app){
  app.musicSession.step='overview';
  app.renderMain();
  app.element('musicStart').onclick();
}
function passWords(app,index,time){
  app.element(`musicWordGroup${index}`).onclick();
  app.element('musicNext').onclick();
  const session=app.musicSession;
  session.practiceIndex=session.practiceOrder.length;
  app.renderMain();
  app.setNow(time);
  session.testIndex=session.groupIds.length*2;
  session.testScore=session.testIndex;
  app.renderMain();
  return app.element('musicGroupDone').onclick;
}
function musicSessions(app){return app.studySessions().filter(session=>session.source.startsWith('music:'))}

test('completed music words reach the central dictionary, Recall and measured history once per attempt',()=>{
  const app=musicApp(),before=app.knowledgeSnapshot().vocab;
  wordList(app);
  const next=passWords(app,0,now+15000);
  assert.equal(app.knowledgeSnapshot().vocab,before+first.length);
  for(const id of first){
    assert.ok(app.knowledgeWordIsKnown(app.dictionaryById[id]));
    assert.equal(app.flashcardEligibleCards().filter(card=>card.id===id).length,1);
  }
  assert.ok(app.getRecallSession().queue.some(item=>first.includes(item.cardId)));
  assert.deepEqual(list(app.progressSummaryPoints('words').map(point=>point.value)),[before+first.length]);
  assert.match(musicSessions(app)[0].title,/^Muziek — /);
  assert.equal(musicSessions(app)[0].activityGroup,'curriculum');
  assert.equal(musicSessions(app)[0].effectiveSeconds,15);
  assert.equal(app.state.music.wordRanks[key],'Copper');
  app.renderMain();
  next();next();
  assert.equal(musicSessions(app).length,1);
  assert.equal(app.state.music.wordRanks[key],'Copper');

  const wordId=first[0],reviewKey=`${wordId}::jp-nl`,record={dueAt:now+86400000,repetitions:1};
  app.state.flashcardProgress.cards[reviewKey]=record;
  wordList(app);passWords(app,0,now+30000);
  assert.equal(app.knowledgeSnapshot().vocab,before+first.length);
  assert.equal(app.flashcardEligibleCards().filter(card=>card.id===wordId).length,1);
  assert.equal(app.getRecallSession(now+30000).queue.some(item=>item.cardId===wordId&&item.direction==='jp-nl'),false);
  assert.equal(app.state.flashcardProgress.cards[reviewKey],record);
  assert.equal(musicSessions(app).length,2);
  assert.equal(app.state.music.wordRanks[key],'Silver','a genuinely new successful word attempt still follows the rank rules');
  assert.equal(app.state.studyTracker.events.filter(event=>event.type==='knowledge'&&event.title.endsWith('woorden geleerd')).length,1);
});

test('new kanji is measured, retained on reload and stays independent of the word medal',()=>{
  const app=musicApp();
  wordList(app);
  passWords(app,0,now+12000)();
  const wordTotal=app.knowledgeSnapshot().vocab,base=app.knowledgeSnapshot().kanjiEncountered;
  const completed=[];
  for(let index=0;index<first.length;index++){
    const wordId=first[index];
    app.element('musicKanjiNext').onclick();
    assert.equal(app.musicSession.kanjiWords[0],wordId);
    app.musicSession.index=app.musicSession.questions.length;
    app.renderMain();
    for(const question of app.musicSession.questions.filter(q=>q.kind==='kanji-component'))app.musicSession.componentResults[question.character]=true;
    app.musicSession.score=app.musicSession.questions.length;
    app.musicSession.index=app.musicSession.questions.length;
    app.setNow(now+22000+10000*index);
    app.renderMain();app.renderMain();
    completed.push(wordId);
    assert.equal(app.flashcardEligibleCards().filter(card=>card.id===wordId).length,1);
    app.element('musicDone').onclick();
  }
  assert.equal(musicSessions(app).length,first.length+1);
  assert.equal(app.knowledgeSnapshot().vocab,wordTotal);
  assert.ok(app.knowledgeSnapshot().kanjiEncountered>base);
  assert.equal(app.progressSummaryPoints('kanji').at(-1).value,app.knowledgeSnapshot().kanjiEncountered);
  assert.equal(app.state.music.wordRanks[key],'Copper');
  const saved=app.saved();
  const reload=musicApp({now:now+60000,savedState:saved.state,savedRanks:saved.ranks});
  assert.equal(musicSessions(reload).length,first.length+1);
  assert.deepEqual(list(reload.progressSummaryPoints('kanji').map(point=>point.value)),list(app.progressSummaryPoints('kanji').map(point=>point.value)));
  wordList(reload);
  assert.match(reload.element('mainView').innerHTML,/id="musicWordGroup0"[^>]+rank-Copper music-kanji-complete/);
  assert.deepEqual(list(reload.state.music.kanjiIntroduced),completed);
  for(const id of first)assert.ok(reload.flashcardEligibleCards().some(card=>card.id===id));
});

test('music departure closes the active timer and historical kanji evidence does not invent graph points',()=>{
  const app=musicApp();
  app.element('musicContextStart').onclick();
  app.element('musicContextItem0').onclick();
  app.setNow(now+20000);
  app.element('sceneTransition').hidden=true;
  app.navigateBack();
  const [fragment]=musicSessions(app);
  assert.equal(fragment.category,'listening');
  assert.equal(fragment.status,'verlaten');
  assert.equal(fragment.effectiveSeconds,20);
  assert.equal(app.state.studyTracker.active,null);
  assert.equal(app.knowledgeSnapshot().vocab,0);
  assert.equal(app.progressSummaryPoints('kanji',[{snapshotEnd:{kanji:9,at:new Date(now).toISOString()}}]).length,0);
});
