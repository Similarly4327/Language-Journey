const test=require('node:test');
const assert=require('node:assert/strict');
const content=require('../language-journey-content/content.js');
const music=require('../language-journey-content/music.js');
const {createCrashCourseProbe}=require('./app-probe.cjs');
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
  p.state.music={introduced:[],kanjiIntroduced:[],score:null};
  assert.equal(p.musicWordStatus(id),'new');p.state.introducedVocabIds.push(id);assert.equal(p.musicWordStatus(id),'review');
  p.state.jlptMilestones.lexemes[id]={everMastered:true};assert.equal(p.musicWordStatus(id),'mastered');
  const before=JSON.stringify({ranks:p.rankState,recall:p.state.flashcardProgress,mastery:p.vocabMastery});
  const questions=p.musicQuestions();assert.ok(questions.length>=10&&questions.length<=15);assert.ok(questions.every(q=>q.kind!=='kanji'));
  assert.equal(JSON.stringify({ranks:p.rankState,recall:p.state.flashcardProgress,mastery:p.vocabMastery}),before);
  p.state.jlptMilestones.lexemes[id].everMastered=false;p.state.music.kanjiIntroduced=[id];assert.ok(p.musicQuestions().some(q=>q.kind==='kanji'&&q.word.id===id));
});

test('opening and completing a word block preserves ranks and Recall while unlocking its catalog IDs',()=>{
  const p=createCrashCourseProbe(),host=p.element('music-host');p.state.screen='music';p.state.music={introduced:[],kanjiIntroduced:[],score:null};
  p.renderMusic(host);const before=JSON.stringify({ranks:p.rankState,recall:p.state.flashcardProgress});
  p.element('musicStart').onclick();assert.equal(p.state.music.introduced.length,0);
  p.element('musicNext').onclick();assert.equal(p.state.music.introduced.length,3);
  for(const id of p.state.music.introduced)assert.ok(p.flashcardEligibleCards().some(card=>card.id===id));
  assert.equal(JSON.stringify({ranks:p.rankState,recall:p.state.flashcardProgress}),before);
  const saved=p.saved();const reloaded=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks});assert.deepEqual(Array.from(reloaded.state.music.introduced),Array.from(p.state.music.introduced));
});

test('optional music vocabulary is a validated route consumer, not a level lesson',()=>{
  const {validate}=require('../language-journey-content/validate.cjs');
  const manifest=structuredClone(content.manifest),ids=manifest.music.groups.flat();
  assert.ok(!validate(manifest).diagnostics.some(d=>d.code==='ORPHAN_VOCAB'&&ids.includes(d.id)));
  assert.ok(manifest.lessons.every(lesson=>lesson.id!=='music-quintuplets'));
  manifest.music.groups[0].push('vocab-not-real');
  assert.ok(validate(manifest).diagnostics.some(d=>d.code==='UNKNOWN_MUSIC_VOCAB'));
});
