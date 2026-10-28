const test=require('node:test'),assert=require('node:assert/strict');
const content=require('../language-journey-content/content.js');
const {createCrashCourseProbe}=require('./app-probe.cjs');
const json=x=>JSON.parse(JSON.stringify(x));
test('Level 9 has twenty real targets; 80 exams keep six questions per lesson, balanced directions and limited frame repetition',()=>{
  assert.equal(content.manifest.level9ExamAudit.coreWordIds.length,20);
  const seen=new Set(),words=new Set();
  for(let seed=1;seed<=80;seed++){
    const p=createCrashCourseProbe({seed}),course=p.advancedCourses[8],q=p.buildAdvancedExamQuestions(course),report=p.assertCompactExam(course.lessons,q,30);
    assert.equal(q.length,30);assert.deepEqual(Object.values(report.lessonCounts),[6,6,6,6,6]);assert.equal(report.parts.context,17);
    assert.equal(q.filter(q=>q.kind==='build').length,0,'the same model is not recycled as meaning, order and builder');
    for(const l of course.lessons){const frames={};for(const item of q.filter(q=>q.lessonId===l.id&&q.examFrame))frames[item.examFrame]=(frames[item.examFrame]||0)+1;assert.ok(Object.values(frames).every(count=>count<=2))}
    for(const item of q){assert.ok(item.choices.includes(item.correct));assert.equal(new Set(item.choices).size,item.choices.length);if(item.targetWordId)words.add(item.targetWordId)}
    seen.add(q.map(q=>q.sourceId).join('|'));
  }
  assert.equal(words.size,20);assert.ok(seen.size>70);
});
test('new context bank uses only canonical vocabulary available at the lesson boundary; grammar references never use future word tokens',()=>{
  for(const q of content.manifest.level9ExamBank){
    for(const id of q.usedVocabIds){const word=content.vocabById[id];assert.ok(word,id);assert.ok(word.level<=9,id)}
    assert.ok(!JSON.stringify(q).includes('ホテル'));
  }
  for(const g of content.manifest.grammar.filter(g=>g.symbol&&!g.referenceAliasOf)){
    assert.ok(g.romaji&&g.dictionaryMeaning&&g.reference,g.id);assert.ok(g.examples.length>=1&&g.examples.length<=4,g.id);
    if(g.examples.length<3)assert.ok(g.exampleLimitNote,g.id);
    for(const [index,text] of g.examples.entries()){
      assert.ok(g.exampleTranslations[index]?.translation,g.id);
      for(const token of text.split(/[\s。、]+/u)){const word=content.manifest.vocabulary.find(w=>w.coreOrContext!=='legacy'&&w.japanese===token);if(word)assert.ok(content.pointOrder(word.introducedAt)<=content.pointOrder(g.introducedAt),`${g.id}: ${token}`)}
    }
  }
});
test('all official question headers are compact without changing scoring or ranks',()=>{
  const p=createCrashCourseProbe();for(const id of Object.keys(p.rankState))assert.equal(p.quizMetaText({official:true,rankId:id}),'');
  assert.match(p.quizMetaText({official:false}),/Vrij oefenen/);
  p.state.level=8;const questions=p.buildAdvancedExamQuestions(p.advancedCourses[8]);p.startQuiz({source:'advanced',official:true,rankId:'l9-exam',title:'Level 9',questions,pool:[]});p.state.quiz.score=30;p.finishQuiz();assert.equal(p.rankState['l9-exam'].rank,'Copper');assert.equal(p.state.quiz.passed,true);
});
test('a hidden Recall dashboard cannot reclaim Progress on focus, visibility or due refresh; repeated Progress tap stays put',()=>{
  const p=createCrashCourseProbe();p.state.currentCourse='japanese';p.state.progressTab='knowledge';p.openFlashcards();p.renderSession();const before=JSON.stringify({srs:p.state.flashcardProgress,words:p.state.introducedVocabIds,ranks:p.rankState});
  assert.equal(p.document.body.dataset.view,'session');assert.equal(p.state.screen,'flashcards','underlying state is intentionally preserved for navigation');
  p.fireWindowEvent('focus');p.fireDocumentEvent('visibilitychange');p.refreshFlashcardDueDashboard();p.toggleProgress();
  assert.equal(p.document.body.dataset.view,'session');assert.equal(JSON.stringify({srs:p.state.flashcardProgress,words:p.state.introducedVocabIds,ranks:p.rankState}),before);
  p.goToLevels();p.fireWindowEvent('focus');assert.equal(p.document.body.dataset.view,'main');
});
test('Grammatica uses the actual advanced course index and exam history, shares dictionary entries, and renders highlighted examples read-only',()=>{
  const p=createCrashCourseProbe({savedRanks:{'l9-exam':{rank:'Copper',attempts:1}}});p.state.currentLevel=9;
  const de=p.dictionaryById['grammar-l9-5'];assert.ok(p.knowledgeGrammarIsKnown(de));assert.ok(p.dictionarySearch('handeling').some(e=>e.id===de.id));
  const html=p.dictionaryArticleHtml(de),before=JSON.stringify({words:p.state.introducedVocabIds,srs:p.state.flashcardProgress,ranks:p.rankState});assert.match(html,/<mark>で<\/mark>/);assert.match(html,/Level 9/);assert.match(html,/Ik eet brood in het park/);
  p.dictionarySearch('in');p.dictionaryArticleHtml(de);assert.equal(JSON.stringify({words:p.state.introducedVocabIds,srs:p.state.flashcardProgress,ranks:p.rankState}),before);
  const fresh=createCrashCourseProbe();fresh.state.advancedView[8]='lesson';fresh.state.advancedLesson[8]=4;fresh.state.advancedStep[8]='model';assert.ok(fresh.knowledgeGrammarIsKnown(fresh.dictionaryById['grammar-l9-5']));
  assert.equal(p.dictionaryGrammar.filter(e=>e.jp==='へ').length,1);assert.equal(p.dictionaryGrammar.filter(e=>e.jp==='が あります').length,1);
  const to=p.dictionaryGrammar.filter(e=>e.jp==='と');assert.equal(to.length,2);assert.notEqual(to[0].meaning,to[1].meaning);
  assert.ok(!p.dictionaryGrammar.some(e=>e.jp==='て'||e.jp==='ません'),'unintroduced general inflections are not fabricated');
});
