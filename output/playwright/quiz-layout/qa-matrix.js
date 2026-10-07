async page=>{
 const results=[];
 for(const width of [320,375,390,1280]){
  await page.setViewportSize({width,height:812});
  const result=await page.evaluate(()=>{
   const t=__quizTest,rows=[];
   for(const level of [4,6,8,9]){
    const c=Object.values(t.advancedCourses).find(c=>c.number===level);
    const banks=level===4?t.langLessons.flatMap((l,i)=>t.level4QuestionBank(i)):c.lessons.flatMap((l,i)=>[...t.advancedQuestionPool(c,l,i).current,...t.advancedQuestions(c,l,i)]).concat(t.buildAdvancedExamQuestions(c));
    t.state.level=level-1;
    for(const q of banks){
     t.startQuiz({source:level===4?'lang':'advanced',title:'Level '+level,official:false,pool:[],questions:[q],choices:3});
     const prompt=document.getElementById('qPrompt'),jp=prompt.classList.contains('prompt--jp'),size=parseFloat(getComputedStyle(prompt).fontSize);
     if(size>(jp?32:20)+.01)throw Error('Oversized prompt '+level+' '+size);
     if(document.documentElement.scrollWidth>innerWidth+1)throw Error('Horizontal overflow '+level+' '+q.prompt);
     t.revealQuizOptions(document.getElementById('qChoices'));
     if(document.documentElement.scrollWidth>innerWidth+1)throw Error('Revealed horizontal overflow '+level+' '+q.prompt);
    }
    rows.push({level,questions:banks.length,kinds:[...new Set(banks.map(q=>q.kind||q.type))]});
   }
   return rows;
  });
  results.push({width,result});
 }
 await page.evaluate(r=>window.__qaResults=r,results);
 return results;
}
