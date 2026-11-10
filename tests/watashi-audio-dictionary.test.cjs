'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const content=require('../language-journey-content/content.js'),manifest=require('../assets/audio/ja/manifest.js'),audio=require('../audio/playback.js');
const {createCrashCourseProbe}=require('./app-probe.cjs');

test('Dictionary uses one canonical word, with independent introduction sources for kana and kanji',()=>{
  const p=createCrashCourseProbe(),word=p.dictionaryById['vocab-わたし'];
  assert.equal(word.kanji,'私');assert.equal(word.kanjiIntroducedAt,'11-1-B');
  assert.deepEqual(Array.from(p.dictionarySearch('私').filter(entry=>entry.kind==='woord'&&entry.jp==='わたし'),entry=>entry.id),['vocab-わたし']);
  const before=JSON.stringify({state:p.state,ranks:p.rankState,mastery:p.vocabMastery});
  const preview=p.dictionaryArticleHtml(word);assert.doesNotMatch(preview,/Kanji: 私/);
  assert.equal(JSON.stringify({state:p.state,ranks:p.rankState,mastery:p.vocabMastery}),before);
  p.state.introducedVocabIds.push(word.id);p.state.kanjiExposureIds.push(word.id);
  const introduced=JSON.stringify({state:p.state,ranks:p.rankState,mastery:p.vocabMastery}),article=p.dictionaryArticleHtml(word);
  assert.match(article,/Kanji: 私 · lezing: わたし · schrijfwijze geïntroduceerd in Level 11 · Les 1/);
  assert.match(article,/Level 3 · Les 3/,'word retains its original visible course source');
  assert.equal(JSON.stringify({state:p.state,ranks:p.rankState,mastery:p.vocabMastery}),introduced);
});

test('one intentional tap on either spelling queues exactly one canonical recording',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').replace(/\r\n/g,'\n');
  const start=html.indexOf("document.addEventListener('click',event=>{\n  const celebration=");
  const end=html.indexOf("document.addEventListener('click',event=>{const button=event.target.closest('[data-dictionary-open]')",start);
  assert.ok(start>=0&&end>start,'central capture handler is present');
  const resolved=audio.resolve(content,manifest,'vocab-わたし','わたし');
  assert.equal(resolved.assets.length,1);assert.ok(fs.existsSync(path.join(__dirname,'..',resolved.assets[0].path)));
  for(const text of ['わたし','私'])for(const profile of ['clean','existing']){
    let clickHandler,plays=0;const timers=[];
    const playback=audio.createPlayback({createAudio:()=>({play(){plays++;return Promise.resolve()},pause(){}}),delay:fn=>{timers.push(fn);return timers.length},cancelDelay:()=>{}});
    const button={dataset:{audioKey:'vocab-わたし',audioText:text},closest:()=>null};
    const target={closest:selector=>selector==='[data-audio-key],[data-audio-text]'?button:null};
    const sandbox={document:{addEventListener:(name,handler)=>{if(name==='click')clickHandler=handler}},state:{thematic:{step:'words',questionIndex:0},flashcardSession:null,profile},activeWordCrashCourse:null,
      recallFeedbackWasCorrect:()=>false,thematicPart:()=>null,playAvatarAudio:(id,value)=>{assert.equal(id,'vocab-わたし');assert.equal(value,text);return playback.play(resolved.assets)},audioCoachCompletion:null,
      $:()=>({dataset:{}}),Date};
    vm.runInNewContext(html.slice(start,end),sandbox);
    const event={target,preventDefault(){},stopPropagation(){}};clickHandler(event);
    assert.equal(plays,1,`${profile} ${text}: one tap starts one audio element`);assert.equal(timers.length,0,'single clip needs no follow-on segment');
    clickHandler(event);assert.equal(plays,2,`${profile} ${text}: a separate tap can play again`);
  }
});
