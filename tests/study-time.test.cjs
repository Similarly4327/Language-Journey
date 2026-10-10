const test=require('node:test');
const assert=require('node:assert/strict');
const {createCrashCourseProbe}=require('./app-probe.cjs');
const now=Date.parse('2026-10-09T10:00:00Z');
const queue=()=>['vocab-ねこ','vocab-いぬ'].map(cardId=>({cardId,direction:'jp-nl',round:0}));
const app=opts=>createCrashCourseProbe({now,savedRanks:{'l4-1':{rank:'Copper'}},...opts});
const unchanged=p=>JSON.stringify({ranks:p.rankState,srs:p.state.flashcardProgress,words:p.state.introducedVocabIds,vocab:p.vocabMastery,kana:p.itemMastery});

test('scheduled Recall and free practice add effective time to Recall, totals and activities',()=>{
  for(const mode of ['scheduled','free']){
    const p=app(),before=unchanged(p);p.createFlashcardSession(queue(),mode);
    assert.equal(p.state.studyTracker.active.activityGroup,'recall');
    p.setNow(now+(mode==='free'?8:10)*60000);p.pauseFlashcardSession();
    const s=p.studySessions()[0],seconds=(mode==='free'?8:10)*60;
    assert.equal(s.effectiveSeconds,seconds);assert.equal(s.effectiveDuration,seconds);
    assert.equal(s.activityType,mode==='free'?'freePractice':'scheduledRecall');
    assert.equal(s.startTimestamp,new Date(now).toISOString());assert.equal(s.endTimestamp,new Date(now+seconds*1000).toISOString());
    assert.equal(s.metadata.cards,2);assert.equal(p.totalStudySeconds(),seconds);
    assert.equal(p.studyTotals().byGroup.recall,seconds);assert.equal(p.studyTotals().byGroup.curriculum,0);
    p.renderStudyActivities(p.element('activities'));assert.match(p.element('activities').innerHTML,/Recall/);
    assert.match(p.element('activities').innerHTML,mode==='free'?/Vrij oefenen/:/Geplande herhaling/);
    assert.equal(unchanged(p),before,'timer alone cannot change SRS, ranks or mastery');
  }
});

test('passive Recall dashboard, Progress and empty selections do not start a timer',()=>{
  const p=app();p.openFlashcards();p.setNow(now+3600000);p.show('session');p.createFlashcardSession([],'free');
  assert.equal(p.state.studyTracker.active,null);assert.equal(p.totalStudySeconds(),0);
});

test('curriculum and Recall share the timer and cumulative time sums on the same day',()=>{
  const p=app();p.beginStudySession({source:'lesson:advanced',title:'Level 8 Les 2',activityType:'les',level:8});
  p.setNow(now+20*60000);p.completeStudySession({status:'afgerond'});
  p.createFlashcardSession(queue(),'scheduled');p.setNow(now+30*60000);p.pauseFlashcardSession();
  const totals=p.studyTotals();assert.equal(totals.total,1800);assert.equal(totals.byGroup.curriculum,1200);assert.equal(totals.byGroup.recall,600);
  const points=p.progressSummaryPoints('time'),last=points.at(-1);assert.equal(last.curriculum,1200);assert.equal(last.recall,600);assert.equal(last.value,1800);
  assert.equal(p.progressDailyMeasurements(points,now+86400000).length,1);
});

test('background time is excluded by the same pause/resume engine in both activity groups',()=>{
  for(const group of ['curriculum','recall']){
    const p=app();p.beginStudySession({activityGroup:group,source:group,title:group});
    p.setNow(now+60000);p.document.hidden=true;p.pauseActiveStudySession();
    p.setNow(now+3600000);p.resumeActiveStudySession();assert.equal(p.state.studyTracker.active.runningSince,null);
    p.document.hidden=false;p.resumeActiveStudySession();p.setNow(now+3660000);p.completeStudySession();
    assert.equal(p.totalStudySeconds(),120);
  }
});

test('leaving, completing and resuming Recall close each segment exactly once',()=>{
  const p=app();p.createFlashcardSession(queue(),'free');p.setNow(now+600000);p.goToLevels();
  assert.equal(p.totalStudySeconds(),600);assert.equal(p.state.flashcardSession.status,'paused');
  p.show('session');assert.equal(p.studySessions().length,1);
  p.setNow(now+3600000);p.resumeFlashcardSession();p.setNow(now+3660000);
  p.state.flashcardSession.position=1;p.state.flashcardSession.feedback={grade:'viewed',ungraded:true};p.flashcardNextCard();
  assert.equal(p.studySessions().length,2);assert.equal(p.totalStudySeconds(),660);
  p.completeStudySession();p.renderFlashcardsScreen();assert.equal(p.studySessions().length,2);
});

