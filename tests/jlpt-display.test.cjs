const test=require('node:test');
const assert=require('node:assert/strict');
const {createCrashCourseProbe}=require('./app-probe.cjs');
const plain=x=>JSON.parse(JSON.stringify(x));
test('JLPT dashboard displays five-recall fractional counts and the corrected disclaimer without changing state',()=>{
  const app=createCrashCourseProbe();
  const before=plain(app.saved().state);const html=app.jlptProgressHtml();
  for(const [level,words,kanji] of [['N5',1000,100],['N4',2000,300],['N3',4000,650],['N2',7000,1000],['N1',11000,2000]]){
    assert.match(html,new RegExp(`<span class="jlpt-level-title">${level}</span>`));assert.match(html,new RegExp(`0 / ${words}`));assert.match(html,new RegExp(`0 / ${kanji}`));
  }
  assert.equal((html.match(/role="progressbar"/g)||[]).length,5);assert.equal((html.match(/0,0%/g)||[]).length,10);
  assert.match(html,/per item na vijf afzonderlijke geslaagde Recall-herhalingen/);assert.match(html,/Een fout antwoord wist de actieve reeks, maar eerder verdiende deelcredit blijft staan/);
  assert.doesNotMatch(html,/800 woorden|maximaal 3|geen totaalpercentage/i);assert.deepEqual(plain(app.saved().state),before);
});
test('JLPT dashboard formats fractional values from actual review evidence',()=>{
  const app=createCrashCourseProbe();
  app.state.jlptMilestones.lexemes['vocab-ねこ']={streak:1,creditUnits:1,everMastered:false};
  app.state.jlptMilestones.kanji['電']={streak:2,creditUnits:2,everMastered:false};
  const html=app.jlptProgressHtml();assert.match(html,/0,2 \/ 1000/);assert.match(html,/0,4 \/ 100/);assert.match(html,/0,13%/);assert.equal((html.match(/jlpt-level-complete/g)||[]).length,0);
});
test('unknown future milestone schemas show unavailable rather than zero progress',()=>{
  const app=createCrashCourseProbe();app.state.jlptMilestones={version:99,scale:'future',data:'retained'};
  const before=plain(app.state.jlptMilestones),html=app.jlptProgressHtml();assert.match(html,/kan met deze versie niet worden weergegeven/);assert.doesNotMatch(html,/0,0%/);assert.deepEqual(plain(app.state.jlptMilestones),before);
});

