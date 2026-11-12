const test=require('node:test'),assert=require('node:assert/strict');
const {createCrashCourseProbe}=require('./app-probe.cjs');

test('Level 12 terminal answer cards center numeric options just like Japanese text',()=>{
  for(const width of [375,1280]){
    const app=createCrashCourseProbe({width});
    app.state.level=11;app.state.screen='module';
    app.state.thematic={level:12,lessonIndex:0,part:'A',step:'questions',microblockIndex:1,flowRevision:1,questionIndex:0,correct:0,answered:false,optionsRevealed:true};
    app.renderMain();
    const buttons=app.element('thematicBody').innerHTML.match(/<button class="btn thematic-choice[^>]*>[^<]*/g);
    assert.equal(buttons.length,3);
    for(const b of buttons)assert.match(b,/thematic-choice-jp/);
    assert.deepEqual(buttons.map(b=>b.match(/>(.*)$/)[1]).sort(),['1','2','3']);
    const q=app.thematicCourses[11].lessons[0].applications[0].questions[0],original=q.choices;
    try{
      q.choices=['12345','にほん','42.50'];
      app.renderMain();
      const samples=app.element('thematicBody').innerHTML.match(/<button class="btn thematic-choice[^>]*>[^<]*/g);
      assert.equal(samples.length,3);
      for(const b of samples)assert.match(b,/thematic-choice-jp/);
      assert.deepEqual(samples.map(b=>b.match(/>(.*)$/)[1]).sort(),['12345','42.50','にほん']);
    }finally{q.choices=original}
  }
});
