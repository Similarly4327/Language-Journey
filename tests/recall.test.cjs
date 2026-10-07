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
    setAttribute(){},getAttribute(){return null},removeAttribute(){},appendChild(){},insertBefore(){},prepend(){},remove(){},addEventListener(){},querySelector(){return fakeElement()},querySelectorAll(){return []},scrollIntoView(){},focus(){},getBoundingClientRect(){return{width:300,height:200,top:0,left:0}}};
}

function createRecallApp({isolateEligibility=false,savedState={},savedRanks={},savedVersion=6,now=new Date(2026,2,20,12).getTime()}={}){
  const clock={now};
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const inline=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/\}\)\(\);\s*$/,`const recallRenderFlashcardsScreen=renderFlashcardsScreen;${isolateEligibility?"flashcardEligible=card=>!!card&&!card.legacy&&(state.introducedVocabIds.includes(card.id)||rankIntroducedWord(card)||flashcardHasReviewHistory(card.id));":""}globalThis.__probe={state,rankState,vocabCatalog,vocabById,flashcardDue,flashcardDueText,flashcardNextDueAt,flashcardCounts,flashcardSelectedCards,flashcardDirections,getNextRecallDueAt,flashcardAnswerChoices,flashcardQuestionIsValid,flashcardAnswerFeedback,flashcardAnswerState,flashcardAnswerFeedbackText,flashcardRate,flashcardSkip,flashcardNextCard,revealFlashcardOptions,startFlashcardSession,pauseFlashcardSession,resumeFlashcardSession,recordVocabEncounter,renderFlashcardsScreen,registeredAudioAsset,speakerButtonHtml,audioOverlayPlacement,show,viewMarkup(){return $('flashcardView').innerHTML},setNow(value){clock.now=value},enableRender(){renderFlashcardsScreen=recallRenderFlashcardsScreen},disableRender(){renderFlashcardsScreen=()=>{}}};})();`);
  const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,fakeElement(id));return elements.get(id)};
  const document={body:fakeElement('body'),documentElement:fakeElement('html'),hidden:false,getElementById:get,createElement:()=>fakeElement(),querySelectorAll:()=>[],querySelector:()=>fakeElement(),addEventListener(){}};
  const storage=new Map();
  storage.set('taal-japanse-leerapp-v1',JSON.stringify({version:savedVersion,state:savedState,ranks:savedRanks}));
  const localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
  const documentListeners=new Map(),windowListeners=new Map(),intervals=[],windowTimeouts=[],clearedWindowTimeouts=[];
  const addListener=(listeners,type,callback)=>{if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(callback)};
  const NativeDate=Date;
  class FixedDate extends NativeDate{constructor(...args){super(...(args.length?args:[clock.now]))}static now(){return clock.now}}
  const window={LanguageJourneyContent:content,innerWidth:390,innerHeight:844,scrollTo(){},addEventListener:(type,callback)=>addListener(windowListeners,type,callback),setInterval:(callback,delay)=>{intervals.push({callback,delay});return intervals.length},setTimeout:(callback,delay)=>{windowTimeouts.push({callback,delay});return windowTimeouts.length},clearTimeout:id=>clearedWindowTimeouts.push(id),matchMedia:()=>({matches:false,addEventListener(){}})};
  document.addEventListener=(type,callback)=>addListener(documentListeners,type,callback);
  const context={document,window,localStorage,location:{hash:''},clock,performance:{now:()=>0},navigator:{},console,setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(){},structuredClone,URL,Date:FixedDate,Math,Intl,alert(){},Image:class{}};
  for(const [,relative] of html.matchAll(/<script src="\.\/([^"?]+)(?:\?[^"]*)?"><\/script>/g)){
    if(relative==='language-journey-content/content.js')continue;
    vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',relative),'utf8'),context,{timeout:5000});
  }
  vm.runInNewContext(inline.replace('globalThis.__probe={state,rankState,','globalThis.__probe={state,rankState,flashcardEligible,openDictionaryModal,closeDictionaryModal,scheduleRecallRetry,getRecallSession,startRecallSession,freePracticeCards,setFlashcardAuto,setFlashcardLessonSelection,introduceWordEntries,saveProgress,'),context,{timeout:5000});
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
  context.__probe.focusSelector=value=>{document.activeElement=value?{closest:()=>true}:null};
  return context.__probe;
}

// Existing SRS tests use a narrow synthetic word pool to isolate scheduling,
// direction and timer behavior. The curriculum gate is tested below without this fixture.
function createSrsFixture(options={}){return createRecallApp({...options,isolateEligibility:true})}

function localDay(date){return`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`}

