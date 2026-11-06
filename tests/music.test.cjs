const test=require('node:test');
const assert=require('node:assert/strict');
const content=require('../language-journey-content/content.js');
const music=require('../language-journey-content/music.js');
const {createCrashCourseProbe}=require('./app-probe.cjs');
function interactiveChoices(host){
  let current='';const cache={};host.querySelectorAll=selector=>{if(current!==host.innerHTML){current=host.innerHTML;for(const key of Object.keys(cache))delete cache[key]}if(!cache[selector]){const attr=selector.match(/^\[data-(music-(?:practice|check|answer))\]$/)?.[1];if(!attr)return [];const key=attr.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());cache[selector]=[...host.innerHTML.matchAll(new RegExp(`data-${attr}="(\\d+)"`,'g'))].map(match=>({dataset:{[key]:match[1]},disabled:false}))}return cache[selector]};
}
test('music inventory uses canonical catalog IDs, unique words and small blocks',()=>{
  const ids=music.groups.flat();assert.equal(new Set(ids).size,ids.length);assert.ok(music.groups.every(group=>group.length<=3));
  for(const id of ids)assert.ok(content.vocabById[id],id);
  const copy={vocabulary:[{id:'vocab-existing-joy',japanese:'よろこび',meaning:'vreugde',kanjiForm:'喜び',coreOrContext:'core'}]};
  music.apply(copy);assert.ok(music.groups.flat().includes('vocab-existing-joy'));
  // Restore the module in isolation; the app content was constructed before this check.
  delete require.cache[require.resolve('../language-journey-content/music.js')];
});
test('music statuses and quiz do not modify rank, Recall or mastery',()=>{
  const p=createCrashCourseProbe();const id='vocab-music-kimochi';
  const unlocked=content.manifest.music.groups[0];p.state.music={introduced:[...unlocked],kanjiIntroduced:[],score:null};
  assert.equal(p.musicWordStatus(id),'new');p.state.introducedVocabIds.push(id);assert.equal(p.musicWordStatus(id),'review');
  p.state.jlptMilestones.lexemes[id]={everMastered:true};assert.equal(p.musicWordStatus(id),'mastered');
  const before=JSON.stringify({ranks:p.rankState,recall:p.state.flashcardProgress,mastery:p.vocabMastery});
  const questions=p.musicQuestions();assert.ok(questions.length>=3&&questions.length<=13);assert.ok(questions.every(q=>q.kind!=='kanji'));assert.ok(questions.filter(q=>q.word).every(q=>unlocked.includes(q.word.id)));
  assert.equal(JSON.stringify({ranks:p.rankState,recall:p.state.flashcardProgress,mastery:p.vocabMastery}),before);
  p.state.jlptMilestones.lexemes[id].everMastered=false;p.state.music.kanjiIntroduced=[id];p.state.kanjiExposureIds.push(id);assert.ok(p.musicQuestions().some(q=>q.kind==='kanji'&&q.word.id===id));
});

test('music meaning preview and the final exam use only unlocked material and never release extra words',()=>{
  const p=createCrashCourseProbe(),host=p.element('music-host'),ids=content.manifest.music.groups[0];p.state.screen='music';p.state.music={introduced:[],kanjiIntroduced:[],score:null};
  const progress=()=>JSON.stringify({introduced:p.state.introducedVocabIds,exposure:p.state.kanjiExposureIds,recall:p.state.flashcardProgress,ranks:p.rankState,milestones:p.state.jlptMilestones});
  const before=progress();p.renderMusic(host);assert.match(host.innerHTML,/Betekenis en bijzondere zinnen/);p.element('musicMeaning').onclick();p.renderMusic(host);
  assert.match(host.innerHTML,/Van afkeer naar genegenheid/);assert.equal(progress(),before);
  p.element('musicMeaningDone').onclick();p.renderMusic(host);p.element('musicQuiz').onclick();p.renderMusic(host);assert.match(host.innerHTML,/Eerst woorden leren/);assert.equal(progress(),before);
  p.state.music.introduced.push(...ids);p.state.introducedVocabIds.push(...ids);p.musicSession.step='overview';p.renderMusic(host);const unlocked=progress();p.element('musicQuiz').onclick();
  assert.ok(p.musicSession.questions.some(q=>q.kind==='context'));assert.ok(p.musicSession.questions.filter(q=>q.word).every(q=>ids.includes(q.word.id)));assert.ok(!p.musicSession.questions.some(q=>q.kind==='kanji'));
  p.musicSession.score=p.musicSession.questions.length;p.musicSession.index=p.musicSession.questions.length;p.renderMusic(host);
  assert.equal(p.state.music.examRank,'Copper');assert.equal(progress(),unlocked);p.renderMusic(host);assert.equal(p.state.music.examRank,'Copper','re-render does not award another medal');
  const saved=p.saved(),again=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks});assert.equal(again.state.music.examRank,'Copper');assert.equal(again.state.music.examTotal,p.musicSession.questions.length);
});

