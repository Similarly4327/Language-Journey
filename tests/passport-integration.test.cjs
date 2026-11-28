const test=require('node:test');
const assert=require('node:assert/strict');
const csv=require('../passport-csv.js');
const {createCrashCourseProbe}=require('./app-probe.cjs');

const personal={lemma:'怖い',reading:'こわい',meaning:'eng',contexts:[{example_sentence:'この本は怖いです。',example_translation:'Dit boek is eng.'}]};
const future={lemma:'かばん',reading:'かばん',meaning:'tas'};
const plan=(app,items)=>app.passportImportPlan(csv.exportCSV({items}));
const apply=(app,rows)=>app.applyPassportImport(rows,app.state.passportKnowledge);

test('confirmed Passport imports use course identity or a stable personal card without awarding progress',()=>{
  const sharedStorage=new Map();
  const app=createCrashCourseProbe({sharedStorage,savedRanks:{'l4-1':{rank:'Gold',attempts:3}}});
  const original=app.persisted();
  const preview=plan(app,[personal,future]);
  assert.equal(preview.valid,true);
  assert.ok(preview.rows.some(row=>row.officialId==='vocab-かばん'));
  assert.equal(app.persisted().state.passportKnowledge,undefined);
  assert.equal(apply(app,preview.rows),true);
  assert.equal(app.rankState['l4-1'].rank,'Gold');
  assert.equal(app.rankState['l12-3'].rank,null);
  assert.equal(app.state.thematicCompleted['l12-3'],undefined);
  assert.equal(app.state.jlptMilestones.lexemes['vocab-かばん'],undefined);
  assert.ok(app.recallCards('jp-nl').some(card=>card.id==='vocab-かばん'));
  const imported=app.recallCards('jp-nl').find(card=>card.kana==='こわい');
  assert.equal(imported.id,'passport-1');assert.equal(imported.audioKey,null);
  assert.match(app.dictionaryArticleHtml(app.dictionaryById[imported.id]),/この本は怖いです/);
  const same=plan(app,[personal,future]);
  assert.equal(apply(app,same.rows),true);
  assert.equal(app.state.passportKnowledge.entries.length,2);
  assert.equal(app.state.passportKnowledge.entries[0].contexts.length,1);
  app.state.flashcardProgress.cards['passport-1::jp-nl']={repetitions:2,intervalDays:3,lapses:0,dueAt:400,lastReviewedAt:100,lastGrade:'knew'};
  assert.equal(app.saveProgress(),true);
  const reloaded=createCrashCourseProbe({sharedStorage});
  assert.equal(reloaded.state.flashcardProgress.cards['passport-1::jp-nl'].repetitions,2);
  assert.equal(reloaded.state.passportKnowledge.entries[0].id,imported.id);
  assert.ok(reloaded.passportItems().some(item=>item.id===imported.id));
  assert.equal(reloaded.rankState['l4-1'].rank,original.ranks['l4-1'].rank);
});

test('additional senses have separate cards, one word in the export, and a round-trip-safe preview',()=>{
  const app=createCrashCourseProbe();
  assert.equal(apply(app,plan(app,[personal]).rows),true);
  const extra={...personal,record_type:'SENSE',lexeme_id:'passport-1',meaning:'beangstigend',contexts:[]};
  const preview=plan(app,[extra]);
  assert.equal(preview.rows[0].status,'new-sense');
  assert.equal(apply(app,preview.rows),true);
  const items=app.passportItems();
  assert.equal(app.passportWordCount(items),1);
  assert.equal(items.filter(item=>['SENSE','VOCABULARY'].includes(item.record_type)).length,2);
  assert.equal(app.passportImportPlan(csv.exportCSV({items})).valid,true);
  const fresh=createCrashCourseProbe(),roundTrip=plan(fresh,items);
  assert.equal(roundTrip.valid,true);
  assert.equal(apply(fresh,roundTrip.rows),true);
  assert.equal(fresh.passportWordCount(fresh.passportItems()),1);
  assert.match(app.dictionaryArticleHtml(app.dictionaryById['passport-1']),/beangstigend/);
  assert.equal(app.passportBackup.preview(app.passportBackup.export()).knownWordCount,1);
});

test('supplementary context on a seen word preserves its existing Recall eligibility',()=>{
  const app=createCrashCourseProbe({savedState:{vocabFirstSeen:{'vocab-かばん':'2026-11-27'}}});
  const seen=app.dictionaryById['vocab-かばん'];
  assert.equal(app.knowledgeWordIsKnown(seen),true);
  assert.ok(!app.recallCards('jp-nl').some(card=>card.id===seen.id));
  assert.equal(apply(app,plan(app,[{...future,explanation:'Een tas die je draagt.'}]).rows),true);
  assert.equal(app.state.passportKnowledge.entries[0].contextOnly,true);
  assert.ok(!app.recallCards('jp-nl').some(card=>card.id===seen.id));
  assert.match(app.dictionaryArticleHtml(seen),/Een tas die je draagt/);
});
