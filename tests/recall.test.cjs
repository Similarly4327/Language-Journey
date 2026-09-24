const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const content=require('../language-journey-content/content.js');

process.env.TZ='Europe/Amsterdam';

function fakeElement(id=''){
  const classes=new Set();
  return {id,dataset:{},style:{},value:'',textContent:'',innerHTML:'',hidden:false,disabled:false,
    classList:{add:(...names)=>names.forEach(x=>classes.add(x)),remove:(...names)=>names.forEach(x=>classes.delete(x)),toggle:(name,force)=>{if(force===undefined)force=!classes.has(name);force?classes.add(name):classes.delete(name);return force},contains:name=>classes.has(name)},
    setAttribute(){},getAttribute(){return null},removeAttribute(){},appendChild(){},prepend(){},remove(){},addEventListener(){},querySelector(){return fakeElement()},querySelectorAll(){return []},scrollIntoView(){},focus(){},getBoundingClientRect(){return{width:300,height:200,top:0,left:0}}};
}

function createRecallApp({savedState={},now=new Date(2026,2,20,12).getTime()}={}){
  const clock={now};
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const inline=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/\}\)\(\);\s*$/,`globalThis.__probe={state,rankState,vocabCatalog,vocabById,flashcardDue,flashcardDueText,flashcardNextDueAt,flashcardCounts,flashcardSelectedCards,flashcardAnswerChoices,flashcardAnswerFeedback,flashcardAnswerState,flashcardAnswerFeedbackText,flashcardRate,flashcardSkip,flashcardNextCard,startFlashcardSession,pauseFlashcardSession,resumeFlashcardSession,recordVocabEncounter,renderFlashcardsScreen,viewMarkup(){return $('flashcardView').innerHTML},setNow(value){clock.now=value},disableRender(){renderFlashcardsScreen=()=>{}}};})();`);
  const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,fakeElement(id));return elements.get(id)};
  const document={body:fakeElement('body'),documentElement:fakeElement('html'),hidden:false,getElementById:get,createElement:()=>fakeElement(),querySelectorAll:()=>[],querySelector:()=>fakeElement(),addEventListener(){}};
  const storage=new Map();
  storage.set('taal-japanse-leerapp-v1',JSON.stringify({version:6,state:savedState}));
  const localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
  const NativeDate=Date;
  class FixedDate extends NativeDate{constructor(...args){super(...(args.length?args:[clock.now]))}static now(){return clock.now}}
  const window={LanguageJourneyContent:content,innerWidth:390,innerHeight:844,addEventListener(){},setTimeout(){return 1},clearTimeout(){},matchMedia:()=>({matches:false,addEventListener(){}})};
  const context={document,window,localStorage,clock,performance:{now:()=>0},navigator:{},console,setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(){},structuredClone,URL,Date:FixedDate,Math,Intl,alert(){},Image:class{}};
  for(const [,relative] of html.matchAll(/<script src="\.\/([^"]+)"><\/script>/g)){
    if(relative==='language-journey-content/content.js')continue;
    vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',relative),'utf8'),context,{timeout:5000});
  }
  vm.runInNewContext(inline,context,{timeout:5000});
  context.__probe.disableRender();
  return context.__probe;
}

function localDay(date){return`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`}

test('Recall preserves legacy per-direction reviews and interrupted sessions',()=>{
  const id='vocab-ねこ',dueAt=new Date(2026,2,22,12).getTime(),lastReviewedAt=new Date(2026,2,19,12).getTime();
  const app=createRecallApp({savedState:{introducedVocabIds:[id],flashcardProgress:{version:1,cards:{[`${id}::jp-nl`]:{dueAt,intervalDays:3,repetitions:2,lapses:1,lastReviewedAt,lastGrade:'knew'}}},flashcardSession:{queue:[{cardId:id,direction:'jp-nl'}],position:0,status:'paused',knew:1,again:0}}});
  assert.deepEqual(JSON.parse(JSON.stringify(app.state.flashcardProgress.cards[`${id}::jp-nl`])),{dueAt,intervalDays:3,repetitions:2,lapses:1,lastReviewedAt,lastGrade:'knew'});
  assert.equal(app.state.flashcardSession.mode,'scheduled');
  assert.equal(app.state.flashcardSession.status,'paused');
  assert.equal(app.state.flashcardSession.position,0);
  assert.equal(app.state.flashcardSession.knew,1);
});

