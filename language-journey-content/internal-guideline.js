/* Internal learning evidence, not an official JLPT list or a second scheduler. */
(function(root){
  'use strict';
  const contract={schemaVersion:1,version:'lj-internal-n5-n3-2026-11-01.1',
    sourceDocument:'Language Journey — interne N5–N3-richtlijn en kanji-leessteun — 2026-11-01',
    anchors:{N5:{vocabulary:800,kanji:100},N4:{vocabulary:1500,kanji:300},N3:{vocabulary:3500,kanji:650}},
    domainWeights:null,
    familyCaps:[
      {id:'calendar-dates',cap:3,ids:['ついたち','ふつか','みっか'].map(form=>'vocab-'+form)},
      {id:'weekdays',cap:3,ids:['げつようび','かようび','すいようび','もくようび','きんようび','どようび','にちようび'].map(form=>'vocab-'+form)},
      {id:'months',cap:3,ids:['いちがつ','にがつ','さんがつ','しがつ','ごがつ','ろくがつ','しちがつ','はちがつ','くがつ','じゅうがつ','じゅういちがつ','じゅうにがつ'].map(form=>'vocab-'+form)}
    ],
    familyCapProvenance:'Voorlopige appkeuze: maximaal 3 per kalenderfamilie; de bron specificeert geen getal. Ruwe tellingen blijven zichtbaar.',
    definitions:{seen:'Expliciet geïntroduceerd; geen beheersingsbewijs.',practiced:'Minstens één correct antwoord op een expliciet woorddoel.',applied:'Minstens één correct antwoord met een expliciet woorddoel in een gewone contexttaak.',kanji:'Bekende woordlezing, expliciet geïntroduceerde schrijfwijze en een correct antwoord zonder doelwoordhulp.'},
    gaps:['N4- en N3-toewijzingen zijn nog niet inhoudelijk doorgelicht.','Domeinweging voor grammatica, lezen en luisteren ontbreekt.','Oude totaalscores bewijzen geen individuele toepassingsdoelen.']};
  const levels=Object.keys(contract.anchors),domains=['grammar','reading','listening'];
  const empty=()=>({version:1,words:{},domains:Object.fromEntries(domains.map(domain=>[domain,{}]))});
  const stamp=value=>value&&Number.isFinite(value.at)&&value.at>0&&typeof value.sourceId==='string'&&value.sourceId.length>0;
  function normalize(saved,content){
    const out=empty();if(saved?.version!==1)return out;
    const words=new Set(content.manifest.vocabulary.map(word=>word.id));
    for(const [id,value] of Object.entries(saved.words||{}))if(words.has(id)&&value&&typeof value==='object'){
      const row={};for(const stage of ['practiced','applied','kanji'])if(stamp(value[stage]))row[stage]={at:value[stage].at,sourceId:value[stage].sourceId.slice(0,200)};
      if(Object.keys(row).length)out.words[id]=row;
    }
    for(const domain of domains)for(const [id,value] of Object.entries(saved.domains?.[domain]||{}))if(stamp(value)&&(domain==='grammar'?content.manifest.grammar.some(item=>item.id===id&&!item.referenceAliasOf):domain==='reading'?content.manifest.readings.some(item=>item.id===id):!!content.audioEntryById[id]?.pronunciation?.audioTextKana))out.domains[domain][id]={at:value.at,sourceId:value.sourceId.slice(0,200)};
    return out;
  }
  function record(store,event,content){
    if(!event?.correct||event.assisted||!stamp(event))return false;
    let changed=false;const evidence={at:event.at,sourceId:event.sourceId};
    for(const id of new Set(event.targetWordIds||[])){
      const word=content.vocabById[id];if(!word||word.legacy||!event.knownWordIds?.includes(id))continue;
      const row=store.words[id]||(store.words[id]={});
      for(const stage of event.contextual?['practiced','applied']:['practiced'])if(!row[stage]){row[stage]={...evidence};changed=true}
      if(word.kanji&&word.kanjiIntroducedAt&&event.kanjiWordIds?.includes(id)&&!row.kanji){row.kanji={...evidence};changed=true}
    }
    for(const domain of domains)for(const id of new Set(event.domainTargets?.[domain]||[])){
      if(domain==='grammar'&&!content.manifest.grammar.some(item=>item.id===id&&!item.referenceAliasOf))continue;
      if(domain==='reading'&&!content.manifest.readings.some(item=>item.id===id))continue;
      if(domain==='listening'&&(event.audioOnly!==true||!content.audioEntryById[id]?.pronunciation?.audioTextKana))continue;
      if(!id||['__proto__','constructor','prototype'].includes(id))continue;
      if(!store.domains[domain][id]){store.domains[domain][id]={...evidence};changed=true}
    }
    return changed;
  }
  function capped(rows,predicate,policy=contract){
    const selected=rows.filter(predicate),familyIds=new Set(policy.familyCaps.flatMap(family=>family.ids));
    return selected.filter(row=>!familyIds.has(row.id)).length+policy.familyCaps.reduce((sum,family)=>sum+Math.min(family.cap,selected.filter(row=>family.ids.includes(row.id)).length),0);
  }
  function select(content,external,evidence,policy=contract,now=Date.now()){
    const store=normalize(evidence.history,content),mapping=new Map();
    // External item provenance is a mapping input, never the internal denominator.
    for(const item of external.items||[])if(item.category==='vocabulary'&&item.mappingScope==='exact'&&item.classification!=='lj-extra'&&levels.includes(item.jlptLevel)&&!mapping.has(item.knowledgeItemId))mapping.set(item.knowledgeItemId,item.jlptLevel);
    const rows=content.vocabCatalog.filter(word=>!word.legacy).map(word=>{
      const known=!!evidence.isIntroduced(word.id),history=store.words[word.id]||{},records=['jp-nl','nl-jp'].map(direction=>evidence.srsRecord(word.id,direction));
      const successfulRecall=records.some(record=>Number.isFinite(record?.lastReviewedAt)&&record.lastReviewedAt<=now&&(record.repetitions>0||record.lastGrade==='knew'));
      const attained=stage=>!!history[stage]&&history[stage].at<=now;
      return{id:word.id,tier:mapping.get(word.id)||null,seen:known,practiced:known&&(attained('practiced')||successfulRecall),applied:known&&attained('applied'),kanji:known&&attained('kanji')&&!!word.kanjiIntroducedAt&&evidence.isKanjiIntroduced(word.id),form:word.kanji,reading:word.kana,needsReview:known&&records.some(record=>Number.isFinite(record?.dueAt)&&record.dueAt<=now)};
    });
    const counts=list=>Object.fromEntries(['seen','practiced','applied'].map(stage=>[stage,{raw:list.filter(row=>row[stage]).length,weighted:capped(list,row=>row[stage],policy)}]));
    const tiers=levels.map((level,index)=>{
      const allowed=levels.slice(0,index+1),items=rows.filter(row=>allowed.includes(row.tier)),kanji=[...new Set(items.filter(row=>row.kanji).flatMap(row=>[...row.form].filter(char=>/\p{Script=Han}/u.test(char))))];
      return{level,anchors:policy.anchors[level],vocabulary:counts(items),mapped:items.length,kanji:kanji.length,kanjiWordReadings:items.filter(row=>row.kanji).map(row=>({wordId:row.id,form:row.form,reading:row.reading})),masteryPercent:null,status:'In opbouw'};
    });
    return{version:policy.version,tiers,totals:counts(rows),unmapped:counts(rows.filter(row=>!row.tier)),needsReview:rows.filter(row=>row.needsReview).length,domains:Object.fromEntries(domains.map(domain=>[domain,Object.keys(store.domains[domain]).length])),items:rows,gaps:policy.gaps};
  }
  const api={contract,empty,normalize,record,capped,select};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else(root.window||root).LanguageJourneyInternalGuideline=api;
})(typeof globalThis!=='undefined'?globalThis:this);
