const test=require('node:test');
const assert=require('node:assert/strict');
const {createCrashCourseProbe}=require('./app-probe.cjs');
const content=require('../language-journey-content/content.js');
const music=require('../language-journey-content/music.js');

function choices(host){
  let html='';const cache={};
  host.querySelectorAll=selector=>{
    if(html!==host.innerHTML){html=host.innerHTML;for(const key of Object.keys(cache))delete cache[key]}
    if(!cache[selector]){
      const attr=selector.match(/^\[data-(music-(?:practice|check|context-answer))\]$/)?.[1];if(!attr)return [];
      const key=attr.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
      cache[selector]=[...html.matchAll(new RegExp(`data-${attr}="(\\d+)"`,'g'))].map(match=>{const classes=new Set();return {dataset:{[key]:match[1]},disabled:false,classList:{add:value=>classes.add(value),contains:value=>classes.has(value)}}});
    }
    return cache[selector];
  };
}
function timer(p){return p.crashTimers.findLastIndex(t=>t.delay===1500&&!t.cancelled&&!t.fired)}
function setup(){const p=createCrashCourseProbe({feedbackTimers:true}),host=p.element('mainView');choices(host);p.state.screen='music';p.state.music={introduced:[],kanjiIntroduced:[],score:null};p.renderMusic(host);return {p,host}}

test('group kanji shortcuts match their groups without introducing words',()=>{
  const {p,host}=setup();p.element('musicStart').onclick();p.renderMusic(host);
  music.groups.forEach((group,index)=>assert.equal(host.innerHTML.includes(`id="musicWordKanji${index}"`),group.some(id=>!!content.vocabById[id]?.kanji)));
  const index=music.groups.findIndex(group=>group.some(id=>content.vocabById[id]?.kanji));p.element(`musicWordKanji${index}`).onclick();
  assert.equal(p.musicSession.groupKanjiOnly,true);assert.deepEqual(Array.from(p.musicSession.groupIds),music.groups[index]);assert.equal(p.state.introducedVocabIds.length,0);
});

test('correct music answer displays green feedback and schedules only one advance',()=>{
  const {p,host}=setup();p.element('musicStart').onclick();p.renderMusic(host);p.element('musicWordGroup0').onclick();p.element('musicNext').onclick();p.renderMusic(host);
  assert.match(host.innerHTML,/role="progressbar"/);const q=p.musicSession.practiceQuestion,buttons=host.querySelectorAll('[data-music-practice]'),selected=buttons[q.choices.indexOf(q.answer)];
  selected.onclick();selected.onclick();assert.equal(selected.classList.contains('correct'),true);assert.ok(buttons.every(b=>b.disabled));assert.equal(p.musicSession.practiceIndex,0);assert.equal(p.crashTimers.filter(t=>t.delay===1500&&!t.cancelled&&!t.fired).length,1);
  p.fireCrashTimer(timer(p));assert.equal(p.musicSession.practiceIndex,1);
});

test('back navigation cancels pending music progress',()=>{
  const {p,host}=setup();p.element('musicStart').onclick();p.renderMusic(host);p.element('musicWordGroup0').onclick();p.element('musicNext').onclick();p.renderMusic(host);
  const q=p.musicSession.practiceQuestion;host.querySelectorAll('[data-music-practice]')[q.choices.indexOf(q.answer)].onclick();const pending=timer(p);assert.ok(pending>=0);
  p.element('sceneTransition').hidden=true;for(const id of ['sessionView','flashcardView','quizView','resultView'])p.element(id).classList.add('hidden');p.navigateBack();p.fireCrashTimer(pending);assert.equal(p.state.introducedVocabIds.length,0);assert.equal(p.musicSession.step,'words-list');
});
