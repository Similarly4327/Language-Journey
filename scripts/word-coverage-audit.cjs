const {createCrashCourseProbe}=require('../tests/app-probe.cjs');
function audit(probe){
  return Array.from({length:8},(_,i)=>{
    const level=i+3,lessons=level===4?probe.langLessons:level===5?probe.smallLessons:probe.advancedCourses[level-1]?.lessons||[];
    const questions=level===4?probe.buildLanguageExamQuestions():level===5?probe.buildSmallExamQuestions():level>5?probe.buildAdvancedExamQuestions(probe.advancedCourses[level-1]):[];
    const words=[...new Map(lessons.flatMap(probe.lessonNewWords).map(w=>[w.id,w])).values()];
    probe.assertWordCoverage(words,questions,`Level ${level}`);
    const kanaExams=level===3?['dak-examA','dak-examB'].map(id=>{probe.startDakExam(id);return{id,questions:probe.state.quiz.questions.length,wordTurns:0}}):undefined;
    return {level,status:words.length?'van toepassing':'niet van toepassing',kanaExams,lessons:lessons.map(l=>{
      const words=probe.lessonNewWords(l),deck=probe.wordCrashCourseDeck(words);
      probe.assertWordCoverage(words,deck,l.id);
      const refs=[...(l.wordIds||[]),...(l.exampleIds||[])],invalidRefs=refs.filter(id=>!contentWord(id)),unlinkedIntroductions=words.filter(w=>!refs.includes(w.id)).map(w=>w.id);
      if(invalidRefs.length||unlinkedIntroductions.length)throw new Error(`${l.id}: invalid word references`);
      return {lessonId:l.id,source:`manifest.vocabulary.introducedAt=${l.level}-${l.order}`,wordIds:words.map(w=>w.id),invalidRefs,unlinkedIntroductions,expectedTurns:words.length*2,coverage:probe.wordCoverageReport(words,deck),blocks:l.microsteps?.map(b=>({wordIds:b.wordIds,expectedTurns:new Set(b.wordIds).size*2}))};
    }),exam:{wordIds:words.map(w=>w.id),wordTurns:questions.filter(q=>q.targetWordId).length,totalQuestions:questions.length,otherQuestions:questions.filter(q=>!q.targetWordId).length,directions:Object.fromEntries(['jp-nl','nl-jp'].map(d=>[d,questions.filter(q=>q.targetDirection===d).length])),forms:questions.filter(q=>q.targetWordId).reduce((a,q)=>(a[q.wordForm]=(a[q.wordForm]||0)+1,a),{}),coverage:probe.wordCoverageReport(words,questions)}};
  });
}

function contentWord(id){return require('../language-journey-content/content.js').vocabById[id]}

module.exports={audit};
if(require.main===module){const fs=require('node:fs');fs.mkdirSync('docs/word-coverage',{recursive:true});fs.writeFileSync('docs/word-coverage/audit.json',JSON.stringify(audit(createCrashCourseProbe()),null,2)+'\n')}
