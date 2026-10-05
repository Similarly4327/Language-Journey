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

function createRecallApp({savedState={},savedRanks={},savedVersion=6,now=new Date(2026,2,20,12).getTime()}={}){
  const clock={now};
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const inline=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/\}\)\(\);\s*$/,`const recallRenderFlashcardsScreen=renderFlashcardsScreen;globalThis.__probe={state,rankState,vocabCatalog,vocabById,flashcardDue,flashcardDueText,flashcardNextDueAt,flashcardCounts,flashcardSelectedCards,flashcardDirections,getNextRecallDueAt,flashcardAnswerChoices,flashcardQuestionIsValid,flashcardAnswerFeedback,flashcardAnswerState,flashcardAnswerFeedbackText,flashcardRate,flashcardSkip,flashcardNextCard,revealFlashcardOptions,startFlashcardSession,pauseFlashcardSession,resumeFlashcardSession,recordVocabEncounter,renderFlashcardsScreen,registeredAudioAsset,speakerButtonHtml,audioOverlayPlacement,show,viewMarkup(){return $('flashcardView').innerHTML},setNow(value){clock.now=value},enableRender(){renderFlashcardsScreen=recallRenderFlashcardsScreen},disableRender(){renderFlashcardsScreen=()=>{}}};})();`);
  const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,fakeElement(id));return elements.get(id)};
  const document={body:fakeElement('body'),documentElement:fakeElement('html'),hidden:false,getElementById:get,createElement:()=>fakeElement(),querySelectorAll:()=>[],querySelector:()=>fakeElement(),addEventListener(){}};
  const storage=new Map();
  storage.set('taal-japanse-leerapp-v1',JSON.stringify({version:savedVersion,state:savedState,ranks:savedRanks}));
  const localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
  const documentListeners=new Map(),windowListeners=new Map(),intervals=[],windowTimeouts=[],clearedWindowTimeouts=[];
  const addListener=(listeners,type,callback)=>{if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(callback)};
  const NativeDate=Date;
  class FixedDate extends NativeDate{constructor(...args){super(...(args.length?args:[clock.now]))}static now(){return clock.now}}
  const window={LanguageJourneyContent:content,innerWidth:390,innerHeight:844,addEventListener:(type,callback)=>addListener(windowListeners,type,callback),setInterval:(callback,delay)=>{intervals.push({callback,delay});return intervals.length},setTimeout:(callback,delay)=>{windowTimeouts.push({callback,delay});return windowTimeouts.length},clearTimeout:id=>clearedWindowTimeouts.push(id),matchMedia:()=>({matches:false,addEventListener(){}})};
  document.addEventListener=(type,callback)=>addListener(documentListeners,type,callback);
  const context={document,window,localStorage,location:{hash:''},clock,performance:{now:()=>0},navigator:{},console,setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(){},structuredClone,URL,Date:FixedDate,Math,Intl,alert(){},Image:class{}};
  for(const [,relative] of html.matchAll(/<script src="\.\/([^"?]+)(?:\?[^"]*)?"><\/script>/g)){
    if(relative==='language-journey-content/content.js')continue;
    vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',relative),'utf8'),context,{timeout:5000});
  }
  vm.runInNewContext(inline.replace('globalThis.__probe={state,rankState,','globalThis.__probe={state,rankState,setFlashcardAuto,setFlashcardLessonSelection,introduceWordEntries,saveProgress,'),context,{timeout:5000});
  context.__probe.disableRender();
  context.__probe.fireInterval=()=>intervals.forEach(timer=>timer.callback());
  context.__probe.fireWindowEvent=type=>(windowListeners.get(type)||[]).forEach(callback=>callback());
  context.__probe.fireDocumentEvent=type=>(documentListeners.get(type)||[]).forEach(callback=>callback());
  context.__probe.intervalDelays=()=>intervals.map(timer=>timer.delay);
  context.__probe.windowTimeouts=()=>windowTimeouts;
  context.__probe.clearedWindowTimeouts=()=>clearedWindowTimeouts;
  context.__probe.leaveRecall=()=>{context.__probe.state.screen='levels';context.__probe.show('main')};
  context.__probe.savedProgress=()=>{context.__probe.saveProgress();return JSON.parse(storage.get('taal-japanse-leerapp-v1'))};
  context.__probe.scopeMarkup=()=>get('flashcardScope').innerHTML;
  return context.__probe;
}

function localDay(date){return`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`}

