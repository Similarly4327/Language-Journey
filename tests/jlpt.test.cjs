const test=require('node:test'),assert=require('node:assert/strict');
const content=require('../language-journey-content/content.js');
const benchmark=require('../language-journey-content/jlpt-benchmark.js');
const guideline=require('../language-journey-content/jlpt-guideline.js');
const {createCrashCourseProbe}=require('./app-probe.cjs');
const json=x=>JSON.parse(JSON.stringify(x));
const now=Date.parse('2026-10-29T10:00:00Z');
const card={repetitions:3,intervalDays:7,lapses:0,lastGrade:'knew',lastReviewedAt:now-86400000,dueAt:now+6*86400000};
const item=benchmark.items.find(i=>i.knowledgeItemId==='vocab-ねこ');
const evidence=(introduced=[],cards={})=>({isIntroduced:id=>introduced.includes(id),srsRecord:(id,direction)=>cards[`${id}::${direction}`]||null});
const reviewedVocabulary=()=>{const b=json(benchmark);b.tiers.N5.domains.vocabulary='reviewed';return b};

test('benchmark IDs resolve canonically and all unfinished tiers suppress percentages',()=>{
  assert.deepEqual(guideline.validate(benchmark,content),[]);
  assert.ok(benchmark.items.length>800);
  assert.ok(benchmark.items.some(i=>i.knowledgeItemId===null),'missing curriculum stays in denominator');
  const selected=guideline.select(benchmark,evidence(),now);
  for(const tier of selected){assert.equal(tier.masteryPercent,null);for(const domain of Object.values(tier.domains))assert.equal(domain.masteryPercent,null)}
});

test('exposure precedes SRS evidence; expiry and one-direction weakness never erase introduction',()=>{
  const id=item.knowledgeItemId,cards={[`${id}::jp-nl`]:card,[`${id}::nl-jp`]:card};
  assert.equal(guideline.vocabularyStatus(id,evidence([],cards),now),'unseen','future SRS cannot introduce a word');
  assert.equal(guideline.vocabularyStatus(id,evidence([id]),now),'practicing');
  assert.equal(guideline.vocabularyStatus(id,evidence([id],cards),now),'stable');
  assert.equal(guideline.vocabularyStatus(id,evidence([id],cards),card.dueAt),'needs-review');
  cards[`${id}::nl-jp`]={...card,repetitions:0,lastGrade:'again'};
  assert.equal(guideline.vocabularyStatus(id,evidence([id],cards),now),'practicing');
  const before=json(cards),v=guideline.select(reviewedVocabulary(),evidence([id],cards),now)[0].domains.vocabulary;
  assert.equal(v.introduced,1);assert.equal(v.stable,0);assert.deepEqual(cards,before);
});

test('vocabulary success cannot manufacture grammar/kanji/reading/listening or an overall score',()=>{
  const b=reviewedVocabulary(),ids=b.items.filter(i=>i.category==='vocabulary'&&i.knowledgeItemId&&i.mappingScope==='exact').map(i=>i.knowledgeItemId);
  const selected=guideline.select(b,{isIntroduced:id=>ids.includes(id),srsRecord:()=>card},now);
  assert.ok(selected[0].domains.vocabulary.masteryPercent>0);
  assert.equal(selected[0].masteryPercent,null);
  for(const category of ['grammar','kanji','reading','listening'])assert.equal(selected[0].domains[category].masteryPercent,null);
  assert.equal(selected[1].domains.vocabulary.masteryPercent,null,'unbuilt N4 does not recycle N5 percentage');
  assert.equal(selected[1].domains.vocabulary.introduced,selected[0].domains.vocabulary.introduced,'higher-tier prerequisites are cumulative');
});