test('opening a word block never unlocks it; only a Copper block check releases its catalog IDs',()=>{
  const p=createCrashCourseProbe(),host=p.element('music-host');p.state.screen='music';p.state.music={introduced:[],kanjiIntroduced:[],score:null};
  p.renderMusic(host);const before=JSON.stringify({ranks:p.rankState,recall:p.state.flashcardProgress});
  p.element('musicStart').onclick();assert.equal(p.state.music.introduced.length,0);
  p.element('musicNext').onclick();assert.equal(p.state.music.introduced.length,0);assert.equal(p.state.introducedVocabIds.length,0);
  p.musicSession.practiceIndex=p.musicSession.practiceOrder.length;p.renderMusic(host);
  p.musicSession.testIndex=p.musicSession.groupIds.length*2;p.musicSession.testScore=5;p.renderMusic(host);
  p.element('musicGroupDone').onclick();assert.equal(p.state.music.introduced.length,3);
  assert.deepEqual(Object.values(p.state.music.wordRanks),['Copper']);
  for(const id of p.state.music.introduced)assert.ok(p.flashcardEligibleCards().some(card=>card.id===id));
  assert.equal(JSON.stringify({ranks:p.rankState,recall:p.state.flashcardProgress}),before);
  const saved=p.saved();const reloaded=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks});assert.deepEqual(Array.from(reloaded.state.music.introduced),Array.from(p.state.music.introduced));assert.deepEqual(Object.values(reloaded.state.music.wordRanks),['Copper']);reloaded.musicSession.step='overview';reloaded.renderMusic(reloaded.element('music-host'));assert.match(reloaded.element('music-host').innerHTML,/Mijn liedjesmedailles/);
});

test('music word practice mixes both directions, hides the solution and retries an error before its two-direction check',()=>{
  const p=createCrashCourseProbe(),host=p.element('music-host');interactiveChoices(host);p.state.screen='music';p.state.music={introduced:[],kanjiIntroduced:[],score:null};p.renderMusic(host);p.element('musicStart').onclick();p.renderMusic(host);p.element('musicNext').onclick();p.renderMusic(host);
  const ids=p.musicSession.groupIds,order=p.musicSession.practiceOrder;assert.equal(order.length,ids.length*3);
  for(const id of ids){const items=order.filter(item=>item.id===id);assert.equal(items.length,3);assert.ok(items.some(item=>item.direction==='jp-nl'));assert.ok(items.some(item=>item.direction==='nl-jp'))}
  for(let i=1;i<order.length;i++)assert.notEqual(order[i-1].id,order[i].id);
  const q=p.musicSession.practiceQuestion,wrong=q.choices.findIndex(choice=>choice!==q.answer),before=order.length;assert.ok(wrong>=0);assert.doesNotMatch(host.innerHTML,/<p>Antwoord:/);host.querySelectorAll('[data-music-practice]')[wrong].onclick();assert.equal(order.length,before+1);assert.equal(order.at(-1).id,q.word.id);assert.equal(p.state.music.introduced.length,0);
  p.element('musicPracticeNext').onclick();p.musicSession.practiceIndex=order.length;p.renderMusic(host);assert.equal(p.musicSession.step,'group-test');
  for(const id of ids){const items=p.musicSession.testOrder.filter(item=>item.id===id);assert.equal(items.length,2);assert.deepEqual(Array.from(items,item=>item.direction).sort(),['jp-nl','nl-jp'])}
});

test('music kanji stays preview-only until its own quiz reaches Copper, then enters mixed Recall',()=>{
  const p=createCrashCourseProbe(),host=p.element('music-host'),id=music.groups[0].find(wordId=>content.vocabById[wordId]?.kanji);p.state.screen='music';p.state.music={introduced:[...music.groups[0]],kanjiIntroduced:[],score:null};p.state.introducedVocabIds=[...music.groups[0]];
  p.musicSession.step='kanji';p.renderMusic(host);assert.equal(p.state.kanjiExposureIds.length,0);p.element('musicKanjiNext').onclick();assert.equal(p.state.kanjiExposureIds.length,0);const testedId=p.musicSession.kanjiWords[0];
  assert.equal(p.musicSession.step,'kanji-practice');assert.ok(p.musicSession.questions.length>=9);assert.equal(p.musicSession.questions.filter(q=>q.direction==='kana-to-kanji').length,4);assert.equal(p.musicSession.questions.filter(q=>q.direction==='kanji-to-kana').length,4);
  p.musicSession.index=p.musicSession.questions.length;p.renderMusic(host);assert.equal(p.musicSession.step,'kanji-test');
  for(const q of p.musicSession.questions.filter(q=>q.kind==='kanji-component'))p.musicSession.componentResults[q.character]=true;
  p.musicSession.index=p.musicSession.questions.length;p.musicSession.score=p.musicSession.questions.length;p.renderMusic(host);
  assert.ok(p.state.music.kanjiIntroduced.includes(testedId));assert.ok(p.state.kanjiExposureIds.includes(testedId));
  const characters=[...new Set([...content.vocabById[testedId].kanji].filter(character=>/\p{Script=Han}/u.test(character)))];
  for(const character of characters)assert.ok(p.flashcardEligibleCards().some(card=>card.id===`kanji-card:${character}`));
});