test('Good answers advance intervals while directions and duplicate clicks stay independent',()=>{
  const app=createRecallApp(),{state}=app,[card]=app.vocabCatalog.filter(v=>!v.legacy);
  state.introducedVocabIds=[card.id];state.flashcardSelection.direction='both';
  assert.equal(app.flashcardCounts().new,2);
  const session={mode:'scheduled',queue:[{cardId:card.id,direction:'jp-nl'}],position:0,status:'active',revealed:true,knew:0,again:0,requeued:[],feedback:null};
  state.flashcardSession=session;
  const oldIntroduced=[...state.introducedVocabIds];
  app.flashcardRate('knew',card.meaning);
  const key=`${card.id}::jp-nl`,record=state.flashcardProgress.cards[key];
  assert.equal(record.repetitions,1);assert.equal(record.intervalDays,1);assert.equal(state.flashcardProgress.cards[`${card.id}::nl-jp`],undefined);
  assert.equal(record.dueAt,app.flashcardNextDueAt(record.lastReviewedAt,'knew',1));
  app.flashcardRate('knew',card.meaning);
  assert.equal(state.flashcardProgress.cards[key].repetitions,1);
  assert.equal(session.knew,1);
  assert.deepEqual(state.introducedVocabIds,oldIntroduced);
});

test('Again returns after six hours, requeues at most once, and cannot loop alone',()=>{
  const app=createRecallApp(),{state}=app,[a,b]=app.vocabCatalog.filter(v=>!v.legacy);
  state.introducedVocabIds=[a.id,b.id];
  const now=new Date(2026,2,20,12).getTime();
  state.flashcardSession={mode:'scheduled',queue:[{cardId:a.id,direction:'jp-nl'},{cardId:b.id,direction:'jp-nl'}],position:0,status:'active',revealed:true,knew:0,again:0,requeued:[],feedback:null};
  app.flashcardRate('again','wrong');
  const record=state.flashcardProgress.cards[`${a.id}::jp-nl`];
  assert.equal(record.dueAt,now+6*60*60*1000);assert.equal(record.lapses,1);
  assert.equal(state.flashcardSession.queue.length,3);
  assert.deepEqual(state.flashcardSession.requeued,[`${a.id}::jp-nl`]);
  state.flashcardSession={mode:'scheduled',queue:[{cardId:a.id,direction:'jp-nl'}],position:0,status:'active',revealed:true,knew:0,again:0,requeued:[],feedback:null};
  app.flashcardRate('again','wrong');
  assert.equal(state.flashcardSession.queue.length,1);
  app.flashcardNextCard();
  assert.equal(state.flashcardSession.status,'complete');
});

test('Future words can be freely practiced, while skips and free answers never reschedule them',()=>{
  const app=createRecallApp(),{state}=app,future=app.vocabCatalog.find(v=>!v.legacy&&!state.introducedVocabIds.includes(v.id));
  assert.ok(future);
  assert.ok(!app.flashcardSelectedCards().some(v=>v.id===future.id));
  const now=new Date(2026,2,20,12).getTime();
  state.flashcardProgress.cards[`${future.id}::nl-jp`]={dueAt:now+3*86400000,intervalDays:3,repetitions:2,lapses:0,lastReviewedAt:now,lastGrade:'knew'};
  const before=JSON.stringify(state.flashcardProgress.cards),known=[...state.introducedVocabIds];
  app.startFlashcardSession([future],['nl-jp'],'free');
  assert.equal(state.flashcardSession.queue.length,1);
  assert.equal(state.flashcardSession.mode,'free');
  state.flashcardSession.revealed=true;
  app.flashcardRate('knew',future.kana);
  assert.equal(state.flashcardProgress.cards[`${future.id}::nl-jp`].repetitions,2);
  state.flashcardSession.feedback={grade:'viewed',chosen:future.kana,ungraded:true};
  app.flashcardNextCard();
  assert.equal(state.flashcardSession.viewed,1);
  assert.equal(JSON.stringify(state.flashcardProgress.cards),before);
  assert.deepEqual(JSON.parse(JSON.stringify(state.introducedVocabIds)),known);
  state.flashcardSession={mode:'scheduled',queue:[{cardId:future.id,direction:'nl-jp'}],position:0,status:'active',revealed:false,knew:0,again:0,requeued:[],feedback:null};
  app.flashcardSkip();
  assert.equal(state.flashcardSession.skipped,1);
  assert.equal(JSON.stringify(state.flashcardProgress.cards),before);
});

