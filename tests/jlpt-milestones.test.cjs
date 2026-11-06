const test=require('node:test'),assert=require('node:assert/strict');
const milestones=require('../language-journey-content/jlpt-milestones.js');
const content=require('../language-journey-content/content.js');
const {createCrashCourseProbe}=require('./app-probe.cjs');
const plain=value=>JSON.parse(JSON.stringify(value));
const now=Date.parse('2026-11-05T12:00:00Z'),id='vocab-ねこ';
const review=(attemptId,extra={})=>({attemptId,sourceId:'recall:test',at:now,kind:'word-review',submitted:true,valid:true,correct:true,assisted:false,targetWordIds:[id],knownWordIds:[id],...extra});
function record(store,attemptId,extra={}){return milestones.record(store,review(attemptId,extra),content)}
function kanjiReview(attemptId,extra={}){return review(attemptId,{kind:'contextual-kanji-review',targetWordIds:['vocab-でんしゃ'],knownWordIds:['vocab-でんしゃ'],introducedKanjiWordIds:['vocab-でんしゃ'],recognition:true,readingRevealed:false,audioAssisted:false,kanjiTargets:[{character:'電',wordId:'vocab-でんしゃ',form:'電車',reading:'でんしゃ',context:'電車 で いきます。'}],...extra})}

test('LJ-JLPT-v2 uses five distinct successful reviews and exact 70/30 percentages without intermediate rounding',()=>{
  assert.equal(milestones.contract.version,'LJ-JLPT-v2');assert.equal(milestones.contract.requiredConsecutiveCorrect,5);
  assert.deepEqual(milestones.contract.anchors,{N5:{vocabulary:1000,kanji:100},N4:{vocabulary:2000,kanji:300},N3:{vocabulary:4000,kanji:650},N2:{vocabulary:7000,kanji:1000},N1:{vocabulary:11000,kanji:2000}});
  const store=milestones.empty();
  for(let n=0;n<1000;n++)store.lexemes[`vocab-fixture-${n}`]={everMastered:true,creditUnits:5};
  assert.equal(milestones.select(store).tiers[0].masteryPercent,70);
  for(let n=0;n<100;n++)store.kanji[String.fromCodePoint(0x4e00+n)]={everMastered:true,creditUnits:5};
  const selected=milestones.select(store);
  assert.equal(selected.words,1000);assert.equal(selected.kanji,100);assert.equal(selected.tiers[0].masteryPercent,100);
  assert.equal(selected.tiers[1].masteryPercent,100*(.7*.5+.3*(100/300)));
  assert.equal(milestones.percentage(100000,0,milestones.contract.anchors.N5),70);
  assert.equal(milestones.percentage(0,100000,milestones.contract.anchors.N5),30);
  assert.equal(milestones.percentage(100000,100000,milestones.contract.anchors.N1),100);
  assert.equal(milestones.percentage(1,1,milestones.contract.anchors.N5),.37);
  assert.equal(milestones.select(milestones.empty()).tiers.every(tier=>tier.masteryPercent===0),true);
});

test('wrong answer resets the active streak but preserves already earned fractional credit',()=>{
  const store=milestones.empty();record(store,'a');record(store,'b',{sourceId:'recall:reverse'});
  assert.equal(store.lexemes[id].streak,2);assert.equal(milestones.select(store).words,0.4);
  record(store,'c',{correct:false});assert.equal(store.lexemes[id].streak,0);assert.equal(store.lexemes[id].creditUnits,2);assert.equal(milestones.select(store).words,0.4);
  for(const key of ['d','e','f','g','h'])record(store,key);
  assert.equal(milestones.select(store).words,1);assert.equal(store.lexemes[id].masteredAt,now);
  record(store,'i',{correct:false,at:now+1000});
  assert.equal(store.lexemes[id].streak,0);assert.equal(store.lexemes[id].everMastered,true);assert.equal(store.lexemes[id].masteredAt,now);
  assert.equal(milestones.select(store).words,1);assert.equal(milestones.select(store).kanji,0);
});

test('persisted attempt identities reject duplicate and out-of-order replays, including changed answers',()=>{
  let store=milestones.empty();record(store,'a');record(store,'b');store=milestones.normalize(plain(store));
  assert.equal(record(store,'a'),false);assert.equal(record(store,'b',{correct:false}),false);
  assert.equal(store.lexemes[id].streak,2);record(store,'c');assert.equal(milestones.select(store).words,0.6);record(store,'d');record(store,'e');assert.equal(milestones.select(store).words,1);
  const before=plain(store);milestones.select(store);assert.deepEqual(plain(store),before,'selectors never mutate persistence');
});

test('unsubmitted, assisted, invalid, unknown, context-only and kana events cannot earn milestones',()=>{
  const store=milestones.empty();
  for(const [n,extra] of [{submitted:false},{valid:false},{assisted:true},{knownWordIds:[]},{targetWordIds:[]},{targetWordIds:['kana-hiragana-は']},{kind:'example'}].entries())assert.equal(record(store,'invalid'+n,extra),false);
  assert.deepEqual(store.lexemes,{});assert.deepEqual(store.kanji,{});assert.deepEqual(store.attempts,{});
});

