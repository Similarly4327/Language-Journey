async page=>{
 await page.setViewportSize({width:375,height:812});
 const samples=await page.evaluate(()=>{const t=__quizTest,qs=t.langLessons.flatMap((l,i)=>t.level4QuestionBank(i));const c=Object.values(t.advancedCourses).find(c=>c.number===9),advanced=c.lessons.flatMap((l,i)=>t.advancedQuestionPool(c,l,i).current);return [{name:'level4-word',level:4,q:qs.find(q=>q.kind==='meaning')},{name:'level4-builder',level:4,q:qs.find(q=>q.kind==='build')},{name:'level9-sentence',level:9,q:advanced.find(q=>q.kind==='reading')},{name:'level9-long-question',level:9,q:advanced.reduce((a,b)=>a.prompt.length>b.prompt.length?a:b)}]});
 const measurements=[];
 for(const s of samples){
  await page.evaluate(s=>{__quizTest.state.level=s.level-1;__quizTest.startQuiz({source:s.level===4?'lang':'advanced',title:s.name,official:false,pool:[],questions:[s.q],choices:3});window.scrollTo({top:0,behavior:'instant'})},s);await page.waitForTimeout(400);
  await page.screenshot({path:`output/playwright/quiz-layout/${s.name}-hidden.png`,fullPage:true});
  await page.getByRole('button',{name:'Toon antwoorden'}).click();await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:`output/playwright/quiz-layout/${s.name}-revealed.png`,fullPage:true});
  measurements.push(await page.evaluate(()=>({prompt:document.getElementById('qPrompt').textContent,context:document.getElementById('qContext').textContent,font:getComputedStyle(document.getElementById('qPrompt')).fontSize,answersTop:document.getElementById('qChoices').getBoundingClientRect().top,headerBottom:document.querySelector('.app-header').getBoundingClientRect().bottom,progressTop:document.getElementById('quizTitle').getBoundingClientRect().top})));
 }
 return measurements;
}
