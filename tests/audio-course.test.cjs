'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const content=require('../language-journey-content/content.js');
const foundation=require('../language-journey-content/audio-foundation.js');
const batch=require('../scripts/audio-batch.cjs');
const {audit,createProbe}=require('../scripts/audio-course-coverage.cjs');
const config=require('../audio/config.json');
function recordings(){return {pipelineVersion:config.pipelineVersion,assets:content.audioEntries.filter(r=>foundation.kanaOnly(r.pronunciation?.audioTextKana)).map(ref=>({
  entryId:ref.id,displayText:ref.displayText,readingId:ref.pronunciation.readingId,audioTextKana:ref.pronunciation.audioTextKana,
  voiceRole:'A',reviewed:true,pipelineVersion:config.pipelineVersion,path:'assets/audio/ja/sentences/test.mp3'}))};}
test('actual Japanese question banks, examples, completed blanks and stories all have readings',()=>{
  const report=audit();assert.ok(report.japaneseTexts>550);assert.deepEqual(report.missing,[]);
  assert.equal(content.manifest.vocabulary.length,343);
  assert.ok(content.audioEntries.filter(r=>r.kind==='sentence').every(r=>foundation.kanaOnly(r.pronunciation.audioTextKana)));
});
test('every story and bonus including Levels 11 and 12 retains its ID and has kana-only audio',()=>{
  const passages=[...content.manifest.readings,...content.manifest.bonus];assert.equal(passages.length,69);
  for(const p of passages){const ref=content.audioEntryById[p.id];assert.equal(ref.entry,p);assert.equal(ref.displayText,p.text);assert.ok(foundation.kanaOnly(ref.pronunciation.audioTextKana),p.id);}
  const ref=content.audioEntryById['reading-l12-3-a'];assert.match(ref.pronunciation.audioTextKana,/にもつ わ ごばん/);
  assert.match(content.audioEntryById['reading-l12-2-b'].pronunciation.audioTextKana,/した/);
  assert.match(content.audioEntryById['reading-l12-4-b'].pronunciation.audioTextKana,/エー/);
  assert.match(content.audioEntryById['reading-l11-home-1-a'].pronunciation.audioTextKana,/レベル じゅういち/);
});
test('new readings preserve lexical ha/he, particle sounds and fail closed for unknown text',()=>{
  assert.equal(content.resolveAudioEntry(null,'は'),null);
  assert.equal(content.resolveAudioEntry(null,'これは わたし の はは です').pronunciation.audioTextKana,'これわ わたし の はは です');
  assert.equal(content.resolveAudioEntry(null,'へや は 305ごう です。').pronunciation.audioTextKana,'へや わ さんびゃくごごう です。');
  assert.equal(content.resolveAudioEntry(null,'未知の文章です'),null);
  assert.equal(content.resolveAudioEntry(null,'これは あたらしい せんせい です'),null);
});
test('all taught number values use original symbols and correct exceptional readings',()=>{
  const values=new Set(content.manifest.numbers.lessons.flatMap(l=>l.values));assert.equal(values.size,119);
  assert.equal(content.audioEntries.filter(r=>r.kind==='number').length,values.size);
  for(const [n,kana] of [[0,'ゼロ'],[10,'じゅう'],[300,'さんびゃく'],[600,'ろっぴゃく'],[800,'はっぴゃく'],[3000,'さんぜん'],[8000,'はっせん'],[10000,'いちまん']])assert.equal(content.audioEntryById[`number-${n}`].pronunciation.audioTextKana,kana);
  assert.equal(batch.selectJobs({level:'1'}).filter(j=>j.ref.kind==='number').length,119);
});
test('writing signs get labeled example audio while retaining context-only metadata',()=>{
  const probe=createProbe(recordings());probe.state.audioEnabled=true;
  for(const [id,text,example] of [['kana-small-っ','っ','きって'],['kana-small-ッ','ッ','ベッド'],['writing-long-vowel-mark','ー','コーヒー']]){
    assert.equal(content.audioEntryById[id].pronunciation.status,'context-only');
    const html=probe.speakerButtonHtml(text,id);assert.match(html,new RegExp('Hoor in '+example));assert.ok(html.includes('data-audio-key="vocab-'+example+'"'));
  }
});
test('blank answers play the completed Japanese sentence only after answering',()=>{
  const probe=createProbe(recordings());probe.state.audioEnabled=true;
  const q={kind:'fill',prompt:'これ ___ ねこ です',correct:'は',choices:['は','を','に'],instruction:'Vul in'};
  assert.equal(content.resolveAudioEntry(null,q.prompt),null);
  const html=probe.quizAnswerAudioHtml(q,'は');assert.match(html,/data-audio-text="これ は ねこ です"/);
  assert.equal(probe.quizAudioKey(q,'は','answer'),'grammar-ha');
  assert.equal(probe.speakerButtonHtml('Welke zin past?'),'');
});
test('Japanese answer options reuse exact central word and sentence audio entries',()=>{
  const probe=createProbe(recordings());probe.state.audioEnabled=true;
  const word=probe.answerOptionAudioHtml('ねこ','vocab-みず');
  assert.match(word,/data-audio-key="vocab-ねこ"/,'a mismatched preferred ID cannot make a distractor play another word');
  assert.match(probe.answerOptionAudioHtml('これは ねこ です'),/data-audio-key="sentence-l4-1-model-1"/,'a complete known phrase uses its existing sentence ID');
  assert.equal(probe.answerOptionAudioHtml('未知の文章です'),'','unknown Japanese text has no speaker');
  assert.equal(probe.answerOptionAudioHtml('water'),'','native-language options have no Japanese speaker');
  const themed=probe.thematicChoiceHtml({prompt:'Welke zin?',answer:'これは ねこ です',choices:['これは ねこ です','未知の文章です']},'test');
  assert.match(themed,/data-audio-key="sentence-l4-1-model-1"/);
  assert.doesNotMatch(themed,/data-audio-key="vocab-ねこ"/,'phrase options do not stitch word clips');
});
test('reading context remains audible even with a Dutch question and promptAudio disabled',()=>{
  const probe=createProbe(recordings());probe.state.audioEnabled=true;
  const p=content.manifest.readings.find(r=>r.id==='reading-l6-5');
  probe.state.quiz={source:'advanced',title:'Read',official:false,pool:[],index:0,score:0,choices:3,
    questions:[{kind:'reading',prompt:p.question,correct:p.answer,choices:p.choices,context:p.text,promptAudio:false}]};
  probe.renderQuestion();assert.match(probe.element('qPromptAudio').innerHTML,/data-audio-key="reading-l6-5"/);
  assert.equal(probe.element('qCorrectAudio').innerHTML,'');
});
test('thematic Japanese instructions and examples resolve without speaking Dutch questions',()=>{
  const probe=createProbe(recordings());probe.state.audioEnabled=true;
  probe.state.introducedVocabIds=content.manifest.vocabulary.map(w=>w.id);
  const html=probe.thematicInstructionHtml('listen-audio');assert.match(html,/data-audio-text="おんせい を きいてください。"/);
  probe.state.thematic.answered=false;
  assert.ok(!probe.thematicChoiceHtml({prompt:'Wat doe je?',answer:'antwoord',choices:['antwoord','oplossing']},'test').includes('data-audio-key'));
});
