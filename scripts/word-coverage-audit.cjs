const {createCrashCourseProbe}=require('../tests/app-probe.cjs');
const content=require('../language-journey-content/content.js');
// Measured from the working app before the 12 October budget correction.
const previousTotals={3:50,4:68,5:64,6:57,7:59,8:127,9:61,10:51};
function audit(probe){
  return Array.from({length:8},(_,i)=>{
    const level=i+3,lessons=level===4?probe.langLessons:level===5?probe.smallLessons:probe.advancedCourses[level-1]?.lessons||[],budget=probe.examQuestionBudget(level);
    if(level===3)return{level,status:'niet van toepassing',lessons:probe.dakutenPatterns.flatMap(pattern=>['hiragana','katakana'].map(script=>({lessonId:`dak-${script}-${pattern.id}`,wordIds:[],expectedTurns:0,status:'niet van toepassing'}))),exams:['dak-examA','dak-examB'].map(id=>{const q=probe.buildDakExamQuestions(id);return{id,oldTotal:previousTotals[3],oldOver40:true,oldOver100:false,budget,totalQuestions:q.length,parts:{vocab:0,grammar:q.length,context:0},spread:q.reduce((a,q)=>{const key=`${q.item.script}:${q.item.pattern}`;a[key]=(a[key]||0)+1;return a},{}),targetKanaIds:q.map(q=>q.item.id)}})};
    const questions=level===4?probe.buildLanguageExamQuestions():level===5?probe.buildSmallExamQuestions():probe.buildAdvancedExamQuestions(probe.advancedCourses[level-1]),words=[...new Map(lessons.flatMap(probe.lessonNewWords).map(w=>[w.id,w])).values()],balance=probe.assertCompactExam(lessons,questions,budget,`Level ${level}`);
    return{level,status:words.length?'van toepassing':'niet van toepassing',lessons:lessons.map(l=>{
      const words=probe.lessonNewWords(l),deck=probe.wordCrashCourseDeck(words),refs=[...(l.wordIds||[]),...(l.exampleIds||[])],invalidRefs=refs.filter(id=>!content.vocabById[id]),unlinkedIntroductions=words.filter(w=>!refs.includes(w.id)).map(w=>w.id);
      probe.assertWordCoverage(words,deck,l.id);if(invalidRefs.length||unlinkedIntroductions.length)throw new Error(`${l.id}: invalid word references`);
      return{lessonId:l.id,source:`manifest.vocabulary.introducedAt=${l.level}-${l.order}`,status:words.length?'van toepassing':'niet van toepassing',wordIds:words.map(w=>w.id),invalidRefs,unlinkedIntroductions,expectedTurns:words.length*2,coverage:probe.wordCoverageReport(words,deck),blocks:l.microsteps?.map(b=>({wordIds:b.wordIds,expectedTurns:new Set(b.wordIds).size*2}))};
    }),exam:{oldTotal:previousTotals[level],oldOver40:previousTotals[level]>40,oldOver100:previousTotals[level]>100,budget,totalQuestions:questions.length,availableWordIds:words.map(w=>w.id),wordTurns:balance.parts.vocab,parts:balance.parts,directions:balance.directions,lessonCounts:balance.lessonCounts,wordCounts:balance.wordCounts,missingGoals:balance.missing,
      goals:lessons.flatMap(probe.lessonCanonicalGoals).filter(g=>g.kind!=='vocab').map(g=>({id:g.id,lessonId:g.lessonId,questionIds:questions.filter(q=>q.targetGoalIds?.includes(g.id)).map(q=>q.sourceId)})),
      targets:questions.map(q=>({sourceId:q.sourceId,lessonId:q.lessonId,part:q.examPart,wordId:q.targetWordId,direction:q.targetDirection,goalIds:q.targetGoalIds||[]}))}};
  });
}
module.exports={audit};
if(require.main===module){const fs=require('node:fs');fs.mkdirSync('docs/word-coverage',{recursive:true});fs.writeFileSync('docs/word-coverage/audit.json',JSON.stringify(audit(createCrashCourseProbe()),null,2)+'\n')}
