const test=require('node:test');
const assert=require('node:assert/strict');
const {createCrashCourseProbe}=require('./app-probe.cjs');
const content=require('../language-journey-content/content.js');

const {audit}=require('../scripts/word-coverage-audit.cjs');

test('levels 3–10 keep exact lesson word decks and budgeted exams across shuffles',()=>{
  const selections=new Map(),directions=new Map();
  for(let seed=1;seed<=20;seed++){
    const probe=createCrashCourseProbe({seed}),report=audit(probe);
    for(const row of report){
      if(row.level===3){assert.deepEqual(row.exams.map(exam=>exam.id),['dak-examA']);for(const exam of row.exams){assert.equal(exam.totalQuestions,30);assert.ok(Object.values(exam.spread).every(n=>n===3))}continue}
      assert.equal(row.exam.totalQuestions,probe.examQuestionBudget(row.level));
      assert.ok(row.exam.totalQuestions<=40);
      assert.ok(Object.values(row.exam.wordCounts).every(count=>count===1));
      if(!selections.has(row.level)){selections.set(row.level,new Set());directions.set(row.level,new Set())}
      selections.get(row.level).add(Object.keys(row.exam.wordCounts).sort().join('|'));
      directions.get(row.level).add(row.exam.targets.filter(q=>q.wordId).map(q=>`${q.wordId}:${q.direction}`).sort().join('|'));
      const lessons=row.level===4?probe.langLessons:row.level===5?probe.smallLessons:probe.advancedCourses[row.level-1]?.lessons||[];
      const questions=row.level===4?probe.buildLanguageExamQuestions():row.level===5?probe.buildSmallExamQuestions():row.level>5?probe.buildAdvancedExamQuestions(probe.advancedCourses[row.level-1]):[];
      const structural=lessons.flatMap(probe.lessonCanonicalGoals).filter(g=>g.kind!=='vocab');
      probe.assertCompactExam(lessons,questions,probe.examQuestionBudget(row.level));
      assert.ok(questions.filter(q=>!q.targetWordId).every(q=>q.category!=='vocab'),'no untracked lexical filler');
      if(row.level===5){
        const forms=new Map(probe.smallLessons.flatMap(lesson=>lesson.newItems||[]).map(([form,reading])=>[form,reading]));
        const sounds=questions.filter(q=>(q.targetGoalIds||[]).some(goal=>goal.startsWith('kana:')));
        assert.equal(sounds.length,forms.size,'the exam tests each Level 5 kana sign once');
        for(const question of sounds){
          const form=question.targetGoalIds.find(goal=>goal.startsWith('kana:')).slice(5);
          assert.equal(question.prompt,form,`${form} is shown before the answer`);
          assert.equal(question.correct,forms.get(form),`${form} is tested toward its sound`);
          assert.match(question.instruction,/uitspraak|spreek/iu,`${form} asks about pronunciation`);
          assert.ok(question.choices.includes(question.correct));
          assert.ok(question.choices.every(choice=>!/[\u3040-\u30ff\u3400-\u9fff]/u.test(choice)),`${form} offers sounds rather than kana or meanings`);
        }
      }
      const currentWords=lessons.flatMap(probe.lessonNewWords);
      for(const q of questions.filter(q=>q.kind!=='build')){const matches=currentWords.filter(w=>q.correct===w.jp||q.correct===w.meaning);if(matches.length===1)assert.equal(q.targetWordId,matches[0].id,'a focus or agenda answer that tests a word consumes that word’s single exam turn')}
      for(const q of questions.filter(q=>q.targetWordId)){
        const word=content.vocabById[q.targetWordId];
        assert.equal(q.correct,q.targetDirection==='jp-nl'?word.meaning:word.jp,'declared direction matches the tested answer');
      }
      for(const goal of structural)assert.ok(questions.some(q=>q.targetGoalIds.includes(goal.id)),`${goal.id} preserved`);
      for(const lesson of lessons){
        const refs=[...(lesson.wordIds||[]),...(lesson.exampleIds||[])];
        for(const id of refs)assert.ok(content.vocabById[id],`${lesson.id}: ${id} valid`);
        for(const w of probe.lessonNewWords(lesson))assert.ok(refs.includes(w.id),`${lesson.id}: ${w.id} linked`);
      }
    }
  }
  for(let level=4;level<=10;level++){assert.ok(selections.get(level).size>5,`Level ${level} varies its sampled words`);assert.ok(directions.get(level).size>5,`Level ${level} varies word directions`)}
});