test('mixed Recall uses both directions and writes only the answered direction across reload',()=>{
  const now=new Date(2026,9,7,12).getTime(),cards={'vocab-ねこ::jp-nl':{dueAt:now-1000,repetitions:2,intervalDays:3,lapses:1,lastReviewedAt:now-86400000,lastGrade:'knew'},'vocab-ねこ::nl-jp':{dueAt:now-500,repetitions:4,intervalDays:14,lapses:0,lastReviewedAt:now-86400000,lastGrade:'knew'}};
  const app=createSrsFixture({now,savedState:{introducedVocabIds:['vocab-ねこ'],flashcardSelection:{auto:false,lessonIds:[]},flashcardProgress:{cards}}});
  assert.equal(app.getRecallSession().counts.pool,1);
  assert.equal(app.getRecallSession().counts.due,2);
  const before=JSON.stringify(app.state.flashcardProgress.cards);app.startRecallSession();
  assert.equal(JSON.stringify(app.state.flashcardProgress.cards),before,'selection never writes scheduling');
  assert.deepEqual([...new Set(app.state.flashcardSession.queue.map(item=>item.direction))],['jp-nl','nl-jp']);
  app.state.flashcardSession.optionsRevealed=true;app.state.flashcardSession.revealed=true;app.flashcardRate('knew','kat');
  assert.equal(app.state.flashcardProgress.cards['vocab-ねこ::jp-nl'].intervalDays,7);
  assert.deepEqual(JSON.parse(JSON.stringify(app.state.flashcardProgress.cards['vocab-ねこ::nl-jp'])),cards['vocab-ねこ::nl-jp']);
  app.pauseFlashcardSession();const saved=app.savedProgress(),reloaded=createSrsFixture({now,savedVersion:saved.version,savedState:saved.state,savedRanks:saved.ranks});
  assert.equal(reloaded.state.flashcardSession.status,'paused');
  assert.deepEqual(JSON.parse(JSON.stringify(reloaded.state.flashcardProgress)),JSON.parse(JSON.stringify(app.state.flashcardProgress)));
  assert.deepEqual(JSON.parse(JSON.stringify(reloaded.state.flashcardSession.queue)),JSON.parse(JSON.stringify(app.state.flashcardSession.queue)));
  reloaded.resumeFlashcardSession();reloaded.flashcardNextCard();assert.equal(reloaded.state.flashcardSession.queue[reloaded.state.flashcardSession.position].direction,'nl-jp');
});

test('mixed Recall handles either due direction, future-only and new-only states',()=>{
  const now=new Date(2026,9,7,12).getTime();
  for(const dueDirection of ['jp-nl','nl-jp',null]){
    const cards={};for(const direction of ['jp-nl','nl-jp'])cards[`vocab-ねこ::${direction}`]={dueAt:direction===dueDirection?now:now+(direction==='jp-nl'?50:190)*60000,repetitions:3,intervalDays:7};
    const app=createSrsFixture({now,savedState:{introducedVocabIds:['vocab-ねこ'],flashcardProgress:{cards}}}),result=app.getRecallSession();
    assert.deepEqual(Array.from(result.queue,item=>item.direction),dueDirection?[dueDirection]:[]);
    assert.equal(result.nextSuggestedSessionAt,dueDirection==='jp-nl'?now+190*60000:now+50*60000);
    app.renderFlashcardsScreen();assert.equal((app.viewMarkup().match(/Volgende geadviseerde sessie vanaf/g)||[]).length,1);
    assert.match(app.viewMarkup(),/Vrij oefenen/);
    if(!dueDirection){assert.match(app.viewMarkup(),/Nu niets aan de beurt/);assert.match(app.viewMarkup(),/disabled>Start Recall/)}
  }
  const app=createSrsFixture({now,savedState:{introducedVocabIds:['vocab-ねこ']}});app.renderFlashcardsScreen();
  assert.equal(app.getRecallSession().queue.length,2);assert.match(app.viewMarkup(),/nieuwe kaarten staan klaar/);
});

test('140-word Recall pool stays bounded, prioritizes due cards and never schedules future cards',()=>{
  const now=new Date(2026,9,7,12).getTime(),app=createSrsFixture({now}),words=app.vocabCatalog.filter(word=>!word.legacy).slice(0,140);
  app.state.introducedVocabIds=words.map(word=>word.id);
  const fresh=app.getRecallSession();assert.equal(fresh.counts.pool,140);assert.equal(fresh.queue.length,20);assert.equal(new Set(fresh.queue.map(item=>`${item.cardId}::${item.direction}`)).size,20);
  for(const word of words.slice(0,40))for(const direction of ['jp-nl','nl-jp'])app.state.flashcardProgress.cards[`${word.id}::${direction}`]={dueAt:now-1000,repetitions:2,intervalDays:3};
  for(const word of words.slice(40,60))for(const direction of ['jp-nl','nl-jp'])app.state.flashcardProgress.cards[`${word.id}::${direction}`]={dueAt:now+3600000,repetitions:4,intervalDays:14};
  const before=JSON.stringify(app.state.flashcardProgress.cards),result=app.getRecallSession();
  assert.equal(result.queue.length,40);assert.ok(result.queue.every(item=>words.slice(0,40).some(word=>word.id===item.cardId)));
  assert.ok(result.queue.some(item=>item.direction==='jp-nl')&&result.queue.some(item=>item.direction==='nl-jp'));
  const weak=words[39];app.state.flashcardProgress.cards[`${weak.id}::jp-nl`].repetitions=0;
  assert.equal(app.getRecallSession().queue[0].cardId,weak.id,'weak due knowledge gets priority');
  app.state.flashcardProgress.cards[`${weak.id}::jp-nl`].repetitions=2;
  assert.equal(JSON.stringify(app.state.flashcardProgress.cards),before);
  app.startRecallSession();assert.equal(app.state.flashcardSession.queue.length,40);assert.equal(JSON.stringify(app.state.flashcardProgress.cards),before);
});

