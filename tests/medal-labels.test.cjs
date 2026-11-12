const test=require('node:test');
const assert=require('node:assert/strict');
const {createCrashCourseProbe}=require('./app-probe.cjs');

test('Dutch medal labels are displayed without changing stored ranks',()=>{
  for(const [rank,label] of [['Copper','Koper'],['Silver','Zilver'],['Gold','Goud'],['Platinum','Platina']]){
    const p=createCrashCourseProbe({savedRanks:{'intro-exam':{rank,attempts:1,last:1}}});
    p.state.uiLanguage='nl';p.openSocialIntro();
    assert.match(p.element('mainView').innerHTML,new RegExp(`>${label}</span>`));
    assert.equal(p.saved().ranks['intro-exam'].rank,rank);
  }
});
