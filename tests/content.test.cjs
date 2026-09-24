const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const content=require('../language-journey-content/content.js');
const {validate,format}=require('../language-journey-content/validate.cjs');

const copy=()=>structuredClone(content.manifest);
const codes=result=>result.diagnostics.map(d=>d.code);

test('current curriculum validates with no errors',()=>assert.equal(validate().counts.ERROR,0));
test('all ten levels have renderable adapter data',()=>{
  assert.equal(content.levels.length,10);
  assert.equal(content.langLessons.length,10);
  assert.equal(content.smallLessons.length,5);
  for(let n=6;n<=10;n++)assert.ok(content.advancedCourses[n-1].lessons.length>=5);
  assert.equal(content.hira.flat().length,46);
  assert.equal(content.kata.flat().length,46);
  assert.ok(content.numberLessons.length>0);
  for(const lesson of [...content.langLessons,...content.smallLessons,...Object.values(content.advancedCourses).flatMap(c=>c.lessons)]){
    assert.ok(lesson.title);
    assert.ok((lesson.words||lesson.examples||[]).every(tuple=>Array.isArray(tuple)&&tuple.length>=3));
  }
});
test('app script parses, imports registry and preserves storage key',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const match=html.match(/<script>\s*([\s\S]*?)<\/script>/);
  assert.ok(match);
  new vm.Script(match[1]);
  assert.match(html,/language-journey-content\/content\.js/);
  const platform=fs.readFileSync(path.join(__dirname,'../platform.js'),'utf8');
  assert.ok(platform.includes("storageKey:'taal-japanse-leerapp-v1'"));
  assert.match(html,/const STORAGE_VERSION=6/);
});
test('knowledge state is cumulative and excludes later and legacy words',()=>{
  const first=content.getKnowledgeState('4-1'),last=content.getKnowledgeState('10-complete');
  assert.ok(first.vocabulary.some(v=>v.japanese==='ねこ'));
  assert.ok(!first.vocabulary.some(v=>v.japanese==='あれ'));
  assert.ok(last.vocabulary.some(v=>v.japanese==='あれ'));
  assert.ok(!last.vocabulary.some(v=>v.coreOrContext==='legacy'));
  assert.ok(content.getKnowledgeState('3').kana.length>content.getKnowledgeState('1').kana.length);
  assert.ok(content.getKnowledgeState('5').kana.length>content.getKnowledgeState('3').kana.length);
  assert.ok(content.pointOrder('11-1-A')<content.pointOrder('11-1-B'));
  assert.ok(content.pointOrder('10-complete')<content.pointOrder('11-1-A'));
});
test('future vocabulary and grammar are rejected',()=>{
  const m=copy();
  m.lessons.find(l=>l.id==='l4-1').wordIds.push('vocab-あれ');
  m.lessons.find(l=>l.id==='l4-1').grammarIds.push('grammar-no');
  const result=validate(m,{checkFiles:false});
  assert.ok(codes(result).filter(c=>c==='FUTURE_KNOWLEDGE').length>=2);
});
test('explicit context vocabulary is allowed in a reading, but not a core reference',()=>{
  const m=copy(),reading=m.readings[0];
  reading.lessonId='l4-1';reading.contextVocabIds=['vocab-あれ'];reading.contextIntroductions=[{vocabId:'vocab-あれ',kana:'あれ',romaji:'are',meaning:'dat daar'}];
  assert.ok(!codes(validate(m,{checkFiles:false})).includes('FUTURE_KNOWLEDGE'));
  reading.requiredVocabIds=['vocab-あれ'];
  assert.ok(codes(validate(m,{checkFiles:false})).includes('FUTURE_KNOWLEDGE'));
});
test('duplicate IDs and unknown references are errors',()=>{
  const m=copy();
  m.vocabulary.push(structuredClone(m.vocabulary[0]));
  m.lessons[0].wordIds.push('vocab-does-not-exist');
  const found=codes(validate(m,{checkFiles:false}));
  assert.ok(found.includes('DUPLICATE_ID'));
  assert.ok(found.includes('UNKNOWN_REFERENCE'));
});
test('kanji can follow a known word but not precede it',()=>{
  const m=copy(),word=m.vocabulary.find(v=>v.japanese==='ねこ');
  word.kanjiForm='猫';word.kanjiIntroducedAt='11-1-A';
  assert.ok(!codes(validate(m,{checkFiles:false})).includes('KANJI_BEFORE_WORD'));
  word.kanjiIntroducedAt='3-1';
  assert.ok(codes(validate(m,{checkFiles:false})).includes('KANJI_BEFORE_WORD'));
});
test('optional bonus is linked without changing core lesson IDs',()=>{
  const m=copy();
  m.bonus.push({id:'bonus-l11-1',lessonId:'l4-1',type:'dialogue',optional:true});
  m.lessons[0].bonusIds=['bonus-l11-1'];
  assert.ok(!codes(validate(m,{checkFiles:false})).includes('UNKNOWN_REFERENCE'));
  assert.equal(content.manifest.levels[3].lessonIds[0],'l4-1');
});
test('a playable Level 11 needs five lessons and both modules',()=>{
  const m=copy();
  m.levels.push({number:11,title:'Level 11',theme:'Draft',status:'playable',lessonIds:[]});
  assert.ok(codes(validate(m,{checkFiles:false})).includes('FUTURE_LEVEL_STRUCTURE'));
});
test('audio references and missing files have distinct severities',()=>{
  const m=copy(),word=m.vocabulary.find(v=>v.japanese==='ねこ');
  word.audioId='audio-neko';
  assert.ok(codes(validate(m,{checkFiles:false})).includes('UNKNOWN_AUDIO'));
  m.audio.assets.push({id:'audio-neko',speakerId:'ren',path:'audio/not-recorded-neko.mp3'});
  const result=validate(m);
  assert.ok(codes(result).includes('MISSING_AUDIO_FILE'));
  assert.ok(!codes(result).includes('UNKNOWN_AUDIO'));
});
test('report has human-readable summary',()=>{
  const output=format(validate());
  assert.match(output,/SUMMARY 10 levels/);
  assert.match(output,/0 errors/);
});