test('free practice retains manual filters independently of automatic Recall and never reschedules',()=>{
  const now=new Date(2026,9,7,12).getTime(),cards={'vocab-ねこ::jp-nl':{dueAt:now+3600000,repetitions:4,intervalDays:14,lapses:0,lastReviewedAt:now-86400000,lastGrade:'knew'}},app=createSrsFixture({now,savedState:{introducedVocabIds:['vocab-ねこ','vocab-にがつ'],flashcardSelection:{auto:true,lessonIds:['l4-1'],direction:'nl-jp'},flashcardProgress:{cards}}});
  assert.deepEqual(app.freePracticeCards().map(word=>word.id),['vocab-ねこ']);assert.equal(app.getRecallSession().counts.pool,2);
  app.renderFlashcardsScreen();assert.match(app.scopeMarkup(),/data-fc-lesson="l4-1" checked/);assert.match(app.scopeMarkup(),/value="nl-jp" selected/);
  app.startFlashcardSession(app.freePracticeCards(),['nl-jp'],'free');app.state.flashcardSession.feedback={grade:'viewed',chosen:'ねこ',ungraded:true};app.flashcardNextCard();
  assert.deepEqual(JSON.parse(JSON.stringify(app.state.flashcardProgress.cards)),cards);
  app.setFlashcardLessonSelection([]);assert.equal(app.freePracticeCards().length,0);assert.equal(app.getRecallSession().counts.pool,2);
  const saved=app.savedProgress(),reloaded=createSrsFixture({now,savedVersion:saved.version,savedState:saved.state});assert.equal(reloaded.freePracticeCards().length,0);assert.equal(reloaded.state.flashcardSelection.direction,'nl-jp');
});

test('SRS fixture respects available word scope, never unlocked or selected levels',()=>{
  const app=createSrsFixture({savedVersion:8,savedState:{level:8,unlockedAvatarSkins:['skin-9'],introducedVocabIds:['vocab-ねこ'],flashcardSelection:{auto:true,lessonIds:['l9-1'],direction:'jp-nl'}},savedRanks:{'l7-1':{rank:'Copper'}}});
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
    const app=createSrsFixture({savedVersion:8,savedState:{flashcardSelection:{lessonIds,direction:'nl-jp'}}});
    assert.equal(app.state.flashcardSelection.auto,false);
    assert.deepEqual(Array.from(app.state.flashcardSelection.lessonIds),lessonIds);
    assert.equal(app.state.flashcardSelection.direction,'nl-jp');
  }
  assert.equal(createSrsFixture().state.flashcardSelection.auto,true);
  assert.equal(createSrsFixture({savedState:{flashcardSelection:{lessonIds:null}}}).state.flashcardSelection.auto,true);
});

test('manual scope survives Auto changes, later learning and reload with both SRS directions intact',()=>{
  const records={'vocab-ねこ::jp-nl':{dueAt:1900000000000,intervalDays:7,repetitions:3,lapses:1,lastReviewedAt:1800000000000,lastGrade:'knew'},'vocab-ねこ::nl-jp':{dueAt:1900100000000,intervalDays:3,repetitions:2,lapses:2,lastReviewedAt:1800100000000,lastGrade:'again'}};
  const app=createSrsFixture({savedVersion:8,savedState:{introducedVocabIds:['vocab-ねこ'],flashcardProgress:{version:1,cards:records}}});
  app.setFlashcardAuto(false);
  assert.deepEqual(Array.from(app.state.flashcardSelection.lessonIds),['l4-1'],'first manual selection captures currently available lessons');
  const later=app.vocabCatalog.find(word=>word.lessonId==='l8-1');app.introduceWordEntries([later]);
  assert.ok(!app.flashcardSelectedCards().some(word=>word.id===later.id),'manual pool stays targeted as progress grows');
  app.setFlashcardAuto(true);
  assert.ok(app.flashcardSelectedCards().some(word=>word.id===later.id));
  assert.deepEqual(Array.from(app.state.flashcardSelection.lessonIds),['l4-1']);
  const saved=app.savedProgress(),reloaded=createSrsFixture({savedVersion:saved.version,savedState:saved.state,savedRanks:saved.ranks});
  assert.equal(reloaded.state.flashcardSelection.auto,true);
  assert.ok(reloaded.flashcardSelectedCards().some(word=>word.id===later.id));
  reloaded.setFlashcardAuto(false);
  assert.deepEqual(Array.from(reloaded.state.flashcardSelection.lessonIds),['l4-1']);
  assert.ok(!reloaded.flashcardSelectedCards().some(word=>word.id===later.id));
  assert.deepEqual(JSON.parse(JSON.stringify(reloaded.state.flashcardProgress.cards)),records);
  const manualSaved=reloaded.savedProgress(),manualReload=createSrsFixture({savedVersion:manualSaved.version,savedState:manualSaved.state});
  assert.equal(manualReload.state.flashcardSelection.auto,false);
  assert.deepEqual(Array.from(manualReload.state.flashcardSelection.lessonIds),['l4-1']);
  assert.deepEqual(JSON.parse(JSON.stringify(manualReload.state.flashcardProgress.cards)),records);
  manualReload.startFlashcardSession(manualReload.flashcardSelectedCards(),['nl-jp'],'free');
  const session=manualReload.state.flashcardSession;session.revealed=true;manualReload.flashcardRate('knew');
  assert.deepEqual(JSON.parse(JSON.stringify(manualReload.state.flashcardProgress.cards)),records,'free practice leaves both direction schedules unchanged');
});