test('Auto follows recorded introductions and lesson ranks, never unlocked or selected levels',()=>{
  const app=createRecallApp({savedVersion:8,savedState:{level:8,unlockedAvatarSkins:['skin-9'],introducedVocabIds:['vocab-ねこ'],flashcardSelection:{auto:true,lessonIds:['l9-1'],direction:'jp-nl'}},savedRanks:{'l7-1':{rank:'Copper'}}});
  assert.equal(app.state.flashcardSelection.auto,true);
  assert.ok(app.flashcardSelectedCards().some(word=>word.id==='vocab-ねこ'));
  assert.ok(app.flashcardSelectedCards().some(word=>word.lessonId==='l7-1'));
  assert.ok(!app.flashcardSelectedCards().some(word=>word.level===9));
  const later=app.vocabCatalog.find(word=>word.lessonId==='l8-1');
  app.introduceWordEntries([later]);app.introduceWordEntries([later]);
  assert.equal(app.state.introducedVocabIds.filter(id=>id===later.id).length,1);
  assert.equal(app.flashcardSelectedCards().filter(word=>word.id===later.id).length,1,'later lesson words join Auto without touching the manual filter');
  app.vocabCatalog.push({...later,lessonId:'l9-1'});
  assert.equal(app.flashcardSelectedCards().filter(word=>word.id===later.id).length,1,'a repeated catalog/lesson reference keeps one stable card');
  app.startFlashcardSession([later,later],['jp-nl']);
  assert.equal(app.state.flashcardSession.queue.length,1,'session input cannot duplicate a card');
});

test('Auto migration keeps explicit manual selections off and defaults all/new profiles to on',()=>{
  for(const lessonIds of [['l4-1'],[]]){
    const app=createRecallApp({savedVersion:8,savedState:{flashcardSelection:{lessonIds,direction:'nl-jp'}}});
    assert.equal(app.state.flashcardSelection.auto,false);
    assert.deepEqual(Array.from(app.state.flashcardSelection.lessonIds),lessonIds);
    assert.equal(app.state.flashcardSelection.direction,'nl-jp');
  }
  assert.equal(createRecallApp().state.flashcardSelection.auto,true);
  assert.equal(createRecallApp({savedState:{flashcardSelection:{lessonIds:null}}}).state.flashcardSelection.auto,true);
});

test('manual scope survives Auto changes, later learning and reload with both SRS directions intact',()=>{
  const records={'vocab-ねこ::jp-nl':{dueAt:1900000000000,intervalDays:7,repetitions:3,lapses:1,lastReviewedAt:1800000000000,lastGrade:'knew'},'vocab-ねこ::nl-jp':{dueAt:1900100000000,intervalDays:3,repetitions:2,lapses:2,lastReviewedAt:1800100000000,lastGrade:'again'}};
  const app=createRecallApp({savedVersion:8,savedState:{introducedVocabIds:['vocab-ねこ'],flashcardProgress:{version:1,cards:records}}});
  app.setFlashcardAuto(false);
  assert.deepEqual(Array.from(app.state.flashcardSelection.lessonIds),['l4-1'],'first manual selection captures currently available lessons');
  const later=app.vocabCatalog.find(word=>word.lessonId==='l8-1');app.introduceWordEntries([later]);
  assert.ok(!app.flashcardSelectedCards().some(word=>word.id===later.id),'manual pool stays targeted as progress grows');
  app.setFlashcardAuto(true);
  assert.ok(app.flashcardSelectedCards().some(word=>word.id===later.id));
  assert.deepEqual(Array.from(app.state.flashcardSelection.lessonIds),['l4-1']);
  const saved=app.savedProgress(),reloaded=createRecallApp({savedVersion:saved.version,savedState:saved.state,savedRanks:saved.ranks});
  assert.equal(reloaded.state.flashcardSelection.auto,true);
  assert.ok(reloaded.flashcardSelectedCards().some(word=>word.id===later.id));
  reloaded.setFlashcardAuto(false);
  assert.deepEqual(Array.from(reloaded.state.flashcardSelection.lessonIds),['l4-1']);
  assert.ok(!reloaded.flashcardSelectedCards().some(word=>word.id===later.id));
  assert.deepEqual(JSON.parse(JSON.stringify(reloaded.state.flashcardProgress.cards)),records);
  const manualSaved=reloaded.savedProgress(),manualReload=createRecallApp({savedVersion:manualSaved.version,savedState:manualSaved.state});
  assert.equal(manualReload.state.flashcardSelection.auto,false);
  assert.deepEqual(Array.from(manualReload.state.flashcardSelection.lessonIds),['l4-1']);
  assert.deepEqual(JSON.parse(JSON.stringify(manualReload.state.flashcardProgress.cards)),records);
  manualReload.startFlashcardSession(manualReload.flashcardSelectedCards(),['nl-jp'],'free');
  const session=manualReload.state.flashcardSession;session.revealed=true;manualReload.flashcardRate('knew');
  assert.deepEqual(JSON.parse(JSON.stringify(manualReload.state.flashcardProgress.cards)),records,'free practice leaves both direction schedules unchanged');
});

