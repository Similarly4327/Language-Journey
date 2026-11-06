/* LJ-JLPT-v2: fractional historical evidence from five distinct valid Recall reviews. */
(function(root){
  'use strict';
  const contract=Object.freeze({schemaVersion:2,version:'LJ-JLPT-v2',requiredConsecutiveCorrect:5,
    anchors:{N5:{vocabulary:1000,kanji:100},N4:{vocabulary:2000,kanji:300},N3:{vocabulary:4000,kanji:650},N2:{vocabulary:7000,kanji:1000},N1:{vocabulary:11000,kanji:2000}},
    weights:{vocabulary:.7,kanji:.3}});
  const safeId=value=>typeof value==='string'&&value.length>0&&value.length<=200&&!['__proto__','prototype','constructor'].includes(value);
  const wordId=value=>safeId(value)&&value.startsWith('vocab-');
  const character=value=>typeof value==='string'&&[...value].length===1&&/\p{Script=Han}/u.test(value);
  const time=value=>Number.isFinite(value)&&value>0;
  const clone=value=>JSON.parse(JSON.stringify(value));
  function empty(){return{version:2,scale:contract.version,attemptSequence:0,lexemes:{},kanji:{},attempts:{},migration:{from:'no-inferred-milestones',legacyEvidencePreserved:true}}}
  function supported(store){return store?.version===2&&store.scale===contract.version}
  function migrateRow(row){
    const oldEver=row?.everMastered===true;
    const oldStreak=Math.min(3,Math.max(0,Math.floor(Number(row?.streak)||0)));
    // Existing three-review mastery remains earned. Incomplete streak evidence is kept as historical credit.
    const creditUnits=oldEver?5:Math.min(2,oldStreak);
    return{streak:oldEver?5:oldStreak,creditUnits,everMastered:oldEver,masteredAt:time(row?.masteredAt)?row.masteredAt:null,lastEventId:safeId(row?.lastEventId)?row.lastEventId:null};
  }
  function normalize(saved){
    if(!saved)return empty();
    // A future schema is preserved verbatim and is read-only to this client.
    if(saved.version>2)return clone(saved);
    const out=empty();
    if(saved.version===2&&saved.scale===contract.version){
      out.attemptSequence=Math.max(0,Math.floor(Number(saved.attemptSequence)||0));
      for(const [kind,valid] of [['lexemes',wordId],['kanji',character]])for(const [id,row] of Object.entries(saved[kind]||{})){
        if(!valid(id)||!row||typeof row!=='object')continue;
        const normalized=migrateRow(row);
        normalized.streak=Math.min(5,Math.max(0,Math.floor(Number(row.streak)||0)));
        normalized.creditUnits=Math.min(5,Math.max(normalized.streak,Math.floor(Number(row.creditUnits)||0)));
        normalized.everMastered=row.everMastered===true||normalized.streak>=5;
        if(normalized.everMastered){normalized.creditUnits=5;normalized.masteredAt=normalized.masteredAt||time(row.lastReviewedAt)?(normalized.masteredAt||row.lastReviewedAt):null}
        out[kind][id]=normalized;
      }
      out.migration=saved.migration&&typeof saved.migration==='object'?clone(saved.migration):out.migration;
    }else{
      out.attemptSequence=Math.max(0,Math.floor(Number(saved.attemptSequence)||0));
      for(const [kind,valid] of [['lexemes',wordId],['kanji',character]])for(const [id,row] of Object.entries(saved[kind]||{}))if(valid(id)&&row&&typeof row==='object')out[kind][id]=migrateRow(row);
      out.migration={from:saved.version===1?'LJ-JLPT-v1':'legacy',legacyEvidencePreserved:true,partialCreditMigrated:true};
    }
    for(const [id,event] of Object.entries(saved.attempts||{}))if(safeId(id)&&event&&typeof event==='object')out.attempts[id]=clone(event);
    return out;
  }
  function allocateAttempt(store){
    if(!supported(store))return null;
    store.attemptSequence++;
    return `review:${store.attemptSequence}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2,12)}`;
  }
  function advance(rows,id,event){
    const row=rows[id]||(rows[id]={streak:0,creditUnits:0,everMastered:false,masteredAt:null,lastEventId:null});
    row.streak=event.correct?Math.min(5,row.streak+1):0;
    if(event.correct)row.creditUnits=Math.max(row.creditUnits,Math.min(5,row.creditUnits+1));
    row.lastEventId=event.attemptId;
    if(row.streak===5&&!row.everMastered){row.everMastered=true;row.creditUnits=5;row.masteredAt=event.at}
  }
  function record(store,event,content){
    if(!supported(store)||!event||!safeId(event.attemptId)||Object.hasOwn(store.attempts,event.attemptId)||!safeId(event.sourceId)||!time(event.at)||
      event.submitted!==true||event.valid!==true||typeof event.correct!=='boolean'||event.assisted===true)return false;
    const known=new Set(event.knownWordIds||[]),words=[],targets=[];
    const available=id=>wordId(id)&&known.has(id)&&content.vocabById[id]&&!content.vocabById[id].legacy;
    if(event.kind==='word-review')for(const id of new Set(event.targetWordIds||[]))if(available(id))words.push(id);
    if(event.kind==='contextual-kanji-review'&&event.recognition===true&&event.readingRevealed===false&&event.audioAssisted===false){
      const introduced=new Set(event.introducedKanjiWordIds||[]),seen=new Set();
      for(const target of event.kanjiTargets||[]){
        const word=content.vocabById[target?.wordId];
        if(!word||!available(word.id)||!introduced.has(word.id)||!word.kanjiIntroducedAt||!character(target.character)||seen.has(target.character)||
          target.form!==word.kanji||target.reading!==word.kana||!word.kanji?.includes(target.character)||typeof target.context!=='string'||!target.context.includes(word.kanji))continue;
        seen.add(target.character);targets.push({character:target.character,wordId:word.id,reading:word.kana,form:word.kanji});
      }
    }
    if(!words.length&&!targets.length)return false;
    store.attempts[event.attemptId]={at:event.at,sourceId:event.sourceId,kind:event.kind,correct:event.correct,wordIds:words,kanjiTargets:targets};
    for(const id of words)advance(store.lexemes,id,event);
    for(const target of targets)advance(store.kanji,target.character,event);
    return true;
  }
  function percentage(words,kanji,anchor){return 100*(.7*Math.min(Math.max(0,words)/anchor.vocabulary,1)+.3*Math.min(Math.max(0,kanji)/anchor.kanji,1))}
  function select(saved){
    const store=normalize(saved),available=supported(store);
    const wordRows=available?Object.entries(store.lexemes):[],kanjiRows=available?Object.entries(store.kanji):[];
    const words=wordRows.reduce((n,[,row])=>n+(row.creditUnits||0)/5,0),kanji=kanjiRows.reduce((n,[,row])=>n+(row.creditUnits||0)/5,0);
    const wordIds=wordRows.filter(([,row])=>row.everMastered).map(([id])=>id),characters=kanjiRows.filter(([,row])=>row.everMastered).map(([id])=>id);
    return{version:contract.version,available,words,kanji,wordIds,characters,tiers:Object.entries(contract.anchors).map(([level,anchors])=>({level,anchors,words,kanji,masteryPercent:percentage(words,kanji,anchors)})),migration:available?store.migration:null};
  }
  const api={contract,empty,normalize,record,select,percentage,supported,allocateAttempt};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else(root.window||root).LanguageJourneyJlptMilestones=api;
})(typeof globalThis!=='undefined'?globalThis:this);
