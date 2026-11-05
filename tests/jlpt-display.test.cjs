const test=require('node:test');
const assert=require('node:assert/strict');
const {createCrashCourseProbe}=require('./app-probe.cjs');
const plain=x=>JSON.parse(JSON.stringify(x));
test('JLPT dashboard displays all five permanent milestone totals and exact disclaimer without changing state',()=>{
  const app=createCrashCourseProbe();
  const before=plain(app.saved().state);const html=app.jlptProgressHtml();
  for(const [level,words,kanji] of [['N5',1000,100],['N4',2000,300],['N3',4000,650],['N2',7000,1000],['N1',11000,2000]]){
    assert.match(html,new RegExp(`<strong>${level}</strong>`));assert.match(html,new RegExp(`0 / ${words} unieke ooit beheerste woorden`));assert.match(html,new RegExp(`0 / ${kanji} unieke in context beheerste kanji`));
  }
  assert.equal((html.match(/role="progressbar"/g)||[]).length,5);assert.equal((html.match(/0,0%/g)||[]).length,5);
  assert.match(html,/Deze percentages zijn berekend op basis van unieke, ooit beheerste woorden en kanji volgens de eigen Language Journey-richtlijn \(70% woorden \/ 30% kanji\)\. Het is geen officiële JLPT-score, certificaat of garantie op examenresultaten\. Andere vaardigheden, waaronder grammatica, lezen en luisteren, worden niet door dit percentage beoordeeld\./);
  assert.doesNotMatch(html,/800 woorden|maximaal 3|geen totaalpercentage/i);assert.deepEqual(plain(app.saved().state),before);
});
test('JLPT dashboard formats actual values and highlights only a fully reached goal',()=>{
  const app=createCrashCourseProbe();
  for(let i=0;i<1000;i++)app.state.jlptMilestones.lexemes['vocab-test-'+i]={everMastered:true};
  for(let i=0;i<100;i++)app.state.jlptMilestones.kanji[String.fromCodePoint(0x4e00+i)]={everMastered:true};
  const html=app.jlptProgressHtml();assert.match(html,/<strong>N5<\/strong><strong>100,0% · Richtdoel bereikt/);assert.match(html,/<strong>N4<\/strong><strong>45,0%/);assert.equal((html.match(/jlpt-level-complete/g)||[]).length,1);
});
test('unknown future milestone schemas show unavailable rather than zero progress',()=>{
  const app=createCrashCourseProbe();app.state.jlptMilestones={version:99,scale:'future',data:'retained'};
  const before=plain(app.state.jlptMilestones),html=app.jlptProgressHtml();assert.match(html,/kan met deze versie niet worden weergegeven/);assert.doesNotMatch(html,/0,0%/);assert.deepEqual(plain(app.state.jlptMilestones),before);
});