test('kanji is separate contextual recognition evidence, unique per character with supporting word reading',()=>{
  const store=milestones.empty();
  for(const key of ['a','b','c','d','e'])assert.equal(milestones.record(store,kanjiReview(key),content),true);
  assert.equal(milestones.select(store).kanji,1);assert.equal(milestones.select(store).words,0);
  assert.deepEqual(store.attempts.c.kanjiTargets,[{character:'電',wordId:'vocab-でんしゃ',reading:'でんしゃ',form:'電車'}]);
  milestones.record(store,kanjiReview('wrong',{correct:false}),content);
  assert.equal(store.kanji['電'].streak,0);assert.equal(store.kanji['電'].everMastered,true);
  const target=kanjiReview('two').kanjiTargets[0];
  milestones.record(store,kanjiReview('two',{kanjiTargets:[target,target,{...target,character:'車'}]}),content);
  assert.equal(store.kanji['電'].streak,1);assert.equal(store.kanji['車'].streak,1);assert.equal(milestones.select(store).kanji,1.2);
});

test('kanji recognition rejects exposure alone, audio/kana help, absent context and untested characters',()=>{
  for(const extra of [{recognition:false},{readingRevealed:true},{audioAssisted:true},{introducedKanjiWordIds:[]},{kind:'word-review',targetWordIds:[]},{kanjiTargets:[{character:'私',wordId:'vocab-でんしゃ',form:'電車',reading:'でんしゃ',context:'電車'}]},{kanjiTargets:[{character:'電',wordId:'vocab-でんしゃ',form:'電車',reading:'でんしゃ',context:'でんしゃ で いきます。'}]}]){
    const store=milestones.empty();assert.equal(milestones.record(store,kanjiReview('a',extra),content),false);assert.equal(milestones.select(store).kanji,0);
  }
});

test('old evidence and SRS grades never manufacture milestones; unknown future milestone schema is preserved',()=>{
  const legacy={guidelineEvidence:{version:1,words:{[id]:{practiced:{at:now,sourceId:'old'}}}},flashcardProgress:{cards:{[`${id}::jp-nl`]:{repetitions:99,lastGrade:'knew'}}}};
  const before=plain(legacy),store=milestones.normalize();
  assert.equal(milestones.select(store).words,0);assert.equal(milestones.select(store).kanji,0);assert.deepEqual(legacy,before);
  assert.deepEqual(milestones.normalize(store),store);
  const future={version:10,scale:'future',lexemes:{[id]:{everMastered:true}},untouched:'yes'};
  assert.deepEqual(milestones.normalize(future),future);assert.equal(milestones.select(future).available,false);assert.equal(record(future,'a'),false);
});

test('v1 migration preserves earned full milestones and incomplete earned partial credit without inferring new proof',()=>{
  const legacy={version:1,scale:'LJ-JLPT-v1',lexemes:{[id]:{streak:2,everMastered:false,masteredAt:null,lastEventId:'old-2'},'vocab-old-full':{streak:0,everMastered:true,masteredAt:now,lastEventId:'old-3'}},kanji:{'電':{streak:1,everMastered:false}},attempts:{'old-event':{correct:true}}};
  const migrated=milestones.normalize(legacy);
  assert.equal(migrated.version,2);assert.equal(migrated.lexemes[id].creditUnits,2);assert.equal(migrated.lexemes[id].everMastered,false);
  assert.equal(migrated.lexemes['vocab-old-full'].creditUnits,5);assert.equal(migrated.lexemes['vocab-old-full'].everMastered,true);
  assert.equal(migrated.kanji['電'].creditUnits,1);assert.ok(migrated.attempts['old-event']);
  assert.equal(milestones.select(migrated).words,1.4);assert.equal(milestones.select(migrated).kanji,0.2);
});

function app(savedState={}){return createCrashCourseProbe({now,savedState:{thematicRevision:1,...savedState},savedRanks:{'l4-1':{rank:'Copper',attempts:1,last:1}}})}
function submitted(p,correct=true,direction='jp-nl'){
  p.createFlashcardSession([{cardId:id,direction}],'scheduled');
  const s=p.state.flashcardSession;s.optionsRevealed=true;s.revealed=true;
  s.queue[0].answerChoices=direction==='jp-nl'?['kat','hond']:['ねこ','いぬ'];
  p.flashcardRate(correct?'knew':'again',direction==='jp-nl'?(correct?'kat':'hond'):(correct?'ねこ':'いぬ'));
}