test('Good intervals use local calendar days across DST and due labels use calendar dates',()=>{
  const app=createRecallApp();
  const spring=new Date(2026,2,28,12),springDue=new Date(app.flashcardNextDueAt(spring.getTime(),'knew',1));
  assert.equal(localDay(springDue),localDay(new Date(2026,2,29,12)));
  assert.equal(springDue.getHours(),12);
  assert.equal(springDue-spring.getTime(),23*60*60*1000);
  const autumn=new Date(2026,9,24,12),autumnDue=new Date(app.flashcardNextDueAt(autumn.getTime(),'knew',1));
  assert.equal(localDay(autumnDue),localDay(new Date(2026,9,25,12)));
  assert.equal(autumnDue.getHours(),12);
  assert.equal(autumnDue-autumn.getTime(),25*60*60*1000);
  const today=new Date(2026,2,20,10),later=new Date(2026,2,20,12),tomorrow=new Date(2026,2,21,9);
  assert.match(app.flashcardDueText(later.getTime(),today.getTime()),/^later vandaag/);
  assert.match(app.flashcardDueText(tomorrow.getTime(),today.getTime()),/^morgen/);
  assert.equal(app.flashcardDueText(today.getTime(),today.getTime()),'nu aan de beurt');
  assert.equal(app.flashcardDue({dueAt:tomorrow.getTime()},today.getTime()),false);
  assert.equal(app.flashcardDue({dueAt:tomorrow.getTime()},tomorrow.getTime()),true);
});

test('An answer after midnight schedules from the new local day, not session start',()=>{
  const app=createRecallApp({now:new Date(2026,2,20,23,58).getTime()}),{state}=app,[card]=app.vocabCatalog.filter(v=>!v.legacy);
  state.flashcardSession={mode:'scheduled',queue:[{cardId:card.id,direction:'jp-nl'}],position:0,status:'active',revealed:true,knew:0,again:0,requeued:[],feedback:null,startedAt:Date.now()};
  const reviewedAt=new Date(2026,2,21,0,3).getTime();app.setNow(reviewedAt);
  app.flashcardRate('knew',card.meaning);
  const record=state.flashcardProgress.cards[`${card.id}::jp-nl`];
  assert.equal(record.lastReviewedAt,reviewedAt);
  assert.equal(localDay(new Date(record.dueAt)),localDay(new Date(2026,2,22,0,3)));
});

test('Recall keeps unique introduced-word counts separate from repeated SRS reviews',()=>{
  const app=createRecallApp(),{state}=app,[card]=app.vocabCatalog.filter(v=>!v.legacy);
  state.introducedVocabIds=[card.id];
  const uniqueBefore=new Set(state.introducedVocabIds).size;
  for(let n=0;n<2;n++){
    state.flashcardSession={mode:'scheduled',queue:[{cardId:card.id,direction:'jp-nl'}],position:0,status:'active',revealed:true,knew:0,again:0,requeued:[],feedback:null};
    app.flashcardRate('knew',card.meaning);
  }
  assert.equal(new Set(state.introducedVocabIds).size,uniqueBefore);
  assert.equal(state.flashcardProgress.cards[`${card.id}::jp-nl`].repetitions,2);
  assert.equal(state.flashcardProgress.cards[`${card.id}::nl-jp`],undefined);
});