test('manual selection stores exact available lesson IDs rather than a future all-lessons wildcard',()=>{
  const app=createSrsFixture({savedState:{introducedVocabIds:['vocab-ねこ']}});app.setFlashcardAuto(false);app.setFlashcardLessonSelection(['l4-1','l4-1']);
  assert.deepEqual(Array.from(app.state.flashcardSelection.lessonIds),['l4-1']);
  app.setFlashcardLessonSelection([]);app.setFlashcardAuto(true);app.setFlashcardAuto(false);
  assert.equal(app.flashcardSelectedCards().length,0,'an intentionally empty manual selection remains empty');
  assert.deepEqual(Array.from(app.state.flashcardSelection.lessonIds),[]);
});

test('Recall distinguishes no learned words from an empty manual pool and hides unavailable choices',()=>{
  const app=createSrsFixture();app.renderFlashcardsScreen();
  assert.match(app.viewMarkup(),/Je hebt nog geen woorden vrijgespeeld/);
  assert.match(app.viewMarkup(),/summary aria-label="Hoe werkt Recall\?"/);
  assert.match(app.viewMarkup(),/id="flashcardScope"/);
  const card=app.vocabCatalog.find(word=>word.id==='vocab-ねこ');app.introduceWordEntries([card]);app.setFlashcardAuto(false);app.setFlashcardLessonSelection([]);app.renderFlashcardsScreen();
  const markup=app.viewMarkup();assert.match(markup,/1 woorden in Recall-pool/);
  assert.match(markup,/id="recallCustom"/);assert.match(app.scopeMarkup(),/0 woorden in je oefenselectie/);
  assert.match(app.scopeMarkup(),/Je selectie bevat geen beschikbare woorden/);
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
    const app=createSrsFixture();
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
  const app=createSrsFixture({savedState:{introducedVocabIds:[id],flashcardProgress:{version:1,cards:{[`${id}::jp-nl`]:{dueAt,intervalDays:3,repetitions:2,lapses:1,lastReviewedAt,lastGrade:'knew'}}},flashcardSession:{queue:[{cardId:id,direction:'jp-nl'}],position:0,status:'paused',knew:1,again:0}}});
  assert.deepEqual(JSON.parse(JSON.stringify(app.state.flashcardProgress.cards[`${id}::jp-nl`])),{dueAt,intervalDays:3,repetitions:2,lapses:1,lastReviewedAt,lastGrade:'knew'});
  assert.equal(app.state.flashcardSession.mode,'scheduled');
  assert.equal(app.state.flashcardSession.status,'paused');
  assert.equal(app.state.flashcardSession.position,0);
  assert.equal(app.state.flashcardSession.knew,1);
});

test('Bare legacy Recall records migrate to Japanese → Dutch without replacing explicit history',()=>{
  const id='vocab-ねこ',bareId='vocab-いぬ',legacy={dueAt:12345,intervalDays:7,repetitions:4,lapses:1,lastReviewedAt:2345,lastGrade:'again'},explicit={dueAt:54321,intervalDays:3,repetitions:2,lapses:0,lastReviewedAt:23456,lastGrade:'knew'};
  const app=createSrsFixture({savedState:{flashcardProgress:{cards:{[id]:legacy,[`${id}::jp-nl`]:explicit,[bareId]:legacy}}}});
  assert.deepEqual(JSON.parse(JSON.stringify(app.state.flashcardProgress.cards[`${id}::jp-nl`])),explicit);
  assert.equal(app.state.flashcardProgress.cards[`${id}::nl-jp`],undefined);
  assert.deepEqual(JSON.parse(JSON.stringify(app.state.flashcardProgress.cards[`${bareId}::jp-nl`])),legacy);
});

