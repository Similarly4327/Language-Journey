const test=require('node:test');
const assert=require('node:assert/strict');
const {createCrashCourseProbe}=require('./app-probe.cjs');
const content=require('../language-journey-content/content.js');

const {audit}=require('../scripts/word-coverage-audit.cjs');

test('every lesson and exam in levels 3–10 has exact ID/direction coverage across shuffles',()=>{
  for(let seed=1;seed<=20;seed++){
    const probe=createCrashCourseProbe({seed}),report=audit(probe);
    for(const row of report){
      assert.equal(row.exam.wordTurns,row.exam.wordIds.length*2);
      const lessons=row.level===4?probe.langLessons:row.level===5?probe.smallLessons:probe.advancedCourses[row.level-1]?.lessons||[];
      const questions=row.level===4?probe.buildLanguageExamQuestions():row.level===5?probe.buildSmallExamQuestions():row.level>5?probe.buildAdvancedExamQuestions(probe.advancedCourses[row.level-1]):[];
      const structural=lessons.flatMap(probe.lessonCanonicalGoals).filter(g=>g.kind!=='vocab');
      assert.ok(questions.filter(q=>!q.targetWordId).every(q=>q.category!=='vocab'),'no untracked lexical filler');
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
    const course=p.advancedCourses[5],single=p.buildWordCoveredExam([l],()=>p.advancedQuestionPool(course,l,3).current,5,'test'),shared=p.buildWordCoveredExam([l,l],()=>p.advancedQuestionPool(course,l,3).current,5,'shared');
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
  p.startLanguageExam();p.assertWordCoverage(p.langLessons.flatMap(p.lessonNewWords),p.state.quiz.questions);
  p.startSmallExam();p.assertWordCoverage(p.smallLessons.flatMap(p.lessonNewWords),p.state.quiz.questions);
  assert.equal(JSON.stringify({r:p.rankState,s:p.state.flashcardProgress}),before);
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
