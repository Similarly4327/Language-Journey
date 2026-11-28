const test=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('../passport-backup.js');
function setup({failKey,conflict=false}={}){
 const original={version:9,state:{courseId:'japanese',userName:'Ada',flashcardProgress:{version:1,cards:{'vocab-ねこ::jp-nl':{dueAt:700,repetitions:3}}}},ranks:{lesson:{rank:'Gold',attempts:3}},itemMastery:{a:{score:2}},vocabMastery:{b:{score:3}}};
 const storage=new Map([['progress',JSON.stringify(original)]]);let committed=false;
 const api=create({courseId:'japanese',storageKey:'progress',snapshot:()=>original,isCurrent:()=>!conflict,lock:action=>action(),storage:{setItem(key,value){if(key===failKey)throw Error('quota');storage.set(key,value)}},committed(){committed=true}});
 return {api,storage,original,get committed(){return committed}};
}
test('course backup round trip preserves ranks mastery and Recall and writes restore point first',()=>{
 const target=setup();const text=target.api.export();const preview=target.api.preview(text);
 assert.equal(preview.recallCards,1);assert.equal(preview.learnerName,'Ada');assert.equal(preview.rankCount,1);
 assert.throws(()=>target.api.restore(preview),/confirmation/);
 assert.deepEqual(target.api.restore(preview,{confirmed:true}),{ok:true});
 assert.equal(target.committed,true);assert.deepEqual(JSON.parse(target.storage.get('progress')).state,target.original.state);
 assert.deepEqual(JSON.parse(target.storage.get('progress:passport-before-restore')).progress,target.original);
});
test('preview accepts historical progress and Recall debug exports without changing storage',()=>{
 const target=setup();const before=target.storage.get('progress');
 assert.equal(target.api.preview(JSON.stringify({...target.original,version:1})).version,1);
 assert.equal(target.api.preview(JSON.stringify({storageKey:'progress',currentRaw:before})).rankCount,1);
 assert.equal(target.storage.get('progress'),before);
});
test('restore failures leave original progress intact',()=>{
 for(const failKey of ['progress','progress:passport-before-restore']){
  const target=setup({failKey});const before=target.storage.get('progress'),preview=target.api.preview(target.api.export());
  assert.throws(()=>target.api.restore(preview,{confirmed:true}),/quota/);
  assert.equal(target.storage.get('progress'),before);assert.equal(target.committed,false);
 }
 const target=setup({conflict:true});assert.throws(()=>target.api.export(),/conflict/);
});
test('corrupt incompatible and cross-course files are rejected before writes',()=>{
 const target=setup();const before=target.storage.get('progress');
 for(const input of ['{','{}',JSON.stringify({...target.original,version:10}),JSON.stringify({...target.original,state:{courseId:'other'}}),JSON.stringify({...target.original,ranks:[]}),'{"version":9,"state":{"__proto__":{}},"ranks":{}}'])assert.throws(()=>target.api.preview(input));
 const preview=target.api.preview(target.api.export());assert.throws(()=>target.api.restore({...preview},{confirmed:true}),/preview/);
 assert.equal(target.storage.get('progress'),before);
});