test('validator catches orphan IDs, duplicate canonical mappings, future leakage and unsupported classifications',()=>{
  const b=json(benchmark);b.items[0].knowledgeItemId='vocab-does-not-exist';assert.ok(guideline.validate(b,content).some(e=>e.includes('Orphan')));
  b.items.push({...item,id:'duplicate-canonical'});assert.ok(guideline.validate(b,content).some(e=>e.includes('Duplicate canonical')));
  b.items.find(i=>i.id===item.id).introducedAt='1-1';assert.ok(guideline.validate(b,content).some(e=>e.includes('Future leakage')));
  b.items[1].classification='core';assert.ok(guideline.validate(b,content).some(e=>e.includes('three item-level')));
  b.items[1].provenance=['sensei','senseiGrammar','senseiKanji'];
  assert.ok(guideline.validate(b,content).some(e=>e.includes('three item-level')),'three pages from the same publisher are not independent references');
});

test('higher-level overlap can be introduced before lower mastery, while LJ extras never inflate coverage',()=>{
  const b=json(benchmark),extra={id:'test-n4-request',jlptLevel:'N4',category:'vocabulary',classification:'lj-extra',knowledgeItemId:'vocab-よんでください',mappingScope:'exact',provenance:['jtest']};b.items.push(extra);
  const e=evidence([extra.knowledgeItemId]),first=guideline.select(b,e,now);
  assert.equal(first[0].domains.vocabulary.introduced,0);assert.equal(first[1].domains.vocabulary.introduced,0);
  extra.classification='margin';const second=guideline.select(b,e,now);
  assert.equal(second[0].domains.vocabulary.introduced,0);assert.equal(second[1].domains.vocabulary.introduced,1);assert.equal(second[1].masteryPercent,null);
});

test('app uses the same Dictionary exposure and preserves both SRS directions, ranks and profile across render/reload',()=>{
  const id=item.knowledgeItemId,cards={[`${id}::jp-nl`]:card,[`${id}::nl-jp`]:{...card,intervalDays:14,repetitions:4}};
  const p=createCrashCourseProbe({now,savedState:{userName:'Sven',introducedVocabIds:[id],vocabFirstSeen:{[id]:'2026-10-28'},flashcardProgress:{cards},flashcardSelection:{auto:false,lessonIds:[]}},savedRanks:{'l4-1':{rank:'Gold',attempts:3}}});
  p.state.primaryTab='progress';
  const before=json(p.saved());
  const first=p.jlptProgressSummary()[0].domains.vocabulary;
  assert.equal(first.items.find(i=>i.knowledgeItemId===id).status,'stable');
  assert.match(p.jlptProgressHtml(),/Indicatief JLPT-niveau/);
  assert.match(p.jlptProgressHtml(),/In opbouw/);assert.doesNotMatch(p.jlptProgressHtml(),/\d+%/);
  p.state.progressTab='progress';p.renderSession();
  assert.deepEqual(json(p.saved()),before,'rendering never mutates learning/storage data');
  const reloaded=createCrashCourseProbe({now,savedState:before.state,savedRanks:before.ranks,version:before.version});
  assert.deepEqual(json(reloaded.state.flashcardProgress.cards),json(p.state.flashcardProgress.cards));
  assert.equal(reloaded.state.userName,'Sven');assert.equal(reloaded.rankState['l4-1'].rank,'Gold');
  assert.deepEqual(json(reloaded.jlptProgressSummary()),json(p.jlptProgressSummary()));
});

test('later actual introductions join the read-only selector while future catalog searches do not',()=>{
  const p=createCrashCourseProbe({now});const initial=p.jlptProgressSummary()[0].domains.vocabulary.introduced;
  p.dictionarySearch('ねこ');assert.equal(p.jlptProgressSummary()[0].domains.vocabulary.introduced,initial);
  p.state.introducedVocabIds.push('vocab-ねこ');assert.equal(p.jlptProgressSummary()[0].domains.vocabulary.introduced,initial+1);
  p.state.flashcardSelection.auto=false;p.state.flashcardSelection.lessonIds=[];
  assert.equal(p.jlptProgressSummary()[0].domains.vocabulary.introduced,initial+1,'free-practice scope does not redefine learned knowledge');
});
