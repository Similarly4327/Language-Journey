const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const source=html.slice(html.indexOf('function progressSummaryPoints('),html.indexOf('function renderProgressSummary('));
const context={};vm.runInNewContext(source+';globalThis.points=progressSummaryPoints;',context);
const point=(at,value)=>({at:Date.parse(at),value});
const values=points=>Array.from(points,p=>p.value);
const sessions=[
  {startedAt:'2026-09-01T10:00:00Z',endedAt:'2026-09-01T10:10:00Z',effectiveSeconds:600,snapshotEnd:{vocab:3,at:'2026-09-01T10:10:00Z'}},
  {manual:true,startedAt:'2026-09-02T10:00:00Z',effectiveSeconds:900,snapshotEnd:{vocab:99,at:'2026-10-01T10:00:00Z'}},
  {manual:true,baseline:true,startedAt:'2026-08-01T10:00:00Z',effectiveSeconds:3600,snapshotEnd:{vocab:99}},
  {startedAt:'2026-09-03T10:00:00Z',effectiveSeconds:60},
];
test('word chart uses actual app snapshots, never manual knowledge backfills',()=>{
  const points=context.points('words',sessions);assert.equal(points.length,1);assert.equal(points[0].value,3);assert.equal(points[0].at,Date.parse(sessions[0].snapshotEnd.at));
  assert.equal(context.points('words',[]).length,0);
});
test('time chart sums dated sessions without assigning a historical baseline to dates',()=>{
  assert.deepEqual(Array.from(context.points('time',sessions),p=>p.value),[600,1500,1560]);
});
test('untracked kanji has no fabricated zero history',()=>assert.equal(context.points('kanji',sessions).length,0));
test('historical days keep their last actual value, including a correction or decline',()=>{
  const raw=[point('2026-09-01T08:00:00',12),point('2026-09-01T12:00:00',15),point('2026-09-01T18:00:00',13),point('2026-09-04T10:00:00',11)];
  const before=JSON.stringify(raw),shown=context.progressDailyMeasurements(raw,Date.parse('2026-09-05T12:00:00'));
  assert.deepEqual(values(shown),[13,11]);assert.equal(shown[0].at,raw[2].at);assert.equal(JSON.stringify(raw),before);assert.equal(shown.length,2,'missing days are skipped');
});
test('today retains actual session moments and collapses after local midnight',()=>{
  const raw=[point('2026-10-04T08:00:00',5),point('2026-10-04T18:00:00',7),point('2026-10-05T09:00:00',8),point('2026-10-05T12:00:00',10)];
  assert.deepEqual(values(context.progressDailyMeasurements(raw,Date.parse('2026-10-05T13:00:00'))),[7,8,10]);
  raw.push(point('2026-10-05T16:00:00',9));
  assert.deepEqual(values(context.progressDailyMeasurements(raw,Date.parse('2026-10-05T17:00:00'))),[7,8,10,9]);
  assert.deepEqual(values(context.progressDailyMeasurements(raw,Date.parse('2026-10-06T00:00:00'))),[7,9]);
});
test('empty, single and future measurements do not produce invented points',()=>{
  const now=Date.parse('2026-10-05T12:00:00');assert.equal(context.progressDailyMeasurements([],now).length,0);
  assert.equal(context.progressDailyMeasurements([point('2026-10-05T10:00:00',0)],now).length,1);
  assert.equal(context.progressDailyMeasurements([point('2026-10-06T10:00:00',4)],now).length,0);
});
test('presets and custom ranges select inclusive whole local calendar days',()=>{
  const now=Date.parse('2026-10-05T18:00:00'),raw=[point('2026-08-01T10:00:00',1)],day=context.progressLocalDayNumber;
  const week=context.progressSummaryWindow({period:'week'},raw,now);assert.equal(week.fromDay,day('2026-09-29T00:00:00'));assert.equal(week.toDay,day(now));
  const month=context.progressSummaryWindow({period:'month'},raw,now);assert.equal(month.fromDay,day('2026-09-06T00:00:00'));
  const custom=context.progressSummaryWindow({period:'custom',fromDay:day('2026-09-01'),toDay:day('2026-09-03')},raw,now);assert.equal(custom.toDay-custom.fromDay,2);
  const crossed=context.progressSummaryWindow({period:'custom',fromDay:day('2026-09-04'),toDay:day('2026-09-01')},raw,now);assert.equal(crossed.toDay,crossed.fromDay);
});
test('day grouping uses local boundaries through summer and winter time',()=>{
  const {execFileSync}=require('node:child_process');
  const script=`const assert=require('node:assert/strict');${source}
    const make=(at,value)=>({at:Date.parse(at),value});
    const autumn=[make('2026-10-24T22:30:00Z',1),make('2026-10-25T00:30:00Z',2),make('2026-10-25T01:30:00Z',3),make('2026-10-25T23:10:00Z',4)];
    assert.deepEqual(progressDailyMeasurements(autumn,Date.parse('2026-10-27T12:00:00Z')).map(p=>p.value),[3,4]);
    const spring=progressLocalDayNumber('2026-03-29T12:00:00Z'),fall=progressLocalDayNumber('2026-10-25T12:00:00Z');
    assert.equal(progressLocalDayDate(spring+1)-progressLocalDayDate(spring),23*3600000);
    assert.equal(progressLocalDayDate(fall+1)-progressLocalDayDate(fall),25*3600000);
    const week=progressSummaryWindow({period:'week'},[make('2026-03-01T00:00:00Z',0)],Date.parse('2026-03-31T12:00:00Z'));
    assert.equal(week.toDay-week.fromDay,6);`;
  execFileSync(process.execPath,['-e',script],{env:{...process.env,TZ:'Europe/Amsterdam'}});
  execFileSync(process.execPath,['-e',`${source};require('node:assert/strict').equal(progressDailyMeasurements([{at:Date.parse('2026-10-05T06:30:00Z'),value:1},{at:Date.parse('2026-10-05T07:30:00Z'),value:2}],Date.parse('2026-10-06T12:00:00Z')).length,2)`],{env:{...process.env,TZ:'America/Los_Angeles'}});
});
test('progress summary is accessible and selection is not persisted in learning data',()=>{
  const source=html.slice(html.indexOf('function renderProgressSummary('),html.indexOf('function renderProgressDashboard('));
  assert.match(source,/aria-pressed/);assert.match(source,/✓ Geselecteerd/);assert.match(source,/aria-valuetext/);assert.match(source,/oninput/);assert.doesNotMatch(source,/scheduleSave|saveProgress|localStorage/);
  const dashboard=html.slice(html.indexOf('function renderProgressDashboard('),html.indexOf('function renderStudyAdjustment('));assert.doesNotMatch(dashboard,/category-bar|category-breakdown/);
  const analysis=html.slice(html.indexOf('function renderStudyAnalysis('),html.indexOf('function computedTimelineEvents('));assert.doesNotMatch(analysis,/categoryBreakdownHtml|end\.vocab/);
});
