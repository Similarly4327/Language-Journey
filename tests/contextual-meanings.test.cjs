const test=require('node:test');
const assert=require('node:assert/strict');
const content=require('../language-journey-content/content.js');
const {validate}=require('../language-journey-content/validate.cjs');
const {createCrashCourseProbe}=require('./app-probe.cjs');

const level=12,lesson=content.thematicCourses[level-1].lessons[2];
function renderWordBlock(app,id){
  const block=lesson.didactics.microblocks.find(item=>item.wordIds.includes(id));
  app.state.level=level-1;
  app.state.screen='module';
  // Resume the word cards already opened before the learner completed them.
  app.state.thematic={level,lessonIndex:2,part:block.sourcePart,step:'words',microblockIndex:block.index,wordBlockIndex:0,introWordIds:[...block.wordIds],flowRevision:3};
  app.renderMain();
  return app.element('thematicBody').innerHTML;
}

test('the actual Level 12 word cards show the short meanings, existing Dictionary IDs and kaban romaji with audio',()=>{
  const ranks={'l12-3':{rank:'Gold',last:1,attempts:3}};
  const reviews={'vocab-かばん::jp-nl':{dueAt:86400000,intervalDays:3,repetitions:2,lapses:0,lastGrade:'knew'}};
  const app=createCrashCourseProbe({width:375,savedRanks:ranks,savedState:{introducedVocabIds:['vocab-かばん'],flashcardProgress:{cards:reviews}}});
  const numbers=renderWordBlock(app,'vocab-ばん');
  assert.match(numbers,/nummer \/ volgnummer/);
  assert.match(numbers,/nummer \/ identificatienummer/);
  assert.match(numbers,/data-dictionary-open="vocab-ばんごう"/);
  const bag=renderWordBlock(app,'vocab-かばん');
  assert.match(bag,/data-dictionary-open="vocab-かばん"/);
  assert.match(bag,/data-audio-key="vocab-かばん"/);
  assert.match(bag,/kaban · tas/);
  assert.equal(app.rankState['l12-3'].rank,'Gold');
  assert.equal(app.state.flashcardProgress.cards['vocab-かばん::jp-nl'].repetitions,2);
});

test('Dictionary adds contextual explanations and examples while assessment keeps the canonical answer',()=>{
  const app=createCrashCourseProbe();
  const entries=['vocab-ばん','vocab-ばんごう'].map(id=>app.dictionaryById[id]);
  const first=app.dictionaryArticleHtml(entries[0]),second=app.dictionaryArticleHtml(entries[1]);
  assert.match(first,/Gebruiksvoorbeelden/);
  assert.match(first,/5番のベルトです。/);
  assert.match(first,/Ook gebruikt als[\s\S]*beurt/);
  assert.match(second,/でんわばんごう/);
  assert.match(second,/すうじ[\s\S]*numeriek teken/);
  assert.equal(app.dictionarySearch('identificatienummer').filter(entry=>entry.id==='vocab-ばんごう').length,1);
  const questions=app.wordCrashCourseDeck(entries.map(entry=>content.vocabById[entry.id]));
  for(const question of questions.filter(item=>item.direction==='jp-nl')){
    assert.ok(app.wordCrashCourseAccepts(question,'nummer'));
    assert.doesNotMatch(question.choices.join('|'),/volgnummer|identificatienummer/);
  }
  const route=app.dictionaryById['vocab-まっすぐ'];
  assert.match(app.dictionaryArticleHtml(route,{lessonId:'l9-2'}),/rechtdoor \/ in een rechte lijn/);
  assert.match(app.dictionaryArticleHtml(route,{lessonId:'music-quintuplets'}),/oprecht \/ zonder omwegen/);
});

test('future content flags overlapping glosses, missing context and romaji for review without blocking validation',()=>{
  const draft=structuredClone(content.manifest);
  const pair=['のべる','あらわす'].map((japanese,index)=>({
    id:`vocab-review-draft-${index}`,japanese,reading:japanese,romaji:index?'':'noberu',
    meaning:'uitdrukken',meanings:['uitdrukken'],coreOrContext:'context',contextSensitive:true,
    introducedAt:'21-1',availableFrom:'21-1'
  }));
  draft.vocabulary.push(...pair);
  let report=validate(draft);
  assert.ok(report.diagnostics.some(d=>d.code==='REVIEW_GLOSS_OVERLAP'&&d.severity==='INFO'&&d.message.includes(pair[0].id)&&d.message.includes(pair[1].id)));
  assert.ok(report.diagnostics.some(d=>d.code==='REVIEW_DICTIONARY_USAGE'&&d.location===pair[0].id));
  assert.ok(report.diagnostics.some(d=>d.code==='REVIEW_ROMAJI'&&d.location===pair[1].id));
  assert.equal(report.diagnostics.some(d=>d.severity==='ERROR'&&d.code.startsWith('REVIEW_')),false);
  pair[0].lessonMeaning='uitdrukken / onder woorden brengen';
  pair[0].dictionaryUsage={note:'Een gedachte of mening verwoorden.'};
  report=validate(draft);
  assert.equal(report.diagnostics.some(d=>d.location===pair[0].id&&['REVIEW_LESSON_GLOSS','REVIEW_DICTIONARY_USAGE'].includes(d.code)),false);
});