test('Good answers advance intervals while directions and duplicate clicks stay independent',()=>{
  const app=createSrsFixture(),{state}=app,[card]=app.vocabCatalog.filter(v=>!v.legacy);
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
  const app=createSrsFixture(),{state}=app,[first,second]=app.vocabCatalog.filter(v=>!v.legacy);
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
  const app=createSrsFixture(),{state}=app,[first,second,third]=app.vocabCatalog.filter(v=>!v.legacy);
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
  const app=createSrsFixture(),{state}=app,[first,second]=app.vocabCatalog.filter(v=>!v.legacy);
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
  const wrongApp=createSrsFixture(),wrongState=wrongApp.state,[wrongCard]=wrongApp.vocabCatalog.filter(v=>!v.legacy);
  wrongApp.enableRender();wrongState.screen='flashcards';wrongState.introducedVocabIds=[wrongCard.id];
  const choices=wrongApp.flashcardAnswerChoices(wrongCard,'jp-nl'),wrongChoice=choices.find(choice=>choice!==wrongCard.meaning);
  wrongState.flashcardSession={mode:'scheduled',queue:[{cardId:wrongCard.id,direction:'jp-nl'}],position:0,status:'active',revealed:false,optionsRevealed:true,knew:0,again:1,requeued:[],feedback:{grade:'again',chosen:wrongChoice,until:null}};
  wrongApp.renderFlashcardsScreen();
  assert.match(wrongApp.viewMarkup(),/Juiste antwoord:/);assert.ok(wrongApp.viewMarkup().includes(`data-dictionary-open="${wrongCard.id}"`));assert.ok(wrongApp.viewMarkup().includes(wrongCard.meaning));
  assert.equal(wrongApp.windowTimeouts().length,0,'wrong answers wait for a manual tap');
  wrongApp.flashcardNextCard();
  assert.equal(wrongState.flashcardSession.position,1,'the wrong answer advances only after manual next');
  assert.equal(wrongState.flashcardSession.status,'complete');

  const freeApp=createSrsFixture(),{state}=freeApp,[freeCard,nextCard]=freeApp.vocabCatalog.filter(v=>!v.legacy);
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
  const app=createSrsFixture(),{state}=app,[card]=app.vocabCatalog.filter(v=>!v.legacy);
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
  const app=createSrsFixture(),{state}=app,[a,b]=app.vocabCatalog.filter(v=>!v.legacy);
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
  const app=createSrsFixture(),{state}=app,future=app.vocabCatalog.find(v=>!v.legacy&&!state.introducedVocabIds.includes(v.id));
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
  const app=createSrsFixture();
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
  const app=createSrsFixture({now:new Date(2026,2,20,23,58).getTime()}),{state}=app,[card]=app.vocabCatalog.filter(v=>!v.legacy);
  state.flashcardSession={mode:'scheduled',queue:[{cardId:card.id,direction:'jp-nl'}],position:0,status:'active',revealed:true,knew:0,again:0,requeued:[],feedback:null,startedAt:Date.now()};
  state.introducedVocabIds=[card.id];
  const reviewedAt=new Date(2026,2,21,0,3).getTime();app.setNow(reviewedAt);
  app.flashcardRate('knew',card.meaning);
  const record=state.flashcardProgress.cards[`${card.id}::jp-nl`];
  assert.equal(record.lastReviewedAt,reviewedAt);
  assert.equal(localDay(new Date(record.dueAt)),localDay(new Date(2026,2,22,0,3)));
});

test('Recall keeps unique introduced-word counts separate from repeated SRS reviews',()=>{
  const app=createSrsFixture(),{state}=app,[card]=app.vocabCatalog.filter(v=>!v.legacy);
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
  const app=createSrsFixture(),{state}=app,[card,later]=app.vocabCatalog.filter(v=>!v.legacy);
  state.introducedVocabIds=[card.id,later.id];
  state.flashcardProgress.cards[`${card.id}::jp-nl`]={dueAt:new Date(2026,2,20,11).getTime(),intervalDays:1,repetitions:1,lapses:0,lastReviewedAt:new Date(2026,2,19,11).getTime(),lastGrade:'knew'};
  state.flashcardProgress.cards[`${later.id}::jp-nl`]={dueAt:new Date(2026,2,20,14).getTime(),intervalDays:1,repetitions:1,lapses:0,lastReviewedAt:new Date(2026,2,19,14).getTime(),lastGrade:'knew'};
  app.renderFlashcardsScreen();
  const markup=app.viewMarkup();
  assert.match(markup,/>Recall</);
  assert.match(markup,/id="fcStartRecall"/);
  assert.doesNotMatch(markup,/id="fcStartJpNl"|id="fcStartNlJp"/);
  assert.match(markup,/<span>Nieuw<\/span>/);
  assert.match(markup,/Aan de beurt/);
  assert.match(markup,/Later gepland/);
  assert.match(markup,/Start Recall/);
  assert.match(markup,/Vrij oefenen/);
  assert.doesNotMatch(markup,/id="fcAutoOn"|recall-direction/);
  assert.match(markup,/id="recallCustom"/,'manual scope belongs to the independent free practice block');
  assert.doesNotMatch(app.scopeMarkup(),/fcCustomStart|Start Recall|Aan de beurt/);
});

test('Recall rebuilds new cards from ranked Level 7, partial Level 8, and later lesson data',()=>{
  const ranks={'l7-1':{rank:'Copper',last:.8,attempts:1},'l8-2':{rank:'Silver',last:.9,attempts:2},'l12-3':{rank:'Gold',last:.95,attempts:3}},
    reviewedId='vocab-ひとつ',dueAt=new Date(2026,2,23,12).getTime(),savedState={flashcardProgress:{version:1,cards:{[`${reviewedId}::jp-nl`]:{dueAt,intervalDays:3,repetitions:2,lapses:0,lastReviewedAt:new Date(2026,2,20,12).getTime(),lastGrade:'knew'}}}},
    app=createSrsFixture({savedState,savedRanks:ranks}),expected=app.vocabCatalog.filter(word=>ranks[word.lessonId]?.rank);
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
  const reloaded=createSrsFixture({savedState:{introducedVocabIds:app.state.introducedVocabIds,flashcardProgress:savedState.flashcardProgress},savedRanks:ranks});
  assert.deepEqual(reloaded.flashcardSelectedCards().map(word=>word.id).sort(),expected.map(word=>word.id).sort(),'offline reload preserves the same unique eligible pool');
  assert.equal(reloaded.state.flashcardProgress.cards[`${reviewedId}::jp-nl`].dueAt,dueAt,'reload preserves the existing review due time');
});