test('Recall start screen clearly separates due SRS cards from free practice',()=>{
  const app=createRecallApp(),{state}=app,[card,later]=app.vocabCatalog.filter(v=>!v.legacy);
  state.introducedVocabIds=[card.id,later.id];
  state.flashcardProgress.cards[`${card.id}::jp-nl`]={dueAt:new Date(2026,2,20,11).getTime(),intervalDays:1,repetitions:1,lapses:0,lastReviewedAt:new Date(2026,2,19,11).getTime(),lastGrade:'knew'};
  state.flashcardProgress.cards[`${later.id}::jp-nl`]={dueAt:new Date(2026,2,20,14).getTime(),intervalDays:1,repetitions:1,lapses:0,lastReviewedAt:new Date(2026,2,19,14).getTime(),lastGrade:'knew'};
  app.renderFlashcardsScreen();
  const markup=app.viewMarkup();
  assert.match(markup,/>Recall</);
  assert.match(markup,/Nieuw · beschikbaar/);
  assert.match(markup,/Aan de beurt/);
  assert.match(markup,/Later gepland/);
  assert.match(markup,/Start SRS-herhaling/);
  assert.match(markup,/Vrij oefenen/);
  assert.match(markup,/Kies andere levels of lessen/);
});

test('A saved review is not hidden when old lesson-encounter flags are missing',()=>{
  const app=createRecallApp(),{state}=app,card=app.vocabCatalog.find(v=>!v.legacy&&!state.introducedVocabIds.includes(v.id));
  assert.ok(card);
  assert.ok(!app.flashcardSelectedCards().some(v=>v.id===card.id));
  state.flashcardProgress.cards[`${card.id}::jp-nl`]={dueAt:Date.now()-1,intervalDays:1,repetitions:1,lapses:0,lastReviewedAt:Date.now()-86400000,lastGrade:'knew'};
  assert.ok(app.flashcardSelectedCards().some(v=>v.id===card.id));
});

test('Dutch to Japanese choices do not offer another word with the same Dutch meaning',()=>{
  const app=createRecallApp(),{state}=app,women=app.vocabCatalog.filter(v=>!v.legacy&&v.meaning==='vrouw');
  assert.equal(women.length,2);
  state.introducedVocabIds.push(...women.map(v=>v.id));
  for(const card of women){
    const other=women.find(v=>v.id!==card.id);
    for(let repeat=0;repeat<30;repeat++)assert.ok(!app.flashcardAnswerChoices(card,'nl-jp').includes(other.kana));
  }
});

test('Future free-practice cards have useful choices on a fresh profile',()=>{
  const app=createRecallApp(),{state}=app,card=app.vocabCatalog.find(v=>!v.legacy&&!state.introducedVocabIds.includes(v.id));
  assert.ok(card);
  assert.equal(state.introducedVocabIds.length,0);
  assert.equal(app.flashcardAnswerChoices(card,'jp-nl').length,4);
  assert.equal(app.flashcardAnswerChoices(card,'nl-jp').length,4);
  assert.equal(state.introducedVocabIds.length,0);
  assert.equal(Object.keys(state.flashcardProgress.cards).length,0);
});

test('Recall answer feedback marks wrong, correct, and remaining options consistently',()=>{
  const app=createRecallApp();
  const choices=['muziekstuk','lied','boek','hond'],correctAnswers=['lied','muziekstuk betekenis'];
  const before=app.flashcardAnswerFeedback(choices,correctAnswers,null);
  assert.deepEqual(choices.map(answer=>app.flashcardAnswerState(answer,before)),['neutral','neutral','neutral','neutral']);
  const incorrect=app.flashcardAnswerFeedback(choices,correctAnswers,{chosen:'muziekstuk',grade:'again'});
  assert.equal(incorrect.correctAnswer,'lied','correct option is selected from the presented choices, not meaning-list order');
  assert.deepEqual(choices.map(answer=>app.flashcardAnswerState(answer,incorrect)),['incorrect','correct','neutral','neutral']);
  assert.equal(app.flashcardAnswerFeedbackText(incorrect),'Niet goed · Juiste antwoord: lied');
  const correct=app.flashcardAnswerFeedback(choices,correctAnswers,{chosen:'lied',grade:'knew'});
  assert.deepEqual(choices.map(answer=>app.flashcardAnswerState(answer,correct)),['neutral','correct','neutral','neutral']);
  assert.equal(app.flashcardAnswerFeedbackText(correct),'Goed!');
  const freeIncorrect=app.flashcardAnswerFeedback(choices,correctAnswers,{chosen:'muziekstuk',grade:'viewed',ungraded:true});
  assert.deepEqual(choices.map(answer=>app.flashcardAnswerState(answer,freeIncorrect)),['incorrect','correct','neutral','neutral']);
});
