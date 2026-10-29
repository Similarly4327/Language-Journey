/* Reproducible audit of the canonical registry and the actual app generators.
   Runs only synthetic, empty/specified storage; never reads a user's browser. */
const fs=require('node:fs'),path=require('node:path');
const content=require('../language-journey-content/content.js');
const benchmark=require('../language-journey-content/jlpt-benchmark.js');
const selectors=require('../language-journey-content/jlpt-guideline.js');
const {createCrashCourseProbe}=require('../tests/app-probe.cjs');
const {audit:wordAudit}=require('./word-coverage-audit.cjs');
const {validate}=require('../language-journey-content/validate.cjs');
const unique=values=>[...new Set(values)];
const m=content.manifest;
function audit(){
  const p=createCrashCourseProbe({seed:29});
  const core=m.vocabulary.filter(w=>w.coreOrContext==='core');
  // A real introduction clears migration deferrals; model that state explicitly.
  p.state.deferredVocabIntroductions=[];
  const introduced=p.state.introducedVocabIds=core.map(w=>w.id);
  const introductionOnlyEligible=new Set(p.flashcardEligibleCards().map(w=>w.id));
  const dictionaryKnown=new Set(core.filter(w=>p.knowledgeWordIsKnown(p.dictionaryById[w.id])).map(w=>w.id));
  for(const record of Object.values(p.rankState))record.rank='Copper';
  const passedEligible=new Set(p.flashcardEligibleCards().map(w=>w.id));
  const items=[
    ...m.vocabulary.map(w=>({id:w.id,type:'vocabulary',canonicalSource:'manifest.vocabulary',canonicalJapanese:w.japanese,reading:w.reading,meaning:w.meaning,introducedAt:w.introducedAt,classification:w.coreOrContext,lessons:m.lessons.filter(l=>[...(l.wordIds||[]),...(l.exampleIds||[])].includes(w.id)).map(l=>l.id),dictionaryAfterIntroduction:dictionaryKnown.has(w.id),recallAfterIntroduction:introductionOnlyEligible.has(w.id),recallAfterPass:passedEligible.has(w.id),recallDirections:['jp-nl','nl-jp'],legacy:w.coreOrContext==='legacy',benchmarkIds:benchmark.items.filter(i=>i.knowledgeItemId===w.id).map(i=>i.id),notes:w.partOfSpeech==='request-phrase'?['Lexical request chunk; not a freely generated sentence.']:[]})),
    ...m.grammar.map(g=>({id:g.id,type:'grammar',canonicalSource:'manifest.grammar',introducedAt:g.introducedAt,lessons:m.lessons.filter(l=>l.grammarIds?.includes(g.id)).map(l=>l.id),dictionaryVisible:!!g.symbol&&!g.referenceAliasOf,aliasOf:g.referenceAliasOf||null,evidence:'exposure/lesson aggregate; no function-level mastery',benchmarkIds:benchmark.items.filter(i=>i.knowledgeItemId===g.id).map(i=>i.id)})),
    ...m.kanji.map(k=>({id:k.id,type:'kanji',canonicalSource:'manifest.kanji',introducedAt:k.introducedAt,kind:k.kind,evidence:'no representation-specific mastery',benchmarkIds:benchmark.items.filter(i=>i.knowledgeItemId===k.id).map(i=>i.id)})),
    ...m.readings.map(r=>({id:r.id,type:'reading',canonicalSource:'manifest.readings',introducedAt:r.introducedAt,lessons:[r.lessonId].filter(Boolean),questionAvailable:!!r.question,evidence:'lesson/check aggregate; no durable per-reading comprehension record'})),
    ...['hiragana','katakana'].flatMap(script=>m.kana[script].flatMap((row,index)=>row.map(([form])=>({id:`kana-${script}-${form}`,type:'kana',canonicalSource:`manifest.kana.${script}`,introducedAt:`1-${index+1}`,masteryId:`${script}-${form}`})))),
    ...m.kana.dakutenPatterns.flatMap(pattern=>['hiragana','katakana'].flatMap(script=>(script==='hiragana'?pattern.newH:pattern.newK).map(([form])=>({id:`kana-${script}-${form}`,type:'kana',canonicalSource:'manifest.kana.dakutenPatterns',introducedAt:'3-1',masteryId:`dak-${script}-${form}`})))),
    ...m.kana.small.map(item=>({id:`kana-extension-${item.form}`,type:'kana',canonicalSource:'manifest.kana.small',introducedAt:item.introducedAt}))
  ];
  const vocabularyPractice=wordAudit(createCrashCourseProbe({seed:29}));
  const inspections=[];
  function inspect(q,lessonId,scope){
    const answer=q.correct??q.answer,choices=q.choices||[];
    const flags=[];
    if(q.kind==='build')return;
    if(choices.length&&(!choices.includes(answer)||unique(choices).length!==choices.length))flags.push('invalid-or-duplicate-options');
    const context=q.context||'';
    if(context&&String(answer).length>1&&context.includes(answer))flags.push('answer-literally-in-visible-context');
    const jp=s=>/[\u3040-\u30ff\u3400-\u9fff]/u.test(s);
    if(choices.length>1&&jp(answer)&&choices.filter(jp).length===1)flags.push('only-japanese-option');
    if(flags.length)inspections.push({lessonId,scope,sourceId:q.sourceId||null,prompt:q.prompt,context,answer,choices,flags});
  }
  const levels=Array.from({length:20},(_,i)=>{
    const level=i+1,meta=m.levels.find(l=>l.number===level)||m.phases.flatMap(p=>p.levels).find(l=>l.number===level);
    const lessons=m.lessons.filter(l=>l.level===level).map(l=>{
      let pool=[],check=[];
      if(level===4){pool=p.level4QuestionBank(l.order-1).filter(q=>(q.introducedAt??0)===l.order-1);check=p.balancedLevel4Questions(l.order-1,10)}
      if(level===5){pool=p.smallQuestionPool(l);check=p.smallLessonQuestions(l)}
      if(level>=6&&level<=10){pool=p.advancedQuestionPool(p.advancedCourses[level-1],l,l.order-1).current;check=p.advancedQuestions(p.advancedCourses[level-1],l,l.order-1)}
      if(level>=11){pool=l.integrationExam?p.buildLevel11IntegrationQuestions():p.thematicQuestions(l);check=pool}
      check.forEach(q=>inspect(q,l.id,'lesson-check'));
      const wordIds=unique([...(l.wordIds||[]),...(l.exampleIds||[])]),newWordIds=core.filter(w=>Number(w.introducedAt.split('-')[0])===level&&Number(w.introducedAt.split('-')[1])===l.order).map(w=>w.id);
      return {id:l.id,title:l.title,canDo:l.didactics?.canDo||l.goal||l.objective||null,wordIds,newWordIds,grammarIds:l.grammarIds||[],patternIds:l.patternIds||[],readingIds:unique([l.readingId,...(l.applications||[]).map(a=>a.readingId)].filter(Boolean)),listening:'optional pronunciation with visible text; no isolated listening comprehension evidence',questionPool:pool.map(q=>({id:q.sourceId||null,kind:q.kind,category:q.category||null,targets:q.targetGoalIds||[],wordIds:q.targetWordId?[q.targetWordId]:q.targetVocabIds||q.vocabIds||[],direction:q.targetDirection||q.vocabDirection||null,context:!!q.context})),checkQuestions:check.length,checkGoalsMissing:level<=10?p.lessonCoverageReport(l,check).missing.map(g=>g.id):null,recallAfterPass:wordIds.filter(id=>passedEligible.has(id)),recallMissingAfterPass:newWordIds.filter(id=>!passedEligible.has(id)),dictionaryMissing:newWordIds.filter(id=>!dictionaryKnown.has(id))};
    });
    const newWords=core.filter(w=>Number(w.introducedAt?.split('-')[0])===level);
    const wordCheck=vocabularyPractice.find(row=>row.level===level);
    const foundation=level===1?{kana:items.filter(i=>i.type==='kana'&&i.introducedAt.startsWith('1-')).map(i=>i.id),numberLessons:m.numbers.lessons.map((l,index)=>({id:l.id||`number-instruction-${index}`,values:l.values,official:!!l.official})),notes:'Kana/numbers UI uses generators outside manifest.lessons.'}:level===2?{kana:'Hiragana + katakana combined; both script directions',notes:'Recombines Level 1, not new lexical words.'}:level===3?{kana:items.filter(i=>i.type==='kana'&&i.introducedAt==='3-1').map(i=>i.id),notes:'Dakuten/handakuten sound targets, no pure lexical round.'}:null;
    
    return {level,title:meta?.theme||meta?.title||'Onbekend',status:meta?.status||'placeholder',foundation,uniqueIntroductions:newWords.length,grammarIntroductions:m.grammar.filter(g=>!g.referenceAliasOf&&Number(g.introducedAt?.split('-')[0])===level).map(g=>g.id),kanjiIntroductions:m.kanji.filter(k=>Number(k.introducedAt?.split('-')[0])===level).map(k=>k.id),lessons,pureWordPractice:wordCheck||null,exam:level===11?{questions:p.buildLevel11IntegrationQuestions().length,kind:'integration',scope:'lessons 1–4'}:level>=12&&level<=15?{questions:null,kind:'lesson-checks-only',note:'No standalone cumulative level exam in thematic UI.'}:wordCheck?.exam?{questions:wordCheck.exam.totalQuestions,budget:wordCheck.exam.budget,missingGoals:wordCheck.exam.missingGoals}:wordCheck?.exams||null};
  });
  const milestones=[10,15,20].map(level=>{
    const counts={};
    for(const category of selectors.categories){
      const all=benchmark.items.filter(i=>i.category===category&&i.classification!=='lj-extra'),mapped=all.filter(i=>i.knowledgeItemId&&i.mappingScope==='exact'),partial=all.filter(i=>i.knowledgeItemId&&i.mappingScope==='partial');
      const before=item=>{const source=items.find(s=>s.id===item.knowledgeItemId);return source&&(category!=='vocabulary'||source.lessons.length>0)&&Number(source.introducedAt.split('-')[0])<=level};
      counts[category]={provisionalDenominator:all.length,exactMappedByMilestone:mapped.filter(before).length,partialMappedByMilestone:partial.filter(before).length,provisionalContentPercent:category==='vocabulary'?Math.round(100*mapped.filter(before).length/all.length):null};
    }
    return {level,status:level===20?'incomplete-curriculum-no-L16-20-content':'implemented',overallN5Percent:null,counts};
  });
  const dependencies=[];
  for(const exercise of m.exercises){const lesson=m.lessons.find(l=>l.id===exercise.lessonId);if(!lesson)continue;const boundary=`${lesson.level}-${lesson.order}${lesson.level>=11?'-B':''}`;for(const id of exercise.requiredVocabIds||[]){const word=content.vocabById[id];if(word&&content.pointOrder(word.introducedAt)>content.pointOrder(boundary))dependencies.push({exerciseId:exercise.id,wordId:id,boundary,introducedAt:word.introducedAt})}}
  return {schemaVersion:1,generatedFrom:{contentVersion:m.contentVersion,benchmarkVersion:benchmark.version},summary:{levelsImplemented:m.levels.length,lessons:m.lessons.length,canonicalWords:m.vocabulary.length,currentWords:core.length,legacyWords:m.vocabulary.filter(w=>w.coreOrContext==='legacy').length,previewWords:m.vocabulary.filter(w=>w.coreOrContext==='preview').length,grammar:m.grammar.length,kanji:m.kanji.length,readings:m.readings.length,recallAfterIntroduction:introductionOnlyEligible.size,recallAfterPass:passedEligible.size,requestChunks:m.vocabulary.filter(w=>w.partOfSpeech==='request-phrase').map(w=>w.id)},sources:benchmark.sources,benchmarkLimitations:benchmark.limitations,levels,items,milestones,optionReview:{method:'deterministic flags for human review; literal retrieval is not automatically a defect',flags:inspections},futureDependencyLeaks:dependencies,contentValidation:validate(),benchmarkValidation:selectors.validate(benchmark,content)};
}
if(require.main===module){const report=audit();fs.mkdirSync(path.join(__dirname,'../docs/jlpt'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../docs/jlpt/inventory.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({summary:report.summary,milestones:report.milestones,optionFlags:report.optionReview.flags.length,leaks:report.futureDependencyLeaks.length,benchmarkErrors:report.benchmarkValidation},null,2));if(report.benchmarkValidation.length||report.futureDependencyLeaks.length||report.contentValidation.counts.ERROR)process.exitCode=1}
module.exports={audit};