test('Level 3 Exam B is retired while historical ranks and Exam A remain intact',()=>{
  const p=createCrashCourseProbe({savedRanks:{'dak-examA':{rank:'Copper',attempts:2},'dak-examB':{rank:'Gold',attempts:4}}});
  assert.deepEqual(Array.from(p.levelRankIds(2)),['dak-examA']);
  assert.equal(p.levelRank(2),'Copper','the retained Exam B rank does not change Level 3 rank');
  assert.equal(p.rankState['dak-examB'].rank,'Gold','legacy rank stays stored');
  assert.deepEqual(Array.from(p.buildDakExamQuestions('dak-examB')),[],'the retired exam has no question source');
  p.state.quiz=null;p.startDakExam('dak-examB');assert.equal(p.state.quiz,null,'retired exam cannot be started by its old ID');
  p.startDakExam('dak-examA');assert.ok(p.state.quiz.questions.every(q=>q.type==='kana'&&q.mode==='forward'));
  for(const rank of Object.keys(p.rankState))if(rank!=='dak-examB')p.rankState[rank].rank='Copper';
  assert.doesNotMatch(p.recommendedNextStep(),/dak-examB|Examen B/i,'recommendations ignore the retired exam');
});

test('level-exam question headers omit the repeated rank notice without changing other quiz guidance',()=>{
  const p=createCrashCourseProbe();
  for(let level=0;level<12;level++){
    p.state.level=level;
    for(const id of p.levelRankIds(level))assert.equal(p.quizMetaText({official:true,rankId:id}),'',`${id} keeps a compact question header`);
  }
  p.state.level=4;
  assert.equal(p.quizMetaText({official:true,rankId:'l5-1'}),'Deze toets kan de sessierank maximaal één stap verhogen.','lesson checks retain their rank guidance');
  assert.equal(p.quizMetaText({official:false}),'Vrij oefenen / snelle check · geen rankstap.','free practice retains its own explanation');
});

test('four words, small sets and duplicate/shared IDs do not change mandatory turns',()=>{
  const orders=new Set();
  for(let seed=1;seed<=30;seed++){
    const p=createCrashCourseProbe({seed}),l=p.advancedCourses[5].lessons[3],words=p.lessonNewWords(l);
    for(const set of [words,words.slice(0,1),words.slice(0,2),[...words,words[0],words[1]]]){
      const deck=p.wordCrashCourseDeck(set);p.assertWordCoverage(set,deck);
      assert.equal(deck.length,new Set(set.map(w=>w.id)).size*2);
      if(new Set(set.map(w=>w.id)).size>1)assert.ok(deck.every((q,i)=>!i||q.word.id!==deck[i-1].word.id));
      assert.ok(deck.every(q=>!q.context&&!q.instruction&&!q.prompt&&q.choices.length>=2));
    }
    orders.add(p.wordCrashCourseDeck(words).map(q=>q.key).join(','));
    const course=p.advancedCourses[5],single=p.buildWordCoveredExam([l],()=>p.advancedQuestionPool(course,l,3).current,10,'test'),shared=p.buildWordCoveredExam([l,l],()=>p.advancedQuestionPool(course,l,3).current,10,'shared');
    assert.equal(shared.filter(q=>q.targetWordId).length,single.filter(q=>q.targetWordId).length);
    assert.throws(()=>p.assertWordCoverage(words,[...p.wordCrashCourseDeck(words),p.wordCrashCourseDeck(words)[0]]));
  }
  assert.ok(orders.size>10,'real shuffled orders');
});

