const test=require('node:test');
const assert=require('node:assert/strict');
const csv=require('../passport-csv.js');
const word={id:'vocab-sweet',lemma:'甘い',reading:'あまい',meaning:'zoet',level:12,lessonId:'l12'};
const file=items=>csv.exportCSV({profile:{native_language:'nl',jlpt:{N5:12}},items});
test('Passport CSV round-trips Unicode, formulas, apostrophes and multiline quoted fields',()=>{
  const special=['=SUM(1,2)',"'=literal",'  @command','-1','日本語, "hoi"\r\nregel',''];
  for(const value of special){const out=csv.exportCSV({profile:{note:value}});assert.ok(out.startsWith('\uFEFF'));const p=csv.parseCSV(out);assert.equal(p.valid,true);assert.equal(p.rows[0].value,value);assert.equal(p.rows[1].record_type,'INSTRUCTION');assert.ok(p.rows.every(r=>csv.HEADER.every(k=>typeof r[k]==='string')))}
});
test('Excel semicolon accepted only with exact fixed header; malformed rows version and language fail',()=>{
  const text=file([word]);const Papa=require('../assets/vendor/papaparse.min.js');const data=Papa.parse(text.replace(/^\uFEFF/,'')).data;const semi=Papa.unparse(data,{delimiter:';'});assert.equal(csv.parseCSV(semi).delimiter,';');
  assert.equal(csv.parseCSV('a,b\n1,2').valid,false);
  assert.equal(csv.parseCSV(text.replace('"1"','"999"')).valid,false);
  assert.equal(csv.parseCSV(text.replace('"ja"','"en"')).valid,false);
  assert.equal(csv.parseCSV(text+'"bad"\r\n').valid,false);
  assert.equal(csv.parseCSV('x'.repeat(csv.LIMITS.bytes+1)).valid,false);
});
test('matching verifies IDs and preserves homophones; new meanings remain separate',()=>{
  const registry=[word,{id:'bridge',lemma:'はし',reading:'はし',meaning:'brug'},{id:'sticks',lemma:'はし',reading:'はし',meaning:'eetstokjes'}];
  const input=[{...word,id:'forged',knowledge_status:'mastered',course_level:99,audio_ref:'evil'}, {...word,id:'vocab-sweet',meaning:'toegeeflijk'}, {lemma:'はし',reading:'はし',meaning:'onzeker'},{id:'vocab-sweet',lemma:'かわいい',reading:'かわいい',meaning:'schattig'}];
  const plan=csv.planImport(file(input),{registry});assert.equal(plan.valid,true);
  assert.deepEqual(plan.rows.map(r=>r.status),['official','new-sense','ambiguous','personal']);assert.equal(plan.rows[0].officialRefs.level,12);assert.equal(plan.rows[0].item.source,'Passport Import');assert.equal(plan.rows[0].item.audio_ref,undefined);assert.equal(plan.rows[3].officialId,'');
});
test('planning is pure, duplicates within import and existing personal senses are idempotent',()=>{
  const registry=[word],personal=[{id:'local-1',lemma:'怖い',reading:'こわい',meaning:'eng'}];const before=JSON.stringify({registry,personal});
  const result=csv.planImport(file([personal[0],word,word]),{registry,personalItems:personal});assert.deepEqual(result.rows.map(x=>x.status),['duplicate','official','duplicate']);assert.equal(result.rows[0].existingId,'local-1');assert.equal(JSON.stringify({registry,personal}),before);
});
test('records for supporting knowledge and context have one width and preserve text',()=>{
  const p=csv.parseCSV(file([{...word,contexts:[{example_sentence:'これは、あまい。',example_translation:'Dit is zoet.'}]},{kind:'particle',lemma:'は',reading:'わ',meaning:'onderwerp'},{kind:'grammar',lemma:'です',meaning:'beleefde afsluiting'},{kind:'script',lemma:'あ',meaning:'a'},{kind:'kanji',lemma:'日',meaning:'dag'}]));assert.equal(p.valid,true);assert.deepEqual(p.rows.slice(3).map(x=>x.record_type),['VOCABULARY','CONTEXT','PARTICLE','GRAMMAR','SCRIPT','KANJI']);assert.equal(p.rows[4].example_sentence,'これは、あまい。');
});
