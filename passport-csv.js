/* Language Passport v1. Pure data transforms; never writes progress or runs instructions. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./assets/vendor/papaparse.min.js'):root.Papa);if(typeof module==='object'&&module.exports)module.exports=api;else (root.window||root).LanguagePassportCSV=api})(typeof globalThis!=='undefined'?globalThis:this,function(Papa){
  'use strict';
  const VERSION='1',LANGUAGE='ja';
  const HEADER=Object.freeze('record_type,schema_version,language,key,value,lexeme_id,sense_id,course_id,word,reading,romaji,word_type,meaning,context_category,example_sentence,example_translation,dictionary_explanation,learning_note,source,course_level,course_lesson,knowledge_status,audio_ref,acquired_at'.split(','));
  const TYPES=new Set(['PROFILE','INSTRUCTION','VOCABULARY','SENSE','CONTEXT','GRAMMAR','PARTICLE','SCRIPT','KANJI']);
  const LIMITS=Object.freeze({bytes:5*1024*1024,rows:20000,field:16000});
  const START_PROMPT="You are a language practice partner. This Language Journey Passport lists the learner's actual introduced vocabulary, known meanings, grammar, script knowledge and indicative proficiency. Use the actual knowledge records as your primary guide; the JLPT indicators are internal Language Journey estimates, not official proficiency scores. Follow the user's requested activity (conversation, story, roleplay, reading or another exercise). Keep language natural, understandable and appropriately challenging. Prefer familiar vocabulary and grammar; adapt to demonstrated understanding, using known writing systems and reading support as needed. Introduce unfamiliar words naturally and explain their pronunciation, meaning in context, usage and distinctions from similar words. Keep track of new words or meanings the learner actually chooses to learn during this session, not every word merely encountered. When asked for a Passport update, produce a valid UTF-8 CSV using the same schema and record types, either a complete Passport preserving existing knowledge or only new knowledge rows with the same header. Include written form, reading, translation, context, example and dictionary explanation where relevant. Leave unknown official IDs blank; do not invent internal IDs, course references, audio or mastery. Do not remove prior knowledge or alter existing mastery statistics. Language Journey manages long-term retention through Recall.";
  const str=x=>x==null?'':typeof x==='object'?JSON.stringify(x):String(x);
  const norm=x=>str(x).normalize('NFC').trim().toLocaleLowerCase('nl');
  // Escape apostrophes too: decoding is reversible even for a literal '=foo.
  const encode=x=>{const s=str(x);return /^[\s]*[=+\-@\t\r\n']/.test(s)?"'"+s:s};
  const decode=x=>/^'[\s]*[=+\-@\t\r\n']/.test(x)?x.slice(1):x;
  const clean=x=>str(x).replace(/\r\n?/g,'\n');
  function row(type,data={}){return Object.fromEntries(HEADER.map(k=>[k,k==='record_type'?type:k==='schema_version'?VERSION:k==='language'?LANGUAGE:str(data[k])]))}
  function itemRow(item,type){return row(type||item.record_type||({word:'VOCABULARY',woord:'VOCABULARY',grammar:'GRAMMAR',particle:'PARTICLE',script:'SCRIPT',kana:'SCRIPT',kanji:'KANJI'}[str(item.kind).toLowerCase()]||str(item.kind).toUpperCase()||'VOCABULARY'),{...item,lexeme_id:item.lexeme_id||item.officialId||item.id,word:item.word||item.lemma||item.jp,reading:item.reading||item.kana,meaning:item.meaning||item.meanings?.[0],sense_id:item.sense_id||item.senseId,dictionary_explanation:item.dictionary_explanation||item.explanation,learning_note:item.learning_note||item.note,context_category:item.context_category||item.category,example_sentence:item.example_sentence||item.exampleSentence||item.sentence,example_translation:item.example_translation||item.exampleTranslation||item.translation,source:item.source,knowledge_status:item.knowledge_status||item.status})}
  function exportCSV({profile={},instructions=[START_PROMPT],items=[]}={}){
    const rows=Object.entries(profile).filter(([,v])=>v!==undefined&&v!==null).map(([key,value])=>row('PROFILE',{key,value}));
    for(const [i,value] of (Array.isArray(instructions)?instructions:[instructions]).entries())rows.push(row('INSTRUCTION',{key:`practice_${i+1}`,value}));
    for(const item of items){rows.push(itemRow(item));for(const context of item.contexts||[])rows.push(itemRow({...item,...(typeof context==='string'?{example_sentence:context}:context),contexts:undefined},'CONTEXT'))}
    return '\uFEFF'+Papa.unparse([HEADER,...rows.map(r=>HEADER.map(k=>encode(r[k])))],{newline:'\r\n',quotes:true,delimiter:','})+'\r\n';
  }
  function parseCSV(text){
    const errors=[];const fail=message=>({valid:false,rows:[],errors:[{row:0,message}],warnings:[]});
    if(typeof text!=='string')return fail('CSV moet tekst zijn.');
    if(new TextEncoder().encode(text).length>LIMITS.bytes)return fail('CSV is te groot (maximaal 5 MiB).');
    if(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text)||/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(text))return fail('Ongeldige Unicode of controletekens.');
    text=text.replace(/^\uFEFF/,'');
    const matches=[];
    for(const delimiter of [',',';']){const p=Papa.parse(text,{delimiter,skipEmptyLines:false,preview:LIMITS.rows+3});if(p.data[0]?.length===HEADER.length&&p.data[0].every((v,i)=>v===HEADER[i]))matches.push({delimiter,p})}
    if(matches.length!==1)return fail('Onbekende of dubbelzinnige CSV-header; gebruik het Passport v1-schema.');
    const {delimiter,p}=matches[0];
    if(p.meta.truncated)return fail('Te veel CSV-records.');
    const dataCount=p.data.length-1-(p.data[p.data.length-1]?.length===1&&p.data[p.data.length-1][0]===''?1:0);
    if(dataCount>LIMITS.rows)return fail('Te veel CSV-records.');
    for(const e of p.errors)errors.push({row:(e.row??0)+1,message:e.message});
    const rows=[];for(let i=1;i<p.data.length;i++){
      const cells=p.data[i];if(i===p.data.length-1&&cells.length===1&&cells[0]==='')continue;
      const rowErrors=[];
      if(cells.length!==HEADER.length)rowErrors.push(`Verwacht ${HEADER.length} kolommen, kreeg ${cells.length}.`);
      if(cells.some(v=>v.length>LIMITS.field))rowErrors.push('Veld is te lang (maximaal 16000 tekens).');
      const r=Object.fromEntries(HEADER.map((k,j)=>[k,decode(cells[j]||'')]));
      if(!TYPES.has(r.record_type))rowErrors.push('Onbekend recordtype.');
      if(r.schema_version!==VERSION)rowErrors.push('Niet-ondersteunde schemaversie.');
      if(r.language!==LANGUAGE)rowErrors.push('Niet-ondersteunde taal.');
      for(const message of rowErrors)errors.push({row:i+1,message});
      rows.push({...r,row:i+1,errors:rowErrors});
    }
    return {valid:errors.length===0,rows,errors,warnings:delimiter===';'?['Excel-puntkomma herkend; canonieke export gebruikt komma’s.']:[],delimiter};
  }
  const kind=x=>({woord:'VOCABULARY',word:'VOCABULARY',vocabulary:'VOCABULARY',sense:'VOCABULARY',context:'VOCABULARY',kana:'SCRIPT'}[str(x.kind||x.record_type).toLowerCase()]||str(x.kind||x.record_type||'VOCABULARY').toUpperCase());
  const lemma=x=>x.lemma||x.word||x.jp||'';
  const reading=x=>x.reading||x.kana||'';
  const meanings=x=>[x.meaning,...(x.meanings||[]),...(x.senses||[]).map(s=>typeof s==='string'?s:s.meaning),x.sense].filter(Boolean).map(norm);
  const aliases=x=>[lemma(x),...(x.aliases||[]),x.kanji].filter(v=>typeof v==='string').map(norm);
  const lexical=(a,b)=>(!b.language||b.language===LANGUAGE)&&kind(a)===kind(b)&&aliases(b).includes(norm(lemma(a)))&&norm(reading(a))===norm(reading(b));
  const sameSense=(a,b)=>meanings(b).includes(norm(a.meaning||a.sense));
  const identity=x=>[kind(x),norm(lemma(x)),norm(reading(x)),norm(x.meaning||x.sense)].join('\u001F');
  function planImport(input,{registry=[],personalItems=[]}={}){
    const parsed=typeof input==='string'?parseCSV(input):input;
    const rows=[],seen=new Map(),declaredParents=new Map(),official=Array.isArray(registry)?registry:Object.values(registry);
    for(const r of parsed.rows||[]){
      if(['PROFILE','INSTRUCTION'].includes(r.record_type))continue;
      if(!['VOCABULARY','SENSE','CONTEXT'].includes(r.record_type)||r.word_type==='reference')continue;
      const errors=[...(r.errors||[])];if(!r.word.trim())errors.push('Geschreven vorm ontbreekt.');if(!r.meaning.trim())errors.push('Betekenis ontbreekt.');if(['VOCABULARY','SENSE','CONTEXT'].includes(r.record_type)&&!r.reading.trim())errors.push('Lezing ontbreekt.');
      if([r.word,r.reading,r.meaning,r.romaji,r.word_type].some(field=>field.length>2000))errors.push('Woord, lezing, romaji, woordsoort en betekenis mogen maximaal 2000 tekens bevatten.');
      const item={kind:kind(r),lemma:clean(r.word),reading:clean(r.reading),romaji:clean(r.romaji),meaning:clean(r.meaning),sense:clean(r.meaning),senseId:'',wordType:clean(r.word_type),explanation:clean(r.dictionary_explanation),note:clean(r.learning_note),source:'Passport Import',contexts:[]};
      if(r.example_sentence||r.example_translation||r.context_category)item.contexts.push({context_category:clean(r.context_category),example_sentence:clean(r.example_sentence),example_translation:clean(r.example_translation)});
      const result={row:r.row,status:'personal',item,source:'Passport Import',officialId:'',officialRefs:null,candidates:[],errors};
      if(errors.length){result.status='error';rows.push(result);continue}
      const matches=official.filter(x=>lexical(item,x));const supplied=official.find(x=>x.id===r.lexeme_id&&lexical(item,x)&&sameSense(item,x));
      const exact=supplied?[supplied]:matches.filter(x=>sameSense(item,x));
      const existing=personalItems.find(x=>lexical(item,x)&&sameSense(item,x));
      const parent=r.record_type==='SENSE'&&personalItems.find(x=>x.id===r.lexeme_id&&lexical(item,x));
      const declared=r.record_type==='SENSE'&&declaredParents.get(r.lexeme_id);
      if(existing){result.status='duplicate';result.existingId=existing.id;result.officialId=existing.officialId||''}
      else if(exact.length===1){result.status='official';result.officialId=exact[0].id}
      else if(exact.length>1||matches.length>1){result.status='ambiguous';result.candidates=(exact.length?exact:matches).map(x=>({id:x.id,lemma:lemma(x),reading:reading(x),meaning:x.meaning||x.meanings?.[0]}))}
      else if(matches.length===1){result.status='new-sense';result.officialId=matches[0].id;item.newSense=true}
      else if(parent){result.status='new-sense';result.parentId=parent.id;item.newSense=true}
      else if(declared&&lexical(item,declared.item)){result.status='new-sense';result.parentRow=declared.row;item.newSense=true}
      else if(personalItems.some(x=>lexical(item,x))){result.status='ambiguous';result.candidates=personalItems.filter(x=>lexical(item,x)).map(x=>({id:x.id,lemma:lemma(x),reading:reading(x),meaning:x.meaning}));}
      if(result.officialId){const entry=official.find(x=>x.id===result.officialId);if(entry){result.officialRefs={id:entry.id,courseId:entry.courseId||entry.course_id||'',level:entry.level??'',lessonId:entry.lessonId||'',lessonIndex:entry.lessonIndex??'',lessonTitle:entry.lessonTitle||'',routeId:entry.routeId||''};item.officialId=entry.id}}
      const key=identity(item);if(seen.has(key)){result.status='duplicate';result.duplicateOf=seen.get(key)}else seen.set(key,r.row);
      if(r.record_type==='VOCABULARY'&&r.lexeme_id&&result.status!=='ambiguous'&&!declaredParents.has(r.lexeme_id))declaredParents.set(r.lexeme_id,result);
      rows.push(result);
    }
    const errors=[...(parsed.errors||[]),...rows.flatMap(r=>r.errors.map(message=>({row:r.row,message})))];
    return {valid:errors.length===0,errors,warnings:parsed.warnings||[],profile:[],instructions:[],rows,counts:rows.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{})};
  }
  return Object.freeze({VERSION,LANGUAGE,HEADER,LIMITS,START_PROMPT,exportCSV,parseCSV,planImport});
});