test('reload recovers only saved measured seconds, including short sessions, without duplicates',()=>{
  let p=app();p.createFlashcardSession(queue(),'scheduled');p.setNow(now+12000);p.pauseActiveStudySession();
  const saved=p.saved();const id=saved.state.studyTracker.active.id;
  p=app({now:now+3600000,savedState:saved.state,savedRanks:saved.ranks});
  assert.equal(p.totalStudySeconds(),12);assert.equal(p.studySessions()[0].id,id);assert.equal(p.studySessions()[0].endedAt,new Date(now+12000).toISOString());
  assert.equal(p.state.flashcardSession.status,'paused');assert.equal(p.state.studyTracker.active,null);
  p.recoverInterruptedStudySession();const again=p.saved();p=app({savedState:again.state,savedRanks:again.ranks});
  assert.equal(p.studySessions().length,1);assert.equal(p.totalStudySeconds(),12);
});

test('old curriculum stays intact and old unmeasured Recall timestamps never become hours',()=>{
  const history={id:'old',startedAt:'2026-09-01T10:00:00Z',endedAt:'2026-09-01T10:20:00Z',rawSeconds:1200,effectiveSeconds:900,category:'app'};
  const p=app({savedState:{studyTracker:{sessions:[history]},flashcardSession:{mode:'scheduled',queue:queue(),position:0,status:'active',startedAt:now-30*86400000}}});
  assert.equal(p.totalStudySeconds(),900);assert.equal(p.studyTotals().byGroup.curriculum,900);assert.equal(p.studyTotals().byGroup.recall,0);
  assert.equal(JSON.stringify(p.state.studyTracker.sessions[0]),JSON.stringify(history));
});

test('long sessions remain fully counted and manual correction changes only effective time',()=>{
  const p=app();p.createFlashcardSession(queue(),'free');p.setNow(now+8*3600000);p.pauseFlashcardSession();
  assert.equal(p.totalStudySeconds(),28800);p.renderStudyActivities(p.element('activities'));assert.match(p.element('activities').innerHTML,/Lang open geweest/);
  const raw=p.state.studyTracker.sessions[0];raw.effectiveSeconds=480;
  const corrected=p.normalizeStudySession(raw);assert.equal(corrected.rawDuration,28800);assert.equal(corrected.effectiveDuration,480);
  assert.equal(p.progressSummaryPoints('time').at(-1).recall,480);
});

test('word crash courses are curriculum time even when opened directly',()=>{
  const p=app(),lesson=p.advancedCourses[5].lessons[3];
  p.beginWordCrashCourse({hostId:'words',lesson,words:p.lessonNewWords(lesson)});p.setNow(now+90000);p.leaveWordCrashCourse();
  assert.equal(p.studySessions()[0].activityGroup,'curriculum');assert.equal(p.studySessions()[0].effectiveSeconds,90);
});

test('time graph has one total series and selected Leren/Recall/Total detail with shared navigation',()=>{
  const fs=require('node:fs'),html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
  assert.match(html,/data-time-series="\$\{isTime\?'total':'words'\}"/);
  assert.doesNotMatch(html,/progressSelectedRecallMarker|progress-time-legend|line-recall/);
  assert.match(html,/coordinates=lineCoordinates\('value'\)/);
  assert.match(html,/highest=Math.max\(1,\.\.\.points.map\(p=>p.value\)\)/);
  assert.match(html,/<span>Leren \$\{valueLabel\(p.curriculum\)\}/);
  assert.match(html,/<span>Recall \$\{valueLabel\(p.recall\)\}/);
  assert.match(html,/isTime\?'Totaal '/);
  assert.match(html,/name="activityGroup"/);assert.match(html,/data-study-filter="activityGroup"/);
});

test('12h36 Leren plus 4h52 Recall end at one cumulative 17h28 total',()=>{
  const p=app(),sessions=[
    {activityGroup:'curriculum',startedAt:new Date(now-3600000).toISOString(),effectiveSeconds:45360},
    {activityGroup:'recall',activityType:'scheduledRecall',startedAt:new Date(now-1800000).toISOString(),effectiveSeconds:12000},
    {activityGroup:'recall',activityType:'freePractice',startedAt:new Date(now).toISOString(),effectiveSeconds:5520},
  ];
  const points=p.progressSummaryPoints('time',sessions),last=points.at(-1);
  assert.deepEqual(Array.from(points,x=>x.value),[45360,57360,62880]);
  assert.equal(last.curriculum,45360);assert.equal(last.recall,17520);
  assert.equal(last.value,last.curriculum+last.recall);
});