test('manual selection stores exact available lesson IDs rather than a future all-lessons wildcard',()=>{
  const app=createRecallApp({savedState:{introducedVocabIds:['vocab-ねこ']}});app.setFlashcardAuto(false);app.setFlashcardLessonSelection(['l4-1','l4-1']);
  assert.deepEqual(Array.from(app.state.flashcardSelection.lessonIds),['l4-1']);
  app.setFlashcardLessonSelection([]);app.setFlashcardAuto(true);app.setFlashcardAuto(false);
  assert.equal(app.flashcardSelectedCards().length,0,'an intentionally empty manual selection remains empty');
  assert.deepEqual(Array.from(app.state.flashcardSelection.lessonIds),[]);
});

test('Recall distinguishes no learned words from an empty manual pool and hides unavailable choices',()=>{
  const app=createRecallApp();app.renderFlashcardsScreen();
  assert.match(app.viewMarkup(),/Je hebt nog geen woorden behandeld/);
  assert.match(app.viewMarkup(),/aria-describedby="fcAutoHelp"/);
  assert.doesNotMatch(app.viewMarkup(),/id="flashcardScope"/);
  const card=app.vocabCatalog.find(word=>word.id==='vocab-ねこ');app.introduceWordEntries([card]);app.setFlashcardAuto(false);app.setFlashcardLessonSelection([]);app.renderFlashcardsScreen();
  const markup=app.viewMarkup();assert.match(markup,/Je handmatige selectie bevat geen beschikbare woorden/);
  assert.match(markup,/id="recallCustom"/);assert.match(markup,/Handmatige selectie · 0 actieve woorden/);
  app.enableRender();app.renderFlashcardsScreen();
  // The scope counts only encountered words, even if the lesson introduces more.
  assert.match(app.scopeMarkup(),/1 woorden/);
  assert.match(app.scopeMarkup(),/data-fc-lesson="l4-1"/);
  assert.doesNotMatch(app.scopeMarkup(),/data-fc-level="[5-9]"/);
  assert.ok(!app.flashcardSelectedCards().length);
  app.setFlashcardAuto(true);assert.equal(app.flashcardSelectedCards().length,1);
  assert.equal(app.state.flashcardSession,null,'Auto never starts a mandatory session');
});

test('audio coach only exposes registered local recordings and chooses the opposite viewport half',()=>{
  const asset={id:'audio-test-greeting',speakerId:'ren',path:'audio/greeting.mp3',textJa:'こんにちは'};
  content.manifest.audio.assets.push(asset);
  try{
    const app=createRecallApp();
    assert.match(app.speakerButtonHtml('こんにちは'),/data-audio-text="こんにちは"/);
    assert.equal(app.speakerButtonHtml('さようなら'),'','no unregistered or guessed audio button');
    app.state.audioEnabled=false;
    assert.equal(app.speakerButtonHtml('こんにちは'),'','the global audio setting hides speakers');
    assert.equal(app.audioOverlayPlacement({getBoundingClientRect:()=>({top:30,height:20})}),'is-bottom');
    assert.equal(app.audioOverlayPlacement({getBoundingClientRect:()=>({top:600,height:20})}),'is-top');
  }finally{content.manifest.audio.assets.pop()}
});

test('Recall preserves legacy per-direction reviews and interrupted sessions',()=>{
  const id='vocab-ねこ',dueAt=new Date(2026,2,22,12).getTime(),lastReviewedAt=new Date(2026,2,19,12).getTime();
  const app=createRecallApp({savedState:{introducedVocabIds:[id],flashcardProgress:{version:1,cards:{[`${id}::jp-nl`]:{dueAt,intervalDays:3,repetitions:2,lapses:1,lastReviewedAt,lastGrade:'knew'}}},flashcardSession:{queue:[{cardId:id,direction:'jp-nl'}],position:0,status:'paused',knew:1,again:0}}});
  assert.deepEqual(JSON.parse(JSON.stringify(app.state.flashcardProgress.cards[`${id}::jp-nl`])),{dueAt,intervalDays:3,repetitions:2,lapses:1,lastReviewedAt,lastGrade:'knew'});
  assert.equal(app.state.flashcardSession.mode,'scheduled');
  assert.equal(app.state.flashcardSession.status,'paused');
  assert.equal(app.state.flashcardSession.position,0);
  assert.equal(app.state.flashcardSession.knew,1);
});