test('actual scheduled Recall submissions persist canonical streaks, failure resets and legacy scheduling stays independent',()=>{
  let p=app();submitted(p);submitted(p,true,'nl-jp');
  assert.equal(p.state.jlptMilestones.lexemes[id].streak,2);submitted(p,false);
  assert.equal(p.state.jlptMilestones.lexemes[id].streak,0);
  assert.equal(p.state.flashcardProgress.cards[`${id}::jp-nl`].repetitions,0);
  assert.equal(p.state.flashcardProgress.cards[`${id}::nl-jp`].repetitions,1);
  for(let n=0;n<5;n++)submitted(p);
  assert.equal(milestones.select(p.state.jlptMilestones).words,1);assert.equal(milestones.select(p.state.jlptMilestones).kanji,0);
  const saved=p.saved();p=createCrashCourseProbe({now:now+86400000,savedState:saved.state,savedRanks:saved.ranks});
  assert.deepEqual(plain(p.state.jlptMilestones),saved.state.jlptMilestones);assert.deepEqual(plain(p.state.flashcardProgress),saved.state.flashcardProgress);
  submitted(p,false);assert.equal(milestones.select(p.state.jlptMilestones).words,1);
});

test('Recall render/reload preserves attempt IDs; grading a restored submitted attempt cannot increment twice',()=>{
  let p=app();p.createFlashcardSession([{cardId:id,direction:'jp-nl'}],'scheduled');
  const attempt=p.state.flashcardSession.queue[0].jlptAttemptId;p.renderFlashcardsScreen();assert.equal(p.state.flashcardSession.queue[0].jlptAttemptId,attempt);
  const saved=p.saved();p=createCrashCourseProbe({now,savedState:saved.state,savedRanks:saved.ranks});
  assert.equal(p.state.flashcardSession.queue[0].jlptAttemptId,attempt);
  p.resumeFlashcardSession();
  const s=p.state.flashcardSession;s.optionsRevealed=true;s.revealed=true;s.queue[0].answerChoices=['kat','hond'];p.flashcardRate('knew','kat');
  const after=p.saved();after.state.flashcardSession.feedback=null;after.state.flashcardSession.revealed=true;
  p=createCrashCourseProbe({now,savedState:after.state,savedRanks:after.ranks});p.resumeFlashcardSession();p.flashcardRate('knew','kat');
  assert.equal(p.state.jlptMilestones.lexemes[id].streak,1);assert.equal(Object.keys(p.state.jlptMilestones.attempts).length,1);
});

test('migration preserves old evidence, profile, errors, selections and SRS without creating mastery or changing legacy UI counts',()=>{
  const cards={[`${id}::jp-nl`]:{repetitions:5,lastGrade:'knew',lastReviewedAt:now-1000,dueAt:now+1000,intervalDays:14,lapses:2}};
  const p=app({introducedVocabIds:[id],userName:'Test',avatarName:'Ren',errorBank:{lang:[{prompt:'old'}]},flashcardProgress:{version:1,cards},flashcardSelection:{auto:false,lessonIds:['l4-1'],direction:'nl-jp'},guidelineEvidence:{version:1,words:{[id]:{applied:{at:now-1000,sourceId:'old-context'}}},domains:{grammar:{},reading:{},listening:{}}}});
  const ranks=rows=>Object.fromEntries(Object.entries(rows).map(([key,value])=>[key,{rank:value.rank,attempts:value.attempts,last:value.last}]));
  const before=plain({profile:p.state.userName,avatar:p.state.avatarName,errors:p.state.errorBank,ranks:ranks(p.rankState),selection:p.state.flashcardSelection,srs:p.state.flashcardProgress,old:p.state.guidelineEvidence});
  assert.equal(milestones.select(p.state.jlptMilestones).words,0);assert.equal(p.internalJlptProgressSummary().totals.practiced.raw>=1,true);
  const saved=p.saved(),reload=createCrashCourseProbe({now,savedState:saved.state,savedRanks:saved.ranks});
  assert.deepEqual(plain({profile:reload.state.userName,avatar:reload.state.avatarName,errors:reload.state.errorBank,ranks:ranks(reload.rankState),selection:reload.state.flashcardSelection,srs:reload.state.flashcardProgress,old:reload.state.guidelineEvidence}),before);
  assert.equal(milestones.select(reload.state.jlptMilestones).words,0);
});

test('bare SRS grades and free practice never become submitted milestone events',()=>{
  const p=app();p.createFlashcardSession([{cardId:id,direction:'jp-nl'}],'scheduled');p.state.flashcardSession.revealed=true;p.flashcardRate('knew');
  assert.equal(p.state.flashcardProgress.cards[`${id}::jp-nl`].repetitions,1);assert.deepEqual(plain(p.state.jlptMilestones.lexemes),{});
  p.createFlashcardSession([{cardId:id,direction:'jp-nl'}],'free');p.state.flashcardSession.revealed=true;p.state.flashcardSession.optionsRevealed=true;p.flashcardRate('knew','kat');
  assert.deepEqual(plain(p.state.jlptMilestones.lexemes),{});
});
