const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const source=html.slice(html.indexOf('function progressSummaryPoints('),html.indexOf('function renderProgressSummary('));
const context={};vm.runInNewContext(source+';globalThis.points=progressSummaryPoints;',context);
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
test('progress summary is accessible and selection is not persisted in learning data',()=>{
  const source=html.slice(html.indexOf('function renderProgressSummary('),html.indexOf('function renderProgressDashboard('));
  assert.match(source,/aria-pressed/);assert.match(source,/✓ Geselecteerd/);assert.match(source,/aria-valuetext/);assert.match(source,/oninput/);assert.doesNotMatch(source,/scheduleSave|saveProgress|localStorage/);
  const dashboard=html.slice(html.indexOf('function renderProgressDashboard('),html.indexOf('function renderStudyAdjustment('));assert.doesNotMatch(dashboard,/category-bar|category-breakdown/);
  const analysis=html.slice(html.indexOf('function renderStudyAnalysis('),html.indexOf('function computedTimelineEvents('));assert.doesNotMatch(analysis,/categoryBreakdownHtml|end\.vocab/);
});
