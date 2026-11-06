const test=require('node:test'),assert=require('node:assert/strict');
const content=require('../language-journey-content/content.js'),external=require('../language-journey-content/jlpt-benchmark.js'),internal=require('../language-journey-content/internal-guideline.js');
const {createCrashCourseProbe,fakeElement}=require('./app-probe.cjs');
const plain=value=>JSON.parse(JSON.stringify(value)),now=Date.parse('2026-11-01T12:00:00Z');
const evidence=(ids=[],history=internal.empty(),cards={},exposed=[])=>({history,isIntroduced:id=>ids.includes(id),isKanjiIntroduced:id=>exposed.includes(id),srsRecord:(id,direction)=>cards[`${id}::${direction}`]});
function record(history,ids,extra={}){return internal.record(history,{correct:true,at:now,sourceId:'ordinary-task',targetWordIds:ids,knownWordIds:ids,...extra},content)}
test('internal anchors are cumulative estimates, distinct from external lists and domain scores',()=>{
  assert.deepEqual(internal.contract.anchors,{N5:{vocabulary:800,kanji:100},N4:{vocabulary:1500,kanji:300},N3:{vocabulary:3500,kanji:650}});
  assert.equal(internal.contract.domainWeights,null);assert.match(internal.contract.familyCapProvenance,/appkeuze/);
  const before=plain(external),result=internal.select(content,external,evidence(),internal.contract,now);
  assert.equal(result.tiers.length,3);assert.ok(result.tiers.every(tier=>tier.masteryPercent===null));assert.deepEqual(plain(external),before);
});
test('opening, seen words, wrong answers, assisted responses and distractors do not become correct evidence',()=>{
  const id='vocab-ねこ',history=internal.empty();
  assert.equal(record(history,[id],{correct:false}),false);assert.equal(record(history,[id],{assisted:true}),false);assert.equal(record(history,[id],{knownWordIds:[]}),false);
  let result=internal.select(content,external,evidence([id],history),internal.contract,now);assert.equal(result.totals.seen.raw,1);assert.equal(result.totals.practiced.raw,0);
  assert.equal(record(history,[id],{choiceWordIds:['vocab-いぬ'],contextWordIds:['vocab-みず']}),true);
  assert.deepEqual(Object.keys(history.words),[id]);assert.equal(history.words[id].applied,undefined);
  record(history,[id],{contextual:true});result=internal.select(content,external,evidence([id],history),internal.contract,now);assert.equal(result.totals.applied.raw,1);
});
test('canonical words count once and a distinct sense counts only after its own introduction',()=>{
  const ids=['vocab-にほん','vocab-country-japan'],history=internal.empty();record(history,ids);
  const before=internal.select(content,external,evidence([ids[0]],history),internal.contract,now);assert.equal(before.totals.practiced.raw,1);
  record(history,ids);const after=internal.select(content,external,evidence(ids,history),internal.contract,now);assert.equal(after.totals.practiced.raw,2);
});
test('calendar family caps preserve raw counts and do not invent a percentage',()=>{
  const ids=internal.contract.familyCaps.filter(f=>f.id!=='calendar-dates').flatMap(f=>f.ids),history=internal.empty();record(history,ids);
  const mappings={items:ids.map((id,index)=>({id:String(index),category:'vocabulary',knowledgeItemId:id,jlptLevel:'N5',mappingScope:'exact',classification:'margin'}))};
  const result=internal.select(content,mappings,evidence(ids,history),internal.contract,now);
  assert.equal(result.tiers[0].vocabulary.practiced.raw,19);assert.equal(result.tiers[0].vocabulary.practiced.weighted,6);assert.equal(result.tiers[0].masteryPercent,null);
});
test('an early N3 target belongs to N3 without requiring lower-tier mastery',()=>{
  const id='vocab-ねこ',history=internal.empty();record(history,[id]);const b={items:[{category:'vocabulary',knowledgeItemId:id,jlptLevel:'N3',mappingScope:'exact',classification:'margin'}]};
  const result=internal.select(content,b,evidence([id],history),internal.contract,now);assert.equal(result.tiers[0].vocabulary.practiced.raw,0);assert.equal(result.tiers[1].vocabulary.practiced.raw,0);assert.equal(result.tiers[2].vocabulary.practiced.raw,1);
});
test('attainment is retained as Recall becomes due, and both SRS directions stay independent',()=>{
  const id='vocab-ねこ',history=internal.empty(),cards={[`${id}::jp-nl`]:{lastGrade:'knew',lastReviewedAt:now-1000,repetitions:3,dueAt:now+1000}},before=plain(cards);
  const first=internal.select(content,external,evidence([id],history,cards),internal.contract,now),later=internal.select(content,external,evidence([id],history,cards),internal.contract,now+2000);
  assert.equal(first.totals.practiced.raw,1);assert.equal(later.totals.practiced.raw,1);assert.equal(first.needsReview,0);assert.equal(later.needsReview,1);assert.deepEqual(cards,before);
  record(history,[id],{contextual:true});cards[`${id}::jp-nl`]={lastGrade:'again',repetitions:0,lastReviewedAt:now,dueAt:now+1000};
  assert.equal(internal.select(content,external,evidence([id],history,cards),internal.contract,now+86400000).totals.applied.raw,1);
});
test('kanji needs successful word evidence and explicit known spelling, and counts characters once',()=>{
  const id='vocab-でんしゃ',history=internal.empty();record(history,[id]);
  assert.equal(internal.select(content,external,evidence([id],history,{},[id]),internal.contract,now).items.find(row=>row.id===id).kanji,false);
  record(history,[id],{kanjiWordIds:[id]});
  assert.equal(internal.select(content,external,evidence([id],history),internal.contract,now).items.find(row=>row.id===id).kanji,false);
  const result=internal.select(content,external,evidence([id],history,{},[id]),internal.contract,now);assert.equal(result.items.find(row=>row.id===id).kanji,true);
  assert.ok(result.tiers[0].kanjiWordReadings.some(row=>row.wordId===id&&row.reading==='でんしゃ'));assert.equal(result.tiers[0].kanji,2);
  assert.equal(internal.select(content,external,evidence([],history,{},[id]),internal.contract,now).tiers[0].kanji,0);
});
test('grammar and reading use explicit canonical task targets, while visible-text audio cannot prove listening',()=>{
  const history=internal.empty(),reading=content.manifest.readings[0].id;
  record(history,[],{domainTargets:{grammar:['grammar-ha','made-up'],reading:[reading,'unknown'],listening:[reading]}});
  let result=internal.select(content,external,evidence([],history),internal.contract,now);assert.equal(result.domains.grammar,1);assert.equal(result.domains.reading,1);assert.equal(result.domains.listening,0);
  record(history,[],{audioOnly:true,domainTargets:{listening:[reading]}});result=internal.select(content,external,evidence([],history),internal.contract,now);assert.equal(result.domains.listening,1);
});
function helpApp(){return createCrashCourseProbe({now,savedState:{thematicRevision:1,introducedVocabIds:['vocab-えき','vocab-でんしゃ','vocab-みず'],kanjiExposureIds:['vocab-えき','vocab-でんしゃ','vocab-みず']},savedRanks:{'l4-9':{rank:'Copper',attempts:1,last:1},'l10-4':{rank:'Copper',attempts:1,last:1}}})}
test('quiz targets and every option lose kana/dictionary helpers, while non-target known context keeps kana',()=>{
  const app=helpApp(),q={type:'lesson',kind:'mc',lessonId:'l13-1',sourceId:'explicit-station',targetWordId:'vocab-えき',prompt:'えき',correct:'station',choices:['station','water'],context:'でんしゃ で えき に いきます。'};
  app.startQuiz({source:'advanced',questions:[q],pool:[],title:'Gewone lesvraag',official:false});
  assert.equal(app.questionHelpBlocked('vocab-えき'),true);assert.equal(app.questionHelpBlocked('vocab-みず'),true);assert.equal(app.questionHelpBlocked('vocab-でんしゃ'),false);
  assert.equal(app.kanjiTextHtml('えき','13-1-B'),'駅');assert.match(app.kanjiTextHtml('でんしゃ','13-1-B'),/電車<\/summary><span>でんしゃ<\/span>/);assert.equal(app.kanjiOptionHelpHtml('でんしゃ','13-1-B'),'');
  const before=plain(app.saved());assert.equal(app.openDictionaryModal('vocab-えき'),false);assert.deepEqual(plain(app.saved()),before);
  app.state.quiz.optionsRevealed=true;app.answer(false,fakeElement(),'water');assert.match(app.kanjiTextHtml('えき','13-1-B'),/reading-support/);
});
test('ordinary correct target answers persist evidence without crediting examples or requiring a diagnostic',()=>{
  const app=helpApp(),q={type:'lesson',kind:'mc',lessonId:'l13-1',sourceId:'station-application',targetWordId:'vocab-えき',prompt:'えき',correct:'station',choices:['station','water'],context:'でんしゃ で えき に いきます。'};
  app.startQuiz({source:'advanced',questions:[q],pool:[],title:'Gewone contextvraag',official:false});assert.deepEqual(plain(app.state.guidelineEvidence.words),{});
  app.state.quiz.optionsRevealed=true;app.answer(true,fakeElement(),'station');
  assert.ok(app.state.guidelineEvidence.words['vocab-えき'].applied);assert.ok(app.state.guidelineEvidence.words['vocab-えき'].kanji);assert.equal(app.state.guidelineEvidence.words['vocab-でんしゃ'],undefined);assert.equal(app.state.guidelineEvidence.words['vocab-みず'],undefined);
  const saved=app.saved(),reload=createCrashCourseProbe({now,savedState:saved.state,savedRanks:saved.ranks});assert.deepEqual(plain(reload.state.guidelineEvidence),plain(app.state.guidelineEvidence));
  const before=plain(reload.saved());reload.internalJlptProgressSummary();const html=reload.jlptProgressHtml();assert.match(html,/indicatieve richtlijn/);assert.match(html,/N5/);assert.match(html,/vijf afzonderlijke geslaagde Recall-herhalingen/);assert.doesNotMatch(html,/800 woorden|maximaal 3|45.vragen|diagnose/i);assert.deepEqual(plain(reload.saved()),before);
});
test('Recall suppresses help for target and distractors before reveal and until grading; feedback restores it',()=>{
  for(const direction of ['jp-nl','nl-jp']){
    const app=helpApp(),id='vocab-でんしゃ';app.state.recallKanjiEnabled=true;app.state.screen='flashcards';app.createFlashcardSession([{cardId:id,direction}], 'scheduled');
    for(const revealed of [false,true]){app.state.flashcardSession.optionsRevealed=revealed;app.renderFlashcardsScreen();assert.equal(app.questionHelpBlocked(id),true);assert.doesNotMatch(app.element('flashcardView').innerHTML,/reading-support|data-dictionary-open/)}
    app.state.flashcardSession.revealed=true;app.flashcardRate('knew',direction==='jp-nl'?'trein':'でんしゃ');assert.match(app.element('flashcardView').innerHTML,/reading-support/);assert.ok(app.state.guidelineEvidence.words[id].practiced);
    assert.equal(Object.keys(app.state.flashcardProgress.cards).length,1);assert.ok(app.state.flashcardProgress.cards[`${id}::${direction}`]);
  }
});
test('stale or keyboard-activated disclosures are denied centrally during an active question',()=>{
  const app=helpApp();app.startQuiz({source:'advanced',questions:[{type:'lesson',kind:'mc',wordId:'vocab-えき',prompt:'えき',correct:'station',choices:['station','water']}],title:'Vraag',pool:[]});
  let prevented=false,stopped=false;const before=plain(app.saved());
  app.fireDocumentEvent('click',{target:{closest:selector=>selector==='[data-reading-word]'?{dataset:{readingWord:'vocab-えき'}}:null},preventDefault(){prevented=true},stopPropagation(){stopped=true}});
  assert.equal(prevented,true);assert.equal(stopped,true);assert.deepEqual(plain(app.saved()),before);
  app.document.body.dataset.view='session';app.state.quiz=null;assert.match(app.kanjiTextHtml('えき','13-1-A'),/data-reading-word/);
});
test('existing successful Recall evidence is retained before a later wrong answer without rewriting SRS',()=>{
  const id='vocab-でんしゃ',cards={[`${id}::jp-nl`]:{repetitions:3,lastGrade:'knew',lastReviewedAt:now-1000,dueAt:now-100,intervalDays:7,lapses:0}};
  const app=createCrashCourseProbe({now,savedState:{thematicRevision:1,introducedVocabIds:[id],flashcardProgress:{cards}},savedRanks:{'l10-4':{rank:'Copper',attempts:1,last:1}}});
  assert.deepEqual(plain(app.state.flashcardProgress.cards),cards);assert.ok(app.state.guidelineEvidence.words[id].practiced);assert.equal(app.state.guidelineEvidence.words[id].applied,undefined);assert.equal(app.state.guidelineEvidence.words[id].kanji,undefined);
  app.state.screen='flashcards';app.createFlashcardSession([{cardId:id,direction:'jp-nl'}],'scheduled');app.state.flashcardSession.revealed=true;app.flashcardRate('again','station');
  assert.equal(app.state.flashcardProgress.cards[`${id}::jp-nl`].repetitions,0);assert.equal(app.internalJlptProgressSummary().totals.practiced.raw,1);
});
test('audio controls keep playback but do not spell out protected target kana in labels or coach text',()=>{
  const app=helpApp();app.startQuiz({source:'advanced',questions:[{type:'lesson',kind:'mc',wordId:'vocab-えき',prompt:'えき',correct:'station',choices:['station','water']}],title:'Vraag',pool:[]});
  assert.equal(app.questionTextHelpBlocked('でんしゃ で えき に いきます。'),true);
  const button=app.speakerButtonHtml('えき','vocab-えき','Luister naar えき');assert.doesNotMatch(button,/aria-label="[^"]*えき|title="[^"]*えき/);
  const before=app.element('avatarAudioOverlay').innerHTML;app.renderAvatarAudioOverlay('えき','is-bottom','Afspelen');assert.equal(app.element('avatarAudioOverlay').innerHTML,before);
});
test('ordinary word practice protects its current target and records only the answered goal',()=>{
  const app=helpApp(),words=['vocab-でんしゃ','vocab-えき'].map(id=>content.vocabById[id]);app.document.body.dataset.view='main';
  app.beginWordCrashCourse({hostId:'thematicBody',lesson:{id:'l10-4',level:10,title:'Bestaande woordtraining'},words,returnToLesson(){},onComplete(){}});
  const q=app.activeWordCrashCourse.queue[0];assert.equal(app.questionHelpBlocked(q.word.id),true);q.revealed=true;q.answerUnlockAt=0;app.answerWordCrashCourse(q.accepted[0]);
  assert.ok(app.state.guidelineEvidence.words[q.word.id].practiced);assert.equal(app.state.guidelineEvidence.words[q.word.id].kanji,undefined);assert.equal(Object.keys(app.state.guidelineEvidence.words).length,1);assert.deepEqual(plain(app.state.flashcardProgress.cards),{});
});
