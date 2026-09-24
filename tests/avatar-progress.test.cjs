const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const content=require('../language-journey-content/content.js');

function fakeElement(id=''){
  const classes=new Set();
  return {id,dataset:{},style:{},value:'',textContent:'',innerHTML:'',hidden:false,disabled:false,
    classList:{add:(...names)=>names.forEach(x=>classes.add(x)),remove:(...names)=>names.forEach(x=>classes.delete(x)),toggle:(name,force)=>{if(force===undefined)force=!classes.has(name);force?classes.add(name):classes.delete(name);return force},contains:name=>classes.has(name)},
    setAttribute(){},getAttribute(){return null},removeAttribute(){},appendChild(){},prepend(){},remove(){},addEventListener(){},querySelector(){return fakeElement()},querySelectorAll(){return []},insertAdjacentHTML(){},scrollIntoView(){},focus(){},getBoundingClientRect(){return{width:300,height:200,top:0,left:0}}};
}

function createAvatarApp({savedState={},ranks={}}={}){
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const inline=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/\}\)\(\);\s*$/,`globalThis.__probe={state,rankState,levelRankIds,levelRank,getAvatarProgressLevel,activeLearningLevel,activeAvatarSkin,activeAvatarOutfit,syncAvatarState,renderAvatarSettings};})();`);
  const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,fakeElement(id));return elements.get(id)};
  const document={body:fakeElement('body'),documentElement:fakeElement('html'),hidden:false,getElementById:get,createElement:()=>fakeElement(),querySelectorAll:()=>[],querySelector:()=>fakeElement(),addEventListener(){}};
  const storage=new Map();
  storage.set('taal-japanse-leerapp-v1',JSON.stringify({version:6,state:savedState,ranks}));
  const localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
  const window={LanguageJourneyContent:content,innerWidth:390,innerHeight:844,addEventListener(){},setTimeout(){return 1},clearTimeout(){},matchMedia:()=>({matches:false,addEventListener(){}})};
  const context={document,window,localStorage,performance:{now:()=>0},navigator:{},console,setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(){},structuredClone,URL,Date,Math,Intl,alert(){},Image:class{}};
  for(const [,relative] of html.matchAll(/<script src="\.\/([^"?]+)(?:\?[^"]*)?"><\/script>/g)){
    if(relative==='language-journey-content/content.js')continue;
    vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',relative),'utf8'),context,{timeout:5000});
  }
  vm.runInNewContext(inline,context,{timeout:5000});
  return context.__probe;
}

function giveLevelRank(app,level,rank='Copper'){
  for(const id of app.levelRankIds(level-1))app.rankState[id].rank=rank;
}

test('avatar progress level follows highest current Copper rank, not navigation',()=>{
  const app=createAvatarApp();
  assert.equal(app.getAvatarProgressLevel(),1,'new users keep the Level 1 fallback');
  giveLevelRank(app,3);
  assert.equal(app.getAvatarProgressLevel(),3);
  giveLevelRank(app,7);
  app.state.level=1;
  app.syncAvatarState();
  assert.equal(app.activeLearningLevel(),2);
  assert.equal(app.getAvatarProgressLevel(),7);
  app.state.level=7;
  app.syncAvatarState();
  assert.equal(app.getAvatarProgressLevel(),7,'opening Level 8 is not a rank achievement');
  giveLevelRank(app,8);
  assert.equal(app.getAvatarProgressLevel(),8);
});

test('avatar level is derived again from saved ranks after reload',()=>{
  const first=createAvatarApp();
  giveLevelRank(first,7);
  const ranks=JSON.parse(JSON.stringify(first.rankState));
  const reloaded=createAvatarApp({savedState:{level:1},ranks});
  assert.equal(reloaded.activeLearningLevel(),2);
  assert.equal(reloaded.getAvatarProgressLevel(),7);
});

test('automatic outfit follows active level while manual selection remains fixed',()=>{
  const app=createAvatarApp();
  giveLevelRank(app,7);
  app.state.level=6;
  app.syncAvatarState();
  assert.equal(app.getAvatarProgressLevel(),7);
  assert.equal(app.activeAvatarOutfit().id,'school');
  app.state.level=1;
  app.syncAvatarState();
  assert.equal(app.getAvatarProgressLevel(),7);
  assert.equal(app.activeAvatarOutfit().id,'starter','automatic outfit follows the active Level 2 context');
  app.state.avatarMode='manual';
  app.state.selectedAvatarOutfit='school';
  app.state.selectedAvatarSkin='skin-2';
  app.syncAvatarState();
  app.state.level=0;
  app.syncAvatarState();
  assert.equal(app.activeAvatarOutfit().id,'school');
  assert.equal(app.activeAvatarSkin().id,'skin-2');
  assert.equal(app.getAvatarProgressLevel(),7);
});