test('SRS fixture preserves existing reviews when encounter flags are missing',()=>{
  const app=createSrsFixture(),{state}=app,card=app.vocabCatalog.find(v=>!v.legacy&&!state.introducedVocabIds.includes(v.id));
  assert.ok(card);
  assert.ok(!app.flashcardSelectedCards().some(v=>v.id===card.id));
  state.flashcardProgress.cards[`${card.id}::jp-nl`]={dueAt:Date.now()-1,intervalDays:1,repetitions:1,lapses:0,lastReviewedAt:Date.now()-86400000,lastGrade:'knew'};
  assert.ok(app.flashcardSelectedCards().some(v=>v.id===card.id));
});

test('Dutch to Japanese choices do not offer another word with the same Dutch meaning',()=>{
  const app=createSrsFixture(),{state}=app,women=app.vocabCatalog.filter(v=>!v.legacy&&v.meaning==='vrouw');
  assert.equal(women.length,2);
  state.introducedVocabIds.push(...women.map(v=>v.id));
  for(const card of women){
    const other=women.find(v=>v.id!==card.id);
    for(let repeat=0;repeat<30;repeat++)assert.ok(!app.flashcardAnswerChoices(card,'nl-jp').includes(other.kana));
  }
});

test('A Dutch → Japanese session uses only eligible kana choices and records only reverse reviews once',()=>{
  const app=createSrsFixture(),{state}=app;
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
  const app=createSrsFixture(),{state}=app,card=app.vocabCatalog.find(v=>!v.legacy&&!state.introducedVocabIds.includes(v.id));
  assert.ok(card);
  assert.equal(state.introducedVocabIds.length,0);
  assert.deepEqual(JSON.parse(JSON.stringify(app.flashcardAnswerChoices(card,'jp-nl'))),[]);
  assert.deepEqual(JSON.parse(JSON.stringify(app.flashcardAnswerChoices(card,'nl-jp'))),[]);
  assert.equal(state.introducedVocabIds.length,0);
  assert.equal(Object.keys(state.flashcardProgress.cards).length,0);
});

test('Recall answer feedback marks wrong, correct, and remaining options consistently',()=>{
  const app=createSrsFixture();
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
  const app=createSrsFixture(),{state}=app,[first,second,preview]=app.vocabCatalog.filter(v=>!v.legacy);
  const now=Date.now(),soon=now+2*60*60*1000,later=now+5*60*60*1000;
  state.introducedVocabIds=[first.id,second.id];
  state.flashcardProgress.cards[`${first.id}::jp-nl`]={dueAt:later,repetitions:1};
  state.flashcardProgress.cards[`${second.id}::jp-nl`]={dueAt:soon,repetitions:1};
  state.flashcardProgress.cards[`${preview.id}::jp-nl`]={dueAt:now+60*60*1000,repetitions:1};
  assert.equal(app.getNextRecallDueAt([first,second],['jp-nl'],now),soon);
  assert.equal(app.getNextRecallDueAt([first,second],['jp-nl'],soon),later,'a card is due exactly at dueAt');
  assert.equal(app.getNextRecallDueAt([first,second],['jp-nl'],later),null);
  app.renderFlashcardsScreen();
  assert.equal((app.viewMarkup().match(/Volgende geadviseerde sessie vanaf/g)||[]).length,1);
});

test('Recall dashboard refreshes due status periodically and on focus or visibility return',()=>{
  const now=new Date(2026,2,20,12).getTime(),app=createSrsFixture({now}),{state}=app,[card]=app.vocabCatalog.filter(v=>!v.legacy);
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
  assert.match(app.viewMarkup(),/Start Recall/);
  app.setNow(dueAt+60000);app.fireWindowEvent('focus');
  assert.match(app.viewMarkup(),/Aan de beurt/);
  app.setNow(dueAt+120000);app.fireDocumentEvent('visibilitychange');
  assert.match(app.viewMarkup(),/Aan de beurt/);
  assert.deepEqual(app.intervalDelays(),[60000],'rerendering does not install duplicate refresh timers');
});