test('song compounds are sourced notes on whole-word IDs; each component requires its own correct check before release',()=>{
  const catalog=content.vocabById,groups=content.manifest.music.groups.flat();for(const id of groups){const word=catalog[id],chars=[...new Set([...(word.kanji||'')].filter(c=>/\p{Script=Han}/u.test(c)))];if(chars.length!==2)continue;const notes=music.components[id];assert.ok(notes,`${id} needs verified notes or must remain out of teaching`);assert.deepEqual(notes.map(note=>note.character).sort(),chars.sort());for(const note of notes){assert.ok(word.kana.includes(note.reading));assert.match(note.source,/^https:\/\/www\.kanjipedia\.jp\//);assert.ok(note.meaning)}}
  const p=createCrashCourseProbe(),host=p.element('music-host'),id='vocab-music-kimochi';interactiveChoices(host);p.state.screen='music';p.state.music={introduced:[id],kanjiIntroduced:[],score:null};p.state.introducedVocabIds=[id];
  const beforeWords=JSON.stringify(p.state.introducedVocabIds),beforeCredit=JSON.stringify(p.state.jlptMilestones);p.musicSession.step='kanji';p.renderMusic(host);assert.match(host.innerHTML,/気 \(き in dit woord\)/);assert.match(host.innerHTML,/持 \(も in dit woord\)/);assert.equal(JSON.stringify(p.state.introducedVocabIds),beforeWords);assert.equal(p.state.kanjiExposureIds.length,0);
  p.element('musicKanjiNext').onclick();p.musicSession.index=p.musicSession.questions.length;p.renderMusic(host);assert.equal(p.musicSession.questions.filter(q=>q.kind==='kanji-component').length,2);assert.ok(p.musicSession.questions.some(q=>q.direction==='kana-to-kanji'));assert.ok(p.musicSession.questions.some(q=>q.direction==='kanji-to-kana'));
  p.musicSession.score=p.musicSession.questions.length;p.musicSession.componentResults={'気':true,'持':false};p.musicSession.index=p.musicSession.questions.length;p.renderMusic(host);assert.equal(p.state.kanjiExposureIds.length,0,'a missed character cannot be released even with an otherwise high score');
  p.element('musicDone').onclick();p.renderMusic(host);p.element('musicKanji').onclick();p.renderMusic(host);p.element('musicKanjiNext').onclick();p.musicSession.index=p.musicSession.questions.length;p.renderMusic(host);
  while(p.musicSession.index<p.musicSession.questions.length){p.renderMusic(host);const q=p.musicSession.questions[p.musicSession.index],answer=q.choices.indexOf(q.answer);host.querySelectorAll('[data-music-answer]')[answer].onclick();p.element('musicContinue').onclick()}
  p.renderMusic(host);assert.deepEqual(Array.from(p.state.music.kanjiIntroduced),[id]);assert.equal(p.state.music.kanjiRanks[id],'Copper');assert.equal(JSON.stringify(p.state.introducedVocabIds),beforeWords);assert.equal(JSON.stringify(p.state.jlptMilestones),beforeCredit);assert.ok(p.flashcardEligibleCards().some(card=>card.id==='kanji-card:気'));assert.ok(p.flashcardEligibleCards().some(card=>card.id==='kanji-card:持'));assert.ok(p.flashcardEligibleCards().some(card=>card.id===`kanji-word:${id}`));
  const saved=p.saved(),again=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks});assert.equal(again.state.music.kanjiRanks[id],'Copper');assert.deepEqual(Array.from(again.state.music.componentEvidence[id]).sort(),['持','気'].sort());assert.ok(again.flashcardEligibleCards().some(card=>card.id===`kanji-word:${id}`));assert.ok(again.flashcardEligibleCards().some(card=>card.id==='kanji-card:持'));
});

test('optional music vocabulary is a validated route consumer, not a level lesson',()=>{
  const {validate}=require('../language-journey-content/validate.cjs');
  const manifest=structuredClone(content.manifest),ids=manifest.music.groups.flat();
  assert.ok(!validate(manifest).diagnostics.some(d=>d.code==='ORPHAN_VOCAB'&&ids.includes(d.id)));
  assert.ok(manifest.lessons.every(lesson=>lesson.id!=='music-quintuplets'));
  manifest.music.groups[0].push('vocab-not-real');
  assert.ok(validate(manifest).diagnostics.some(d=>d.code==='UNKNOWN_MUSIC_VOCAB'));
});