test('Bare legacy Recall records migrate to Japanese → Dutch without replacing explicit history',()=>{
  const id='vocab-ねこ',bareId='vocab-いぬ',legacy={dueAt:12345,intervalDays:7,repetitions:4,lapses:1,lastReviewedAt:2345,lastGrade:'again'},explicit={dueAt:54321,intervalDays:3,repetitions:2,lapses:0,lastReviewedAt:23456,lastGrade:'knew'};
  const app=createRecallApp({savedState:{flashcardProgress:{cards:{[id]:legacy,[`${id}::jp-nl`]:explicit,[bareId]:legacy}}}});
  assert.deepEqual(JSON.parse(JSON.stringify(app.state.flashcardProgress.cards[`${id}::jp-nl`])),explicit);
  assert.equal(app.state.flashcardProgress.cards[`${id}::nl-jp`],undefined);
  assert.deepEqual(JSON.parse(JSON.stringify(app.state.flashcardProgress.cards[`${bareId}::jp-nl`])),legacy);
});

test('Good answers advance intervals while directions and duplicate clicks stay independent',()=>{
  const app=createRecallApp(),{state}=app,[card]=app.vocabCatalog.filter(v=>!v.legacy);
  state.introducedVocabIds=[card.id];state.flashcardSelection.direction='both';
  assert.equal(app.flashcardDirections().length,1);
  assert.equal(app.flashcardCounts().new,1);
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
  const savedReview=JSON.stringify(state.flashcardProgress.cards[key]);
  app.flashcardNextCard();
  app.flashcardNextCard();
  assert.equal(JSON.stringify(state.flashcardProgress.cards[key]),savedReview,'advancing after feedback does not register the review again');
  assert.equal(session.position,1,'a card advances only once');
  assert.deepEqual(state.introducedVocabIds,oldIntroduced);
});

test('Good Recall feedback is brief and auto-advances once without another SRS write',()=>{
  const app=createRecallApp(),{state}=app,[first,second]=app.vocabCatalog.filter(v=>!v.legacy);
  app.enableRender();state.screen='flashcards';state.introducedVocabIds=[first.id,second.id];
  const session={mode:'scheduled',queue:[{cardId:first.id,direction:'jp-nl'},{cardId:second.id,direction:'jp-nl'}],position:0,status:'active',revealed:true,optionsRevealed:true,knew:0,again:0,requeued:[],feedback:null};
  state.flashcardSession=session;app.flashcardRate('knew',first.meaning);
  const dueAt=state.flashcardProgress.cards[`${first.id}::jp-nl`].dueAt,timeout=app.windowTimeouts().at(-1);
  assert.equal(session.feedback.until-state.flashcardProgress.cards[`${first.id}::jp-nl`].lastReviewedAt,1500);
  assert.equal(timeout.delay,1500);
  assert.match(app.viewMarkup(),/Goed!/);
  assert.doesNotMatch(app.viewMarkup(),/Volgende kaart/);
  app.setNow(session.feedback.until);timeout.callback();
  assert.equal(session.position,1);
  assert.equal(session.optionsRevealed,false);
  assert.equal(JSON.stringify(state.flashcardProgress.cards[`${first.id}::jp-nl`].dueAt),JSON.stringify(dueAt));
  timeout.callback();assert.equal(session.position,1,'duplicate timer callbacks cannot advance twice');
});

test('Manual advance cancels the good-answer timer and stale callbacks cannot skip a card',()=>{
  const app=createRecallApp(),{state}=app,[first,second,third]=app.vocabCatalog.filter(v=>!v.legacy);
  app.enableRender();state.screen='flashcards';state.introducedVocabIds=[first.id,second.id,third.id];
  const session={mode:'scheduled',queue:[first,second,third].map(card=>({cardId:card.id,direction:'jp-nl'})),position:0,status:'active',revealed:true,optionsRevealed:true,knew:0,again:0,requeued:[],feedback:null};
  state.flashcardSession=session;app.flashcardRate('knew',first.meaning);
  const timer=app.windowTimeouts().at(-1);
  app.flashcardNextCard();
  assert.equal(session.position,1);
  assert.ok(app.clearedWindowTimeouts().length,'manual next cancels the pending timeout');
  app.setNow(session.feedback?.until||Date.now()+2000);timer.callback();
  assert.equal(session.position,1,'the expired callback cannot skip the card now shown');
  assert.equal(session.status,'active');
});