test('Recall options reveal without selecting and reset for the next card',()=>{
  const app=createSrsFixture(),{state}=app,[first,second]=app.vocabCatalog.filter(v=>!v.legacy);
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

test('periodic Recall refresh does not replace a focused manual or info control',()=>{
  const now=new Date(2026,9,7,12).getTime(),app=createSrsFixture({now,savedState:{introducedVocabIds:['vocab-ねこ'],flashcardProgress:{cards:{'vocab-ねこ::jp-nl':{dueAt:now+1000,repetitions:1},'vocab-ねこ::nl-jp':{dueAt:now+2000,repetitions:1}}}}});
  app.enableRender();app.state.screen='flashcards';app.renderFlashcardsScreen();const before=app.viewMarkup();
  app.focusSelector(true);app.setNow(now+1000);app.fireInterval();assert.equal(app.viewMarkup(),before,'keyboard/touch interaction is not interrupted');
  app.focusSelector(false);app.fireInterval();assert.notEqual(app.viewMarkup(),before);assert.match(app.viewMarkup(),/<strong>1<\/strong><span>Aan de beurt/);
});

test('Recall keeps a revealed card revealed after reload and exposes a labeled reveal control',()=>{
  const app=createSrsFixture({savedState:{flashcardSession:{queue:[],position:0,status:'paused',optionsRevealed:true}}});
  assert.equal(app.state.flashcardSession.optionsRevealed,true);
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.match(html,/\.flashcard-answer-options\.is-hidden \.flashcard-answer-choice\{filter:blur\(7px\)/);
  assert.match(html,/reveal\.textContent='Tik om te tonen'/);
  assert.match(html,/reveal\.setAttribute\('aria-label','Tik om antwoordopties te tonen'\)/);
  assert.match(html,/querySelector\('\.flashcard-avatar'\)\?\.remove\(\)/,'the prompt is not preceded by an extra avatar message');
  assert.match(html,/querySelector\('\.flashcard-face-sub'\)\?\.remove\(\)/,'Recall removes the redundant direction hint from the rendered card');
});

// Real curriculum integration: no synthetic eligibility override.
test('Recall Copper gate rejects unopened, seen, partial and historical-only words',()=>{
 const app=createRecallApp(),card=app.vocabById['vocab-ねこ'];
 assert.equal(app.flashcardEligible(card),false);
 app.introduceWordEntries([card]);app.state.langStepProgress[card.lessonId]=['words','model'];
 assert.equal(app.flashcardEligible(card),false);
 app.state.flashcardProgress.cards[`${card.id}::jp-nl`]={dueAt:0,repetitions:7,intervalDays:60};
 const history=JSON.stringify(app.state.flashcardProgress.cards);
 assert.equal(app.getRecallSession().counts.pool,0);assert.equal(app.freePracticeCards().length,0);
 for(const rank of ['Copper','Silver','Gold','Platinum']){app.rankState[card.lessonId].rank=rank;assert.equal(app.flashcardEligible(card),true)}
 assert.equal(JSON.stringify(app.state.flashcardProgress.cards),history);
});
test('level exam unlocks exactly its sourced core vocabulary, never a following level',()=>{
 const app=createRecallApp();app.rankState['l9-exam'].rank='Copper';
 const expected=app.vocabCatalog.filter(w=>w.level===9&&w.recallCore&&w.sourceFound&&!w.legacy);
 assert.deepEqual(Array.from(app.flashcardSelectedCards(),w=>w.id).sort(),expected.map(w=>w.id).sort());
 assert.ok(!app.flashcardSelectedCards().some(w=>w.level===10));
 for(const w of expected)assert.equal(app.rankState[w.lessonId].rank,null);
});
test('context, orphan and invalid central entries cannot enter any Recall pool',()=>{
 const app=createRecallApp();for(const record of Object.values(app.rankState))record.rank='Platinum';
 for(const card of app.vocabCatalog){if(card.legacy||!card.recallCore||!card.sourceFound)assert.equal(app.flashcardEligible(card),false)}
 const card=app.flashcardSelectedCards()[0];assert.ok(card);
 assert.equal(app.flashcardEligible({...card,coreOrContext:'context',recallCore:false}),false);
 assert.equal(app.flashcardEligible({...card,id:'orphan'}),false);
 assert.ok(app.getRecallSession().queue.every(item=>app.flashcardEligible(app.vocabById[item.cardId])));
});
test('all active Recall entries have exact central source metadata and stable Dictionary IDs',()=>{
 const app=createRecallApp();for(const record of Object.values(app.rankState))record.rank='Copper';
 const words=app.flashcardSelectedCards();assert.ok(words.length>200);
 for(const w of words){const lesson=content.manifest.lessons.find(l=>l.id===w.lessonId);assert.ok(lesson,w.id);assert.equal(lesson.level,w.level);assert.ok(w.introducedAt===`${lesson.level}-${lesson.order}`||w.introducedAt.startsWith(`${lesson.level}-${lesson.order}-`));assert.ok([...(lesson.wordIds||[]),...(lesson.exampleIds||[])].includes(w.id));assert.equal(app.vocabById[w.id],w)}
 assert.equal(app.vocabById['vocab-やさい'].lessonId,'l11-1');assert.equal(app.vocabById['vocab-やさい'].level,15);
 assert.equal(app.vocabById['vocab-レベル'].lessonId,'l11-home-1');
});
test('hidden old review history survives reload and reappears only after legitimate completion',()=>{
 const id='vocab-やさい',cards={[`${id}::jp-nl`]:{dueAt:123,repetitions:5,intervalDays:30,lapses:2,lastReviewedAt:100,lastGrade:'knew'}};
 const app=createRecallApp({savedState:{introducedVocabIds:[id],flashcardProgress:{cards}}});
 assert.equal(app.flashcardEligible(app.vocabById[id]),false);assert.equal(app.getRecallSession().counts.due,0);
 const saved=app.savedProgress(),reloaded=createRecallApp({savedState:saved.state,savedRanks:saved.ranks,savedVersion:saved.version});
 assert.deepEqual(JSON.parse(JSON.stringify(reloaded.state.flashcardProgress.cards)),cards);
 reloaded.rankState[reloaded.vocabById[id].lessonId].rank='Copper';
 assert.ok(reloaded.getRecallSession().queue.some(item=>item.cardId===id&&item.direction==='jp-nl'));
});
test('saved interrupted queues and direct rating cannot bypass the Copper gate',()=>{
 const app=createRecallApp({savedState:{flashcardSession:{mode:'scheduled',queue:[{cardId:'vocab-やさい',direction:'jp-nl'}],position:0,status:'active',revealed:true,knew:0,again:0,requeued:[]}}});
 app.flashcardRate('knew','groente');assert.equal(Object.keys(app.state.flashcardProgress.cards).length,0);
 app.enableRender();app.renderFlashcardsScreen();assert.equal(app.state.flashcardSession.status,'complete');
});
test('retries have distance, are limited to two, and never repeat a lone word',()=>{
 const app=createRecallApp(),words=app.vocabCatalog.filter(w=>w.recallCore&&w.sourceFound).slice(0,15),item={cardId:words[0].id,direction:'jp-nl'};
 const s={position:0,requeued:[],queue:words.map(w=>({cardId:w.id,direction:'jp-nl'}))},key=`${item.cardId}::jp-nl`;
 app.scheduleRecallRetry(s,item,key);const at=s.queue.findIndex((q,i)=>i>0&&q.cardId===item.cardId);assert.ok(at>=6&&at<=11);
 s.position=at;app.scheduleRecallRetry(s,item,key);app.scheduleRecallRetry(s,item,key);assert.ok(s.requeued.length<=2);
 const lone={position:0,requeued:[],queue:[item]};app.scheduleRecallRetry(lone,item,key);assert.equal(lone.queue.length,1);
 for(let i=1;i<s.queue.length;i++)assert.notEqual(s.queue[i].cardId,s.queue[i-1].cardId);
});
test('Dictionary from Recall preserves card, scheduling and ranks and cancels automatic advance',()=>{
 const app=createRecallApp({savedRanks:{'l4-1':{rank:'Copper'}}}),card=app.vocabById['vocab-ねこ'];
 app.state.screen='flashcards';app.state.flashcardSession={mode:'scheduled',queue:[{cardId:card.id,direction:'jp-nl'}],position:0,status:'active',revealed:true,optionsRevealed:true,knew:0,again:0,requeued:[],feedback:null};
 app.enableRender();app.flashcardRate('knew',card.meaning);
 const before=JSON.stringify({cards:app.state.flashcardProgress.cards,ranks:app.rankState,session:app.state.flashcardSession,ids:app.state.introducedVocabIds});
 const timeout=app.windowTimeouts().at(-1);app.openDictionaryModal(card.id,card.lessonId);timeout.callback();
 assert.equal(JSON.stringify({cards:app.state.flashcardProgress.cards,ranks:app.rankState,session:app.state.flashcardSession,ids:app.state.introducedVocabIds}),before);
 app.closeDictionaryModal();assert.equal(app.state.flashcardSession.position,0);assert.equal(app.state.flashcardSession.feedback.chosen,card.meaning);
 assert.match(app.viewMarkup(),/data-dictionary-open="vocab-ねこ"/);assert.match(app.viewMarkup(),/Geïntroduceerd in Level 4/);
});


test('eligible word counts and per-direction reviews remain independent under the real gate',()=>{
 const app=createRecallApp({savedRanks:{'l4-1':{rank:'Copper'}}}),card=app.vocabById['vocab-ねこ'],now=Date.now();
 const count=app.flashcardSelectedCards().length;assert.equal(app.getRecallSession().counts.pool,count);
 app.state.flashcardProgress.cards[`${card.id}::jp-nl`]={dueAt:0,repetitions:2,intervalDays:3};app.state.flashcardProgress.cards[`${card.id}::nl-jp`]={dueAt:0,repetitions:4,intervalDays:14};
 const reverse=JSON.stringify(app.state.flashcardProgress.cards[`${card.id}::nl-jp`]);
 app.state.flashcardSession={mode:'scheduled',queue:[{cardId:card.id,direction:'jp-nl'}],position:0,status:'active',revealed:true,knew:0,again:0,requeued:[],feedback:null};app.flashcardRate('knew','kat');
 assert.equal(JSON.stringify(app.state.flashcardProgress.cards[`${card.id}::nl-jp`]),reverse);assert.equal(app.getRecallSession().counts.pool,count);assert.equal(app.state.flashcardSession.queue.length,1);
});
test('resumed answer choices are rebuilt if an old session contains future distractors',()=>{
 const app=createRecallApp({savedRanks:{'l4-1':{rank:'Copper'}}});app.state.screen='flashcards';
 app.state.flashcardSession={mode:'scheduled',queue:[{cardId:'vocab-ねこ',direction:'nl-jp',answerChoices:['ねこ','やさい','ホテル']}],position:0,status:'active',revealed:false,knew:0,again:0,requeued:[],feedback:null};
 app.enableRender();app.renderFlashcardsScreen();const choices=app.state.flashcardSession.queue[0].answerChoices;
 assert.ok(!choices.includes('やさい')&&!choices.includes('ホテル'));assert.ok(choices.includes('ねこ'));
});

 test('old pending queues lose accidental duplicates without merging translation directions',()=>{
 const app=createRecallApp({savedRanks:{'l4-1':{rank:'Copper'}}});app.enableRender();app.state.screen='flashcards';
 const cardId='vocab-ねこ';app.state.flashcardSession={mode:'scheduled',queue:[{cardId,direction:'jp-nl'},{cardId,direction:'jp-nl'},{cardId,direction:'nl-jp'}],position:0,status:'active',revealed:false,knew:0,again:0,requeued:[],feedback:null};
 app.renderFlashcardsScreen();assert.equal(app.state.flashcardSession.queue.length,2);assert.deepEqual(Array.from(app.state.flashcardSession.queue,item=>item.direction),['jp-nl','nl-jp']);
 });
