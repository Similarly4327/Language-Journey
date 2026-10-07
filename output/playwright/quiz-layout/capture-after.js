async page=>{
 await page.unrouteAll();
 await page.route(/127\.0\.0\.1:8770\/(?:index\.html)?$/,async route=>{const response=await route.fetch();const html=(await response.text()).replace(/<script>\s*([\s\S]*?)<\/script>/,(whole,source)=>'<script>'+source.replace(/\}\)\(\);\s*$/,'window.__quizTest={state,startQuiz,revealQuizOptions,renderQuestion,advancedCourses,advancedQuestionPool,advancedQuestions,buildAdvancedExamQuestions,langLessons,level4QuestionBank,lessonQuestion,renderMain,beginWordCrashCourse,lessonNewWords};})();')+'</script>');await route.fulfill({response,body:html})});
 await page.reload();
 const reports=[];
 for(const width of [320,375,390]){
  await page.setViewportSize({width,height:812});
  await page.evaluate(()=>{const t=__quizTest,c=Object.values(t.advancedCourses).find(c=>c.number===9);let q,l;for(const [i,lesson]of c.lessons.entries()){q=t.advancedQuestionPool(c,lesson,i).current.find(q=>q.prompt.includes('“waar”'));if(q){l=lesson;break}}t.state.level=8;t.startQuiz({source:'advanced',title:'Level 9 · '+l.title,official:false,pool:[],questions:[q],choices:3});window.scrollTo({top:0,behavior:'instant'})});
  await page.waitForTimeout(400);
  await page.screenshot({path:`output/playwright/quiz-layout/after-${width}-hidden.png`,fullPage:true});
  const measure=()=>page.evaluate(()=>Object.fromEntries(['qContext','qPrompt','qChoices'].map(id=>{const e=document.getElementById(id),s=getComputedStyle(e),r=e.getBoundingClientRect();return[id,{text:e.textContent,font:s.fontSize,height:r.height,top:r.top}]})));
  reports.push({width,hidden:await measure()});
  await page.getByRole('button',{name:'Toon antwoorden'}).click();await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:`output/playwright/quiz-layout/after-${width}-revealed.png`,fullPage:true});
  reports.at(-1).revealed=await measure();
 }
 console.log(JSON.stringify(reports));
}