test('Leaving Recall cancels its timer and returning shows feedback before continuing',()=>{
  const app=createRecallApp(),{state}=app,[first,second]=app.vocabCatalog.filter(v=>!v.legacy);
  app.enableRender();state.screen='flashcards';state.introducedVocabIds=[first.id,second.id];
  const session={mode:'scheduled',queue:[first,second].map(card=>({cardId:card.id,direction:'jp-nl'})),position:0,status:'active',revealed:true,optionsRevealed:true,knew:0,again:0,requeued:[],feedback:null};
  state.flashcardSession=session;app.flashcardRate('knew',first.meaning);
  const timer=app.windowTimeouts().at(-1);
  app.leaveRecall();
  assert.equal(state.screen,'levels');
  assert.equal(session.position,0);
  assert.equal(session.feedback.until,null,'leaving resets the paused feedback delay');
  app.setNow(Date.now()+2000);timer.callback();
  assert.equal(session.position,0,'a timer cannot reopen Recall after leaving it');
  state.screen='flashcards';app.renderFlashcardsScreen();
  assert.match(app.viewMarkup(),/Goed!/);
  const resumedTimer=app.windowTimeouts().at(-1);
  app.startFlashcardSession([second],['jp-nl'],'free');
  const replacement=state.flashcardSession;
  app.setNow((replacement.startedAt||Date.now())+2000);resumedTimer.callback();
  assert.notEqual(replacement,session);
  assert.equal(replacement.position,0,'a prior session timer cannot advance the replacement session');
});

test('A wrong answer stays visible for manual advance, while a correct free-practice answer auto-advances without rescheduling',()=>{
  const wrongApp=createRecallApp(),wrongState=wrongApp.state,[wrongCard]=wrongApp.vocabCatalog.filter(v=>!v.legacy);
  wrongApp.enableRender();wrongState.screen='flashcards';wrongState.introducedVocabIds=[wrongCard.id];
  const choices=wrongApp.flashcardAnswerChoices(wrongCard,'jp-nl'),wrongChoice=choices.find(choice=>choice!==wrongCard.meaning);
  wrongState.flashcardSession={mode:'scheduled',queue:[{cardId:wrongCard.id,direction:'jp-nl'}],position:0,status:'active',revealed:false,optionsRevealed:true,knew:0,again:1,requeued:[],feedback:{grade:'again',chosen:wrongChoice,until:null}};
  wrongApp.renderFlashcardsScreen();
  assert.ok(wrongApp.viewMarkup().includes(`Juiste antwoord: ${wrongCard.meaning}`));
  assert.equal(wrongApp.windowTimeouts().length,0,'wrong answers wait for a manual tap');
  wrongApp.flashcardNextCard();
  assert.equal(wrongState.flashcardSession.position,1,'the wrong answer advances only after manual next');
  assert.equal(wrongState.flashcardSession.status,'complete');

  const freeApp=createRecallApp(),{state}=freeApp,[freeCard,nextCard]=freeApp.vocabCatalog.filter(v=>!v.legacy);
  freeApp.enableRender();state.screen='flashcards';state.introducedVocabIds=[freeCard.id,nextCard.id];
  const progressBefore=JSON.stringify(state.flashcardProgress.cards);
  const session={mode:'free',queue:[freeCard,nextCard].map(card=>({cardId:card.id,direction:'jp-nl'})),position:0,status:'active',revealed:false,optionsRevealed:true,knew:0,again:0,viewed:0,skipped:0,requeued:[],feedback:{grade:'viewed',chosen:freeCard.meaning,until:new Date(2026,2,20,12).getTime()+1500,ungraded:true}};
  state.flashcardSession=session;freeApp.renderFlashcardsScreen();
  const timer=freeApp.windowTimeouts().at(-1);
  assert.match(freeApp.viewMarkup(),/Goed!/);
  freeApp.setNow(session.feedback.until);timer.callback();
  assert.equal(session.position,1);
  assert.equal(session.viewed,1);
  assert.equal(JSON.stringify(state.flashcardProgress.cards),progressBefore,'free practice leaves Recall scheduling unchanged');
});