test('UI handlers for practice and exams use the covered generators and preserve progress',()=>{
  const p=createCrashCourseProbe({savedRanks:{'l4-1':{rank:'Copper',attempts:7}},savedState:{introducedVocabIds:['vocab-ねこ'],flashcardProgress:{cards:{'vocab-ねこ::jp-nl':{dueAt:12345,repetitions:3}}}}});
  const before=JSON.stringify({r:p.rankState,s:p.state.flashcardProgress});
  p.renderLanguageModel(p.langLessons[1],1);p.element('modelNext').onclick();
  p.assertWordCoverage(p.lessonNewWords(p.langLessons[1]),p.activeWordCrashCourse.deck);p.leaveWordCrashCourse();
  p.renderSmallLessonCard(p.smallLessons[0],0);p.element('smallQuick').onclick();
  p.assertWordCoverage(p.lessonNewWords(p.smallLessons[0]),p.activeWordCrashCourse.deck);p.leaveWordCrashCourse();
  p.startLanguageExam();p.assertCompactExam(p.langLessons,p.state.quiz.questions,30);
  p.startSmallExam();p.assertCompactExam(p.smallLessons,p.state.quiz.questions,30);
  assert.equal(JSON.stringify({r:p.rankState,s:p.state.flashcardProgress}),before);
  const srs=JSON.stringify(p.state.flashcardProgress);p.startLanguageExam();
  p.state.quiz.score=p.state.quiz.questions.length;p.state.quiz.index=p.state.quiz.questions.length;p.finishQuiz();
  assert.equal(p.element('resultScore').textContent,'30 / 30');assert.equal(p.rankState['l4-exam'].rank,'Copper');
  assert.equal(p.rankState['l4-1'].attempts,7);assert.equal(JSON.stringify(p.state.flashcardProgress),srs);
  const saved=p.saved(),reloaded=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks});
  assert.equal(reloaded.rankState['l4-exam'].rank,'Copper');assert.equal(JSON.stringify(reloaded.state.flashcardProgress),srs);
  p.startDakExam('dak-examA');assert.ok(p.state.quiz.questions.every(q=>!q.targetWordId));
  p.startDakExam('dak-examB');assert.ok(p.state.quiz.questions.every(q=>!q.targetWordId));
});

test('old eight-turn month checkpoint resumes as four unique turns without losing saved progress',()=>{
  let p=createCrashCourseProbe();
  const lesson=p.advancedCourses[7].lessons[3];p.startMonthPractice(lesson);
  const round=p.activeWordCrashCourse,records=round.deck.map(q=>({wordId:q.word.id,direction:q.direction,choices:q.choices,revealed:true,answered:false,feedback:null}));
  const queue=[...records,...records.map(q=>({...q}))];
  for(let i=0;i<3;i++)queue[i]={...queue[i],answered:true,feedback:{correct:true,selected:round.deck[i].correct}};
  const saved=p.saved();saved.state.monthLearning.practice[0]={phase:'initial',index:3,initialCorrect:3,deck:queue,queue,missed:[]};
  const original=JSON.stringify(saved);
  p=createCrashCourseProbe({savedState:saved.state,savedRanks:saved.ranks});p.startMonthPractice(p.advancedCourses[7].lessons[3]);
  assert.equal(p.activeWordCrashCourse.deck.length,4);assert.equal(p.activeWordCrashCourse.index,3);assert.equal(p.activeWordCrashCourse.initialCorrect,3);
  p.assertWordCoverage(p.activeWordCrashCourse.words,p.activeWordCrashCourse.deck);
  assert.equal(JSON.stringify(saved),original,'input storage snapshot not mutated');
});

module.exports={audit};
