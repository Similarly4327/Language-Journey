/* Build-time only. Input: factual source captures from import-jlpt-references.py
   and the web-reader fallback. Never adds source words to the course registry. */
const fs=require('node:fs');
const crypto=require('node:crypto');
const c=require('../language-journey-content/content.js');
const norm=s=>String(s).normalize('NFKC').replace(/[ァ-ヶ]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-96)).replace(/[^ぁ-ゖー]/g,'');
const roman=s=>String(s).normalize('NFKD').replace(/[^a-z]/g,'');
function build(raw,web){
  const sources={
    official:{url:'https://www.jlpt.jp/e/about/levelsummary.html',itemLevel:false,role:'competence'},
    officialTypes:{url:'https://www.jlpt.jp/e/guideline/testsections.html',itemLevel:false,role:'assessment'},
    officialFAQ:{url:'https://www.jlpt.jp/e/faq/',itemLevel:false,role:'no-exhaustive-official-lists'},
    sensei:{url:'https://jlptsensei.com/jlpt-n5-vocabulary-list/',itemLevel:true,role:'independent-publisher',captures:raw.senseiVocabulary.map(p=>({url:p.url,sha256:p.sha256,rows:p.rows.filter(r=>/^\d+$/.test(r[0])).length}))},
    senseiGrammar:{url:raw.senseiGrammar.url,itemLevel:true,role:'independent-publisher-same-family'},
    senseiKanji:{url:raw.senseiKanji.url,itemLevel:true,role:'independent-publisher-same-family'},
    jtest:{url:raw.jtestVocabulary.url,sha256:raw.jtestVocabulary.sha256,itemLevel:true,role:'independent-publisher'},
    jtestGrammar:{url:raw.jtestGrammar.url,sha256:raw.jtestGrammar.sha256,itemLevel:true,role:'independent-publisher-same-family'},
    mlc:{url:'https://www.mlcjapanese.co.jp/n5_04_01.html',itemLevel:false,role:'third-independent-comparison',status:'indexed-overview-only',notes:'802 words: 449 current official-workbook items + 307 old Level 4 items + 46 greetings. Full PDF unavailable on capture date; no fabricated item-level overlap.'}
  };
  const rows=[...new Map(raw.senseiVocabulary.flatMap(p=>p.rows.filter(r=>/^\d+$/.test(r[0])&&r.length===5)).concat(web).map(r=>[r[1]+'|'+r[2],r])).values()];
  for(const [id,source] of Object.entries(sources))source.publisher=id.startsWith('sensei')?'sensei':id.startsWith('jtest')?'jtest':id.startsWith('official')?'jlpt':id;
  const items=[];
  // Reviewed exact lexical matches. Do not infer senses from shared kana alone.
  // Ambiguous はやい (早い/速い) stays unmapped pending sense-level review.
  const excluded=new Set(['vocab-はやい']);
  const used=new Set();
  for(const r of rows){
    const kana=norm(r[2])||norm(r[1]),romaji=roman(r[2]);
    const candidates=c.vocabCatalog.filter(v=>!v.legacy&&norm(v.kana)===kana&&roman(v.romaji)===romaji&&!excluded.has(v.id));
    const word=candidates.length===1&&!used.has(candidates[0].id)?candidates[0]:null;
    if(word)used.add(word.id);
    const match=raw.jtestVocabulary.headwords.some(([jp,reading])=>jp.split('/').includes(r[1])||reading.split('/').some(value=>roman(value)===romaji));
    items.push({id:`n5-vocabulary-${Buffer.from(r[1]+'|'+romaji).toString('hex')}`,jlptLevel:'N5',category:'vocabulary',form:r[1],reading:kana,romanization:romaji,classification:'margin',knowledgeItemId:word?.id||null,mappingScope:word?'exact':'unmapped',provenance:['sensei',...(match?['jtest']:[])],notes:word?'Exact form/reading and lexical meaning checked against canonical LJ entry.':'No automatic lemma, inflection or homophone credit.'});
  }
  // Add JTest-only headwords as margin, not as a claim that the union is complete.
  for(const [form,reading] of raw.jtestVocabulary.headwords){
    if(reading.includes('/')||form.includes('/'))continue;
    const romaji=roman(reading);
    if(items.some(i=>i.category==='vocabulary'&&(i.form===form||i.romanization===romaji)))continue;
    items.push({id:`n5-vocabulary-${Buffer.from(form+'|'+romaji).toString('hex')}`,jlptLevel:'N5',category:'vocabulary',form,romanization:romaji,classification:'margin',knowledgeItemId:null,mappingScope:'unmapped',provenance:['jtest'],notes:'Single-source margin; reading/sense mapping awaits review.'});
  }
  const grammarMap={
    'da / desu':['grammar-desu','partial'], 'de':['grammar-l9-5','partial'],
    'ga arimasu':['grammar-l14-1','partial'], 'ka':['grammar-ka','exact'],
    'mo':['grammar-mo','exact'], 'no':['grammar-no','partial'],
    'ni':['grammar-ni','partial'], 'ni/e':['grammar-l12-1','partial'],
    'o / wo':['grammar-wo','exact'], 'wa - topic marker':['grammar-ha','exact'],
    'o kudasai':['grammar-l10-1','exact'],
    'te kudasai':['grammar-l11-home-1','partial'], 'to':['grammar-noun-to','partial'],
    'kara':['grammar-l13-1','partial']
  };
  const grammarRows=(raw.senseiGrammarPages||[raw.senseiGrammar]).flatMap(p=>p.rows).filter(r=>/^\d+$/.test(r[0])&&r.length===4);
  for(const r of grammarRows){
    const mapping=grammarMap[r[1]],id=`n5-grammar-${r[1].replace(/[^a-z0-9]+/g,'-')}`;
    const match=raw.jtestGrammar.links.some(([,label])=>norm(label.split('(')[0])===norm(r[2])&&norm(r[2]));
    items.push({id,jlptLevel:'N5',category:'grammar',form:r[2],classification:'margin',knowledgeItemId:mapping?.[0]||null,mappingScope:mapping?.[1]||'unmapped',provenance:['senseiGrammar',...(match?['jtestGrammar']:[])],notes:'Function-specific mapping only; a known phrase does not prove productive conjugation.'});
  }
  for(const r of (raw.senseiKanjiPages||[raw.senseiKanji]).flatMap(p=>p.rows).filter(r=>/^\d+$/.test(r[0])&&r.length===5)){
    const source=c.manifest.kanji.find(k=>k.character===r[1]);
    items.push({id:`n5-kanji-${r[1]}`,jlptLevel:'N5',category:'kanji',form:r[1],classification:'margin',knowledgeItemId:source?.id||null,mappingScope:source?'partial':'unmapped',representationScope:'Numeric symbol only where mapped; no inferred readings or word orthography.',provenance:['senseiKanji']});
  }
  // Independently authored competence units based on official item purposes.
  for(const [category,names] of Object.entries({reading:['short-passage','daily-passage','information-retrieval'],listening:['task-comprehension','key-information','situation-expression','quick-response']}))for(const name of names)items.push({id:`n5-${category}-${name}`,jlptLevel:'N5',category,form:name,classification:'core',knowledgeItemId:null,mappingScope:'unmapped',provenance:['officialTypes'],notes:'Competence unit, not a lexical-list item. Evidence contract not yet implemented.'});
  // Official competence units are normative, not claims of three list overlaps.
  items.filter(i=>['reading','listening'].includes(i.category)).forEach(i=>i.classification='margin');
  const tiers=Object.fromEntries(['N5','N4','N3','N2','N1'].map(level=>[level,{status:level==='N5'?'draft':'unbuilt',domains:Object.fromEntries(['vocabulary','kanji','grammar','reading','listening'].map(category=>[category,level==='N5'?'draft':'unbuilt']))}]));
  return {schemaVersion:1,version:'lj-jlpt-2026-10-29.1-draft',capturedAt:'2026-10-29',tiers,sources,limitations:['Three publishers compared; full third item list unavailable. No item is promoted to core on two-source overlap.','Source pagination/capture differences need reconciliation before a denominator can be reviewed.','No mastery contract for grammar, kanji, reading or listening. No overall percentage.'],items};
}
if(require.main===module){
  const [capture='docs/jlpt/reference-capture.json',web]=process.argv.slice(2),raw=JSON.parse(fs.readFileSync(capture));
  const data=build(raw,web?JSON.parse(fs.readFileSync(web)):raw.webHeadwords||[]);
  fs.writeFileSync('language-journey-content/jlpt-benchmark.js',`/* Generated factual benchmark snapshot; not a vocabulary registry. */\n(function(root){const data=${JSON.stringify(data,null,2)};if(typeof module!=='undefined'&&module.exports)module.exports=data;else (root.window||root).LanguageJourneyJlptBenchmark=data;})(typeof globalThis!=='undefined'?globalThis:this);\n`);
  console.log(JSON.stringify({version:data.version,items:data.items.length,categories:data.items.reduce((out,i)=>(out[i.category]=(out[i.category]||0)+1,out),{}),sha256:crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')}));
}
module.exports={build};
