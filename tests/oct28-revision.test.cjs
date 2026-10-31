const test=require('node:test'),assert=require('node:assert/strict');
const content=require('../language-journey-content/content.js');
const {createCrashCourseProbe}=require('./app-probe.cjs');
const json=x=>JSON.parse(JSON.stringify(x));
test('Level 9 keeps six questions per lesson, all spatial contrasts and unique situations across 300 exams',()=>{
  assert.equal(content.manifest.level9ExamAudit.coreWordIds.length,20);
  const seen=new Set(),words=new Set(),contexts=new Set(),before=JSON.stringify(content.manifest.level9ExamBank);
  for(let seed=1;seed<=300;seed++){
    const p=createCrashCourseProbe({seed}),course=p.advancedCourses[8],q=p.buildAdvancedExamQuestions(course),report=p.assertCompactExam(course.lessons,q,30);
    assert.equal(q.length,30);assert.deepEqual(Object.values(report.lessonCounts),[6,6,6,6,6]);assert.equal(report.parts.context,17);
    assert.equal(q.filter(q=>q.kind==='build').length,0,'the same model is not recycled as meaning, order and builder');
    const situations=q.flatMap(item=>item.examSituationIds||[]);
    assert.equal(new Set(situations).size,situations.length,`seed ${seed}: a fact is repeated in another direction or stimulus`);
    for(const plan of content.manifest.level9ExamPlan){
      const selected=q.filter(item=>item.lessonId===plan.lessonId&&item.examPart==='context'),targets=new Set(selected.flatMap(item=>item.targetVocabIds));
      assert.equal(selected.length,plan.contextCount);
      for(const id of plan.requiredTargetIds)assert.ok(targets.has(id),`seed ${seed}: missing ${id}`);
      assert.ok(targets.size>=plan.minimumTargets);
    }
    for(const [lesson,forms] of [[1,['ここ','そこ','あそこ','どこ']],[2,['ひだり','みぎ','まっすぐ']],[3,['まえ','うしろ','となり','なか']],[4,['うえ','した','そと','ちかく']]]){
      const targets=q.filter(item=>item.lessonId===`l9-${lesson}`&&item.examPart==='context').flatMap(item=>item.targetVocabIds);
      for(const form of forms)assert.ok(targets.includes(`vocab-${form}`),`seed ${seed}: ${form} must be tested, not just offered as a distractor`);
    }
    for(const l of course.lessons){const frames={};for(const item of q.filter(q=>q.lessonId===l.id&&q.examFrame))frames[item.examFrame]=(frames[item.examFrame]||0)+1;assert.ok(Object.values(frames).every(count=>count<=2))}
    for(const item of q){assert.ok(item.choices.includes(item.correct));assert.equal(new Set(item.choices).size,item.choices.length);if(item.targetWordId)words.add(item.targetWordId);else contexts.add(item.sourceId)}
    seen.add(q.map(q=>q.sourceId).join('|'));
  }
  assert.equal(words.size,20);assert.equal(contexts.size,44);assert.ok(seen.size>290);
  assert.equal(JSON.stringify(content.manifest.level9ExamBank),before,'selection never mutates the authored bank');
});

test('Level 9 metadata includes answer-option vocabulary while keeping tested targets separate',()=>{
  const bank=content.manifest.level9ExamBank,byId=id=>bank.find(q=>q.sourceId===id);
  for(const q of bank){
    const tokens=new Set([q.prompt,q.context,q.correct,...q.choices].join(' ').split(/[\s。、：！？!?]+/u));
    for(const word of content.manifest.vocabulary.filter(word=>word.coreOrContext!=='legacy'&&tokens.has(word.japanese)))assert.ok(q.usedVocabIds.includes(word.id),`${q.sourceId}: missing ${word.id}`);
    assert.equal(new Set(q.usedVocabIds).size,q.usedVocabIds.length);
    for(const id of q.usedVocabIds)assert.ok(content.pointOrder(content.vocabById[id].introducedAt)<=content.pointOrder(q.lessonId.replace('l','')),`${q.sourceId}: future ${id}`);
    assert.ok(q.targetVocabIds.every(id=>q.usedVocabIds.includes(id)));
    assert.deepEqual(Array.from(q.targetGoalIds),[`grammar:grammar-${q.lessonId}`,`pattern:pattern-${q.lessonId}`]);
  }
  const where=byId('exam-l9-1-where-question-0');
  assert.deepEqual(where.targetVocabIds,['vocab-どこ']);
  for(const id of ['vocab-みせ','vocab-どこ','vocab-ここ','vocab-あそこ'])assert.ok(where.usedVocabIds.includes(id));
  for(const id of ['vocab-まえ','vocab-うしろ','vocab-となり'])assert.ok(byId('exam-l9-3-relative-reading-0').usedVocabIds.includes(id),'Dutch distractors also reference canonical vocabulary');
  for(const id of ['vocab-うえ','vocab-した','vocab-なか','vocab-そと'])assert.ok(byId('exam-l9-4-two-facts-0').usedVocabIds.includes(id));
  const p=createCrashCourseProbe({seed:28}),questions=p.buildAdvancedExamQuestions(p.advancedCourses[8]);
  for(const q of questions.filter(q=>q.targetWordId)){
    assert.deepEqual(Array.from(q.targetVocabIds),[q.targetWordId]);
    assert.equal(q.usedVocabIds.length,3);
    const options=q.usedVocabIds.map(id=>content.vocabById[id][q.targetDirection==='jp-nl'?'meaning':'jp']);
    assert.deepEqual(Array.from(q.choices).sort(),Array.from(options).sort());
  }
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
