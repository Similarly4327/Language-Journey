(function(root){
  'use strict';
  const FORMAT='language-journey-passport',MAX_BYTES=20*1024*1024;
  const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  function fail(code){const error=new Error(code);error.code=code;throw error}
  function checkTree(value,depth=0){
    if(depth>80)fail('corrupt');
    if(value&&typeof value==='object')for(const [key,child] of Object.entries(value)){
      if(['__proto__','prototype','constructor'].includes(key)||/^(password|credential|accessToken|refreshToken|apiKey|authorization)$/i.test(key))fail('corrupt');
      checkTree(child,depth+1);
    }
  }
  function validate(snapshot,courseId){
    const version=Number(snapshot?.version);
    if(!object(snapshot)||!Number.isInteger(version)||version<1||version>9)fail('incompatible');
    if(!object(snapshot.state)||!object(snapshot.ranks))fail('corrupt');
    for(const key of ['itemMastery','vocabMastery'])if(snapshot[key]!==undefined&&!object(snapshot[key]))fail('corrupt');
    if(snapshot.state.courseId&&snapshot.state.courseId!==courseId)fail('course');
    const ranks=/^(Copper|Silver|Gold|Bronze|Diamond|Platinum)$/i;
    for(const row of Object.values(snapshot.ranks))if(!(typeof row==='string'&&ranks.test(row.trim()))&&(!object(row)||('rank' in row&&row.rank!==null&&!ranks.test(String(row.rank).trim()))))fail('corrupt');
    if(snapshot.state.flashcardProgress!==undefined&&(!object(snapshot.state.flashcardProgress)||!object(snapshot.state.flashcardProgress.cards)))fail('corrupt');
    const state=snapshot.state;
    if(state.passportKnowledge){
      const knowledge=state.passportKnowledge;
      if(knowledge.version!==1)fail('incompatible');
      if(!Array.isArray(knowledge.entries))fail('corrupt');
      const ids=new Set();
      for(const item of knowledge.entries){
        if(!object(item)||typeof item.id!=='string'||!/^(?:vocab-[^:]+|passport-[1-9]\d*)$/.test(item.id)||ids.has(item.id))fail('corrupt');
        if(!['lemma','reading','meaning'].every(key=>typeof item[key]==='string'&&item[key].trim()&&item[key].length<=2000))fail('corrupt');
        if(item.contexts!==undefined&&(!Array.isArray(item.contexts)||item.contexts.some(context=>!object(context))))fail('corrupt');
        ids.add(item.id);
      }
    }
    for(const key of ['introducedVocabIds','historicalIntroducedVocabIds','unlockedAvatarSkins','unlockedAvatarOutfits'])if(state[key]!==undefined&&!Array.isArray(state[key]))fail('corrupt');
    for(const key of ['errorBank','lastErrors','langStepProgress','advancedStepProgress','instructionKnowledge','vocabFirstSeen','kanaFirstSeen','studyTracker','flashcardSelection','passportKnowledge'])if(state[key]!==undefined&&!object(state[key]))fail('corrupt');
    for(const key of ['errorBank','lastErrors'])if(state[key])for(const rows of Object.values(state[key]))if(!Array.isArray(rows))fail('corrupt');
    if(state.studyTracker)for(const key of ['sessions','events'])if(state.studyTracker[key]!==undefined&&!Array.isArray(state.studyTracker[key]))fail('corrupt');
    if(state.flashcardProgress)for(const row of Object.values(state.flashcardProgress.cards)){
      if(!object(row))fail('corrupt');
      for(const key of ['dueAt','intervalDays','repetitions','lapses','lastReviewedAt'])if(row[key]!==undefined&&(typeof row[key]!=='number'||!Number.isFinite(row[key])||row[key]<0))fail('corrupt');
    }
    checkTree(snapshot);
    return snapshot;
  }
  function create(adapter){
    const previews=new WeakMap();
    function preview(text){
      if(typeof text!=='string'||text.length>MAX_BYTES)fail('size');
      let file;try{file=JSON.parse(text)}catch{fail('corrupt')}
      checkTree(file);
      let snapshot,createdAt=null;
      if(file?.format===FORMAT){
        if(file.backupVersion!==1||file.scope?.courseId!==adapter.courseId||file.scope?.profile!=='local')fail('incompatible');
        snapshot=file.progress;createdAt=file.exportedAt;
      }else if(object(file)&&typeof file.currentRaw==='string'){
        if(file.storageKey&&file.storageKey!==adapter.storageKey)fail('course');
        try{snapshot=JSON.parse(file.currentRaw)}catch{fail('corrupt')}
        createdAt=file.exportedAt||null;
      }else snapshot=file;
      validate(snapshot,adapter.courseId);
      const knownIds=new Set([...snapshot.state.introducedVocabIds||[],...Object.keys(snapshot.state.vocabFirstSeen||{}),...Object.keys(snapshot.state.flashcardProgress?.cards||{}).map(key=>key.split('::')[0]).filter(id=>id.startsWith('vocab-'))]);
      for(const entry of snapshot.state.passportKnowledge?.entries||[])knownIds.add(entry.officialId||entry.parentId||entry.id);
      const result=Object.freeze({courseId:adapter.courseId,profile:'local',version:snapshot.version,exportedAt:createdAt,savedAt:snapshot.savedAt||null,learnerName:typeof snapshot.state.userName==='string'?snapshot.state.userName:'',rankCount:Object.values(snapshot.ranks).filter(row=>row.rank).length,recallCards:Object.keys(snapshot.state.flashcardProgress?.cards||{}).length,knownWordCount:knownIds.size});
      previews.set(result,JSON.stringify(snapshot));return result;
    }
    return Object.freeze({
      preview,
      export(){return adapter.lock(()=>{
        if(!adapter.isCurrent())fail('conflict');
        const progress=JSON.parse(JSON.stringify(adapter.snapshot()));validate(progress,adapter.courseId);
        return JSON.stringify({format:FORMAT,backupVersion:1,exportedAt:new Date().toISOString(),scope:{courseId:adapter.courseId,profile:'local'},progress},null,2);
      })},
      restore(selection,consent){
        if(consent?.confirmed!==true)fail('confirmation');
        const raw=previews.get(selection);if(!raw)fail('preview');
        return adapter.lock(()=>{
          if(!adapter.isCurrent())fail('conflict');
          const snapshot=validate(JSON.parse(raw),adapter.courseId);
          // A single progress-key write is the commit. Never mutate live state before it.
          const previous=JSON.stringify(adapter.snapshot());
          adapter.storage.setItem(adapter.storageKey+':passport-before-restore',JSON.stringify({format:FORMAT,backupVersion:1,exportedAt:new Date().toISOString(),scope:{courseId:adapter.courseId,profile:'local'},progress:JSON.parse(previous)}));
          if(!adapter.isCurrent())fail('conflict');
          adapter.storage.setItem(adapter.storageKey,JSON.stringify({...snapshot,savedAt:new Date().toISOString()}));
          previews.delete(selection);
          adapter.committed();
          return {ok:true};
        });
      }
    });
  }
  root.LanguageJourneyPassportBackup={create};
  if(typeof module!=='undefined')module.exports={create};
})(typeof window==='undefined'?globalThis:window);