test('The last good answer waits for its feedback, then opens the normal results screen',()=>{
  const app=createRecallApp(),{state}=app,[card]=app.vocabCatalog.filter(v=>!v.legacy);
  app.enableRender();state.screen='flashcards';state.introducedVocabIds=[card.id];
  state.flashcardSession={mode:'scheduled',queue:[{cardId:card.id,direction:'jp-nl'}],position:0,status:'active',revealed:true,optionsRevealed:true,knew:0,again:0,requeued:[],feedback:null};
  app.flashcardRate('knew',card.meaning);
  const timer=app.windowTimeouts().at(-1),session=state.flashcardSession;
  assert.match(app.viewMarkup(),/Goed!/);
  assert.equal(session.status,'active','the result screen is not shown before feedback finishes');
  app.setNow(session.feedback.until);timer.callback();
  assert.equal(session.status,'complete');
  assert.match(app.viewMarkup(),/Sessie afgerond/);
  assert.match(app.viewMarkup(),/Goed gedaan/);
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

test('Future words cannot enter Recall in either direction; learned free practice does not reschedule',()=>{
  const app=createRecallApp(),{state}=app,future=app.vocabCatalog.find(v=>!v.legacy&&!state.introducedVocabIds.includes(v.id));
  assert.ok(future);
  assert.ok(!app.flashcardSelectedCards().some(v=>v.id===future.id));
  const before=JSON.stringify(state.flashcardProgress.cards);
  app.startFlashcardSession([future],['nl-jp'],'free');
  assert.equal(state.flashcardSession,null);
  app.startFlashcardSession([future],['jp-nl'],'free');
  assert.equal(state.flashcardSession,null);
  state.introducedVocabIds.push(future.id);
  const known=[...state.introducedVocabIds];
  app.startFlashcardSession([future],['jp-nl'],'free');
  assert.equal(state.flashcardSession.queue.length,1);
  assert.equal(state.flashcardSession.mode,'free');
  state.flashcardSession.revealed=true;
  app.flashcardRate('knew',future.meaning);
  state.flashcardSession.feedback={grade:'viewed',chosen:future.kana,ungraded:true};
  app.flashcardNextCard();
  assert.equal(state.flashcardSession.viewed,1);
  assert.equal(JSON.stringify(state.flashcardProgress.cards),before);
  assert.deepEqual(JSON.parse(JSON.stringify(state.introducedVocabIds)),known);
  state.flashcardSession={mode:'scheduled',queue:[{cardId:future.id,direction:'jp-nl'}],position:0,status:'active',revealed:false,knew:0,again:0,requeued:[],feedback:null};
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
  assert.match(markup,/Japans → Nederlands/);
  assert.match(markup,/Nederlands → Japans/);
  assert.match(markup,/id="fcStartJpNl"/);
  assert.match(markup,/id="fcStartNlJp"/);
  assert.match(markup,/Nieuw · beschikbaar/);
  assert.match(markup,/Aan de beurt/);
  assert.match(markup,/Later gepland/);
  assert.match(markup,/Start geplande herhaling/);
  assert.match(markup,/Vrij oefenen/);
  assert.match(markup,/role="switch" aria-checked="true"/);
  assert.doesNotMatch(markup,/id="recallCustom"/,'manual scope is hidden in Auto');
});

test('Recall rebuilds new cards from ranked Level 7, partial Level 8, and later lesson data',()=>{
  const ranks={'l7-1':{rank:'Copper',last:.8,attempts:1},'l8-2':{rank:'Silver',last:.9,attempts:2},'l12-3':{rank:'Gold',last:.95,attempts:3}},
    reviewedId='vocab-ひとつ',dueAt=new Date(2026,2,23,12).getTime(),savedState={flashcardProgress:{version:1,cards:{[`${reviewedId}::jp-nl`]:{dueAt,intervalDays:3,repetitions:2,lapses:0,lastReviewedAt:new Date(2026,2,20,12).getTime(),lastGrade:'knew'}}}},
    app=createRecallApp({savedState,savedRanks:ranks}),expected=app.vocabCatalog.filter(word=>ranks[word.lessonId]?.rank);
  const actual=app.flashcardSelectedCards();
  assert.deepEqual(actual.map(word=>word.id).sort(),expected.map(word=>word.id).sort(),'all and only words from ranked introduction lessons are eligible');
  assert.equal(new Set(actual.map(word=>word.id)).size,actual.length,'each canonical vocabulary ID appears once');
  assert.ok(expected.some(word=>word.level===7),'Level 7 core vocabulary is reconstructed');
  assert.ok(expected.some(word=>word.level===8&&word.lessonId==='l8-2'),'the completed Level 8 lesson is reconstructed');
  assert.ok(!actual.some(word=>word.level===8&&word.lessonId!=='l8-2'),'unfinished Level 8 lessons stay hidden');
  assert.ok(expected.some(word=>word.level===12),'eligibility does not stop at Level 8');
  assert.ok(!actual.some(word=>word.level===9),'an opened or future lesson without completion is not included');
  assert.ok(app.state.introducedVocabIds.includes(expected.find(word=>word.lessonId==='l7-1').id),'stored lesson ranks migrate idempotently to introduced vocabulary IDs');
  const counts=app.flashcardCounts(actual,['jp-nl']);
  assert.equal(counts.new,actual.length-1,'unreviewed eligible words are immediately counted as new');
  assert.equal(counts.upcoming,1,'an existing later-due review stays visible in the total');
  assert.equal(app.state.flashcardProgress.cards[`${reviewedId}::jp-nl`].dueAt,dueAt,'existing SRS timing is preserved');
  app.startFlashcardSession(actual,['jp-nl']);
  assert.equal(app.state.flashcardSession.queue.length,actual.length-1,'the normal session includes every new/due card and leaves a later-due card scheduled');
  assert.ok(!app.state.flashcardSession.queue.some(item=>item.cardId===reviewedId),'later-due history is not reset or forced due');
  app.state.flashcardSelection.lessonIds=['l8-2'];
  app.state.flashcardSelection.auto=false;
  assert.deepEqual(app.flashcardSelectedCards().map(word=>word.lessonId),actual.filter(word=>word.lessonId==='l8-2').map(word=>word.lessonId),'lesson filters scope the same eligible pool');
  const reloaded=createRecallApp({savedState:{introducedVocabIds:app.state.introducedVocabIds,flashcardProgress:savedState.flashcardProgress},savedRanks:ranks});
  assert.deepEqual(reloaded.flashcardSelectedCards().map(word=>word.id).sort(),expected.map(word=>word.id).sort(),'offline reload preserves the same unique eligible pool');
  assert.equal(reloaded.state.flashcardProgress.cards[`${reviewedId}::jp-nl`].dueAt,dueAt,'reload preserves the existing review due time');
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

test('A Dutch → Japanese session uses only eligible kana choices and records only reverse reviews once',()=>{
  const app=createRecallApp(),{state}=app;
  const unique=app.vocabCatalog.filter(v=>!v.legacy&&v.meaning!=='vrouw').slice(0,4);
  state.introducedVocabIds=unique.map(v=>v.id);
  const eligible=app.flashcardSelectedCards(false,'nl-jp');
  assert.ok(eligible.length>=1);
  for(const card of eligible){
    const choices=app.flashcardAnswerChoices(card,'nl-jp',eligible);
    assert.ok(choices.length>=1&&choices.length<=4);
    assert.ok(choices.includes(card.kana));
    assert.ok(app.flashcardQuestionIsValid(card,'nl-jp',choices,eligible));
    for(const option of choices)if(option!==card.kana)assert.ok(eligible.some(other=>other.id!==card.id&&other.kana===option&&!other.meanings.some(meaning=>meaning.toLocaleLowerCase('nl')===card.meaning.toLocaleLowerCase('nl'))));
  }
  app.startFlashcardSession(eligible,['nl-jp']);
  assert.deepEqual([...new Set(state.flashcardSession.queue.map(item=>item.direction))],['nl-jp']);
  const card=app.vocabById[state.flashcardSession.queue[0].cardId];
  state.flashcardSession.revealed=true;
  app.flashcardRate('knew',card.kana);
  app.flashcardRate('knew',card.kana);
  assert.equal(state.flashcardProgress.cards[`${card.id}::nl-jp`].repetitions,1);
  assert.equal(state.flashcardProgress.cards[`${card.id}::jp-nl`],undefined);
});

test('Fresh profiles cannot build Recall questions from future vocabulary',()=>{
  const app=createRecallApp(),{state}=app,card=app.vocabCatalog.find(v=>!v.legacy&&!state.introducedVocabIds.includes(v.id));
  assert.ok(card);
  assert.equal(state.introducedVocabIds.length,0);
  assert.deepEqual(JSON.parse(JSON.stringify(app.flashcardAnswerChoices(card,'jp-nl'))),[]);
  assert.deepEqual(JSON.parse(JSON.stringify(app.flashcardAnswerChoices(card,'nl-jp'))),[]);
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
  assert.equal(app.flashcardAnswerFeedbackText(incorrect),'Niet goed\nJuiste antwoord: lied');
  const correct=app.flashcardAnswerFeedback(choices,correctAnswers,{chosen:'lied',grade:'knew'});
  assert.deepEqual(choices.map(answer=>app.flashcardAnswerState(answer,correct)),['neutral','correct','neutral','neutral']);
  assert.equal(app.flashcardAnswerFeedbackText(correct),'Goed!');
  const freeIncorrect=app.flashcardAnswerFeedback(choices,correctAnswers,{chosen:'muziekstuk',grade:'viewed',ungraded:true});
  assert.deepEqual(choices.map(answer=>app.flashcardAnswerState(answer,freeIncorrect)),['incorrect','correct','neutral','neutral']);
});

test('Recall dashboard identifies the earliest future due time from eligible cards only',()=>{
  const app=createRecallApp(),{state}=app,[first,second,preview]=app.vocabCatalog.filter(v=>!v.legacy);
  const now=Date.now(),soon=now+2*60*60*1000,later=now+5*60*60*1000;
  state.introducedVocabIds=[first.id,second.id];
  state.flashcardProgress.cards[`${first.id}::jp-nl`]={dueAt:later,repetitions:1};
  state.flashcardProgress.cards[`${second.id}::jp-nl`]={dueAt:soon,repetitions:1};
  state.flashcardProgress.cards[`${preview.id}::jp-nl`]={dueAt:now+60*60*1000,repetitions:1};
  assert.equal(app.getNextRecallDueAt([first,second],['jp-nl'],now),soon);
  assert.equal(app.getNextRecallDueAt([first,second],['jp-nl'],soon),later,'a card is due exactly at dueAt');
  assert.equal(app.getNextRecallDueAt([first,second],['jp-nl'],later),null);
  app.renderFlashcardsScreen();
  assert.match(app.viewMarkup(),/Volgende herhaling:/);
  assert.match(app.viewMarkup(),/Volgende herhaling: <strong>[^<]+<\/strong>/);
});

test('Recall dashboard refreshes due status periodically and on focus or visibility return',()=>{
  const now=new Date(2026,2,20,12).getTime(),app=createRecallApp({now}),{state}=app,[card]=app.vocabCatalog.filter(v=>!v.legacy);
  app.enableRender();
  const dueAt=now+30000;
  state.screen='flashcards';state.introducedVocabIds=[card.id];
  state.flashcardProgress.cards[`${card.id}::jp-nl`]={dueAt,repetitions:1};
  app.renderFlashcardsScreen();
  assert.deepEqual(app.intervalDelays(),[60000]);
  assert.match(app.viewMarkup(),/Later gepland/);
  assert.equal(state.screen,'flashcards');assert.equal(state.flashcardSession,null);
  app.setNow(dueAt);assert.equal(app.flashcardCounts().due,1,'dueAt equality is due');app.fireInterval();
  assert.match(app.viewMarkup(),/<strong>1<\/strong><span>Aan de beurt/);
  assert.match(app.viewMarkup(),/Start geplande herhaling/);
  app.setNow(dueAt+60000);app.fireWindowEvent('focus');
  assert.match(app.viewMarkup(),/Aan de beurt/);
  app.setNow(dueAt+120000);app.fireDocumentEvent('visibilitychange');
  assert.match(app.viewMarkup(),/Aan de beurt/);
  assert.deepEqual(app.intervalDelays(),[60000],'rerendering does not install duplicate refresh timers');
});

test('Recall options reveal without selecting and reset for the next card',()=>{
  const app=createRecallApp(),{state}=app,[first,second]=app.vocabCatalog.filter(v=>!v.legacy);
  state.flashcardSession={mode:'scheduled',queue:[{cardId:first.id,direction:'jp-nl'},{cardId:second.id,direction:'nl-jp'}],position:0,status:'active',revealed:false,optionsRevealed:false,knew:0,again:0,skipped:0,requeued:[],feedback:null};
  app.revealFlashcardOptions();
  assert.equal(state.flashcardSession.optionsRevealed,true);
  assert.equal(state.flashcardSession.feedback,null,'the reveal tap does not submit an answer');
  app.revealFlashcardOptions();
  assert.equal(state.flashcardSession.optionsRevealed,true,'the same card stays revealed');
  app.flashcardSkip();
  assert.equal(state.flashcardSession.position,1);
  assert.equal(state.flashcardSession.optionsRevealed,false,'the next card starts blurred again');
});

test('Recall keeps a revealed card revealed after reload and exposes a labeled reveal control',()=>{
  const app=createRecallApp({savedState:{flashcardSession:{queue:[],position:0,status:'paused',optionsRevealed:true}}});
  assert.equal(app.state.flashcardSession.optionsRevealed,true);
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.match(html,/\.flashcard-answer-options\.is-hidden \.flashcard-answer-choice\{filter:blur\(7px\)/);
  assert.match(html,/reveal\.textContent='Tik om te tonen'/);
  assert.match(html,/reveal\.setAttribute\('aria-label','Tik om antwoordopties te tonen'\)/);
  assert.match(html,/querySelector\('\.flashcard-avatar'\)\?\.remove\(\)/,'the prompt is not preceded by an extra avatar message');
  assert.match(html,/querySelector\('\.flashcard-face-sub'\)\?\.remove\(\)/,'Recall removes the redundant direction hint from the rendered card');
});
