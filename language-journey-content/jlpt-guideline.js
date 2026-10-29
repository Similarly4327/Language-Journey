/* Read-only benchmark selectors. No storage, scheduling or curriculum writes. */
(function(root){
  'use strict';
  const levels=['N5','N4','N3','N2','N1'];
  const categories=['vocabulary','kanji','grammar','reading','listening'];
  const directions=['jp-nl','nl-jp'];
  function vocabularyStatus(id,evidence,now){
    if(!evidence.isIntroduced(id))return 'unseen';
    const records=directions.map(direction=>evidence.srsRecord(id,direction));
    if(records.some(record=>record&&Number.isFinite(record.dueAt)&&record.dueAt<=now))return 'needs-review';
    // Reuse Recall's existing `repeated` threshold (>=3 successes), not Gold,
    // lesson ranks, a new strength formula or a second scheduler.
    if(records.every(record=>record?.repetitions>=3&&record.lastGrade==='knew'&&Number.isFinite(record.lastReviewedAt)&&record.lastReviewedAt<=now&&Number.isFinite(record.dueAt)&&record.dueAt>now))return 'stable';
    return 'practicing';
  }
  function select(benchmark,evidence,now=Date.now()){
    return levels.map((level,index)=>{
      // A higher tier contains all mapped lower-tier prerequisites too. A
      // missing tier is never silently replaced by the N5 denominator.
      const prerequisites=levels.slice(0,index+1);
      const items=benchmark.items.filter(item=>prerequisites.includes(item.jlptLevel)&&item.classification!=='lj-extra');
      const domains=Object.fromEntries(categories.map(category=>{
        const rows=items.filter(item=>item.category===category).map(item=>{
          const id=item.knowledgeItemId;
          const status=!id?'unmapped':category==='vocabulary'?vocabularyStatus(id,evidence,now):'evidence-unavailable';
          return {benchmarkItemId:item.id,knowledgeItemId:id,status,partial:item.mappingScope==='partial'};
        });
        const count=status=>rows.filter(row=>!row.partial&&row.status===status).length;
        const stable=count('stable'),introduced=rows.filter(row=>!row.partial&&['stable','practicing','needs-review'].includes(row.status)).length;
        const complete=prerequisites.every(tier=>benchmark.tiers[tier]?.domains?.[category]==='reviewed');
        // Non-vocabulary evidence is deliberately not reconstructed from
        // vocabulary scores, elapsed study time, opened lessons or ranks.
        const measurable=category==='vocabulary'&&complete&&rows.length>0;
        return [category,{total:rows.length,mapped:rows.filter(row=>row.knowledgeItemId&&!row.partial).length,introduced,stable,needsReview:count('needs-review'),practicing:count('practicing'),masteryPercent:measurable?Math.floor(100*stable/rows.length):null,introducedPercent:measurable?Math.floor(100*introduced/rows.length):null,available:measurable,items:rows}];
      }));
      const ready=prerequisites.every(tier=>benchmark.tiers[tier]?.status==='reviewed')&&categories.every(category=>domains[category].available);
      // No arbitrary cross-domain weights. Keep the total unavailable until
      // a reviewed evidence contract exists for every domain.
      return {level,benchmarkVersion:benchmark.version,status:benchmark.tiers[level]?.status||'unbuilt',domains,masteryPercent:null,ready};
    });
  }
  function validate(benchmark,content){
    const errors=[],ids=new Set(),mapped=new Set();
    const catalogs={vocabulary:content.manifest.vocabulary,grammar:content.manifest.grammar,kanji:content.manifest.kanji,reading:content.manifest.readings,listening:content.manifest.readings};
    if(!benchmark.version||benchmark.schemaVersion!==1)errors.push('Invalid benchmark version/schema');
    for(const level of levels)if(!benchmark.tiers[level])errors.push(`Missing tier: ${level}`);
    for(const item of benchmark.items){
      if(ids.has(item.id))errors.push(`Duplicate benchmark ID: ${item.id}`);ids.add(item.id);
      if(!levels.includes(item.jlptLevel)||!categories.includes(item.category))errors.push(`Invalid level/category: ${item.id}`);
      if(!['core','margin','lj-extra'].includes(item.classification))errors.push(`Invalid classification: ${item.id}`);
      if(!['exact','partial','unmapped'].includes(item.mappingScope)||!item.knowledgeItemId&&item.mappingScope!=='unmapped')errors.push(`Invalid mapping scope: ${item.id}`);
      if(!item.provenance?.length||item.provenance.some(id=>!benchmark.sources[id]))errors.push(`Missing provenance: ${item.id}`);
      if(item.classification==='core'&&new Set(item.provenance.filter(id=>benchmark.sources[id]?.itemLevel).map(id=>benchmark.sources[id].publisher||id)).size<3)errors.push(`Core needs three item-level references: ${item.id}`);
      if(item.knowledgeItemId){
        const source=catalogs[item.category]?.find(row=>row.id===item.knowledgeItemId);
        if(!source)errors.push(`Orphan knowledge ID: ${item.id}`);
        if(source?.referenceAliasOf)errors.push(`Map canonical grammar, not alias: ${item.id}`);
        const key=`${item.category}:${item.knowledgeItemId}`;
        if(mapped.has(key))errors.push(`Duplicate canonical mapping: ${key}`);mapped.add(key);
        if(item.introducedAt&&source&&content.pointOrder(item.introducedAt)<content.pointOrder(source.introducedAt))errors.push(`Future leakage: ${item.id}`);
        if(item.category==='kanji'&&!item.representationScope)errors.push(`Kanji needs explicit representation scope: ${item.id}`);
      }
    }
    return errors;
  }
  const api={levels,categories,directions,vocabularyStatus,select,validate};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else (root.window||root).LanguageJourneyJlpt=api;
})(typeof globalThis!=='undefined'?globalThis:this);
