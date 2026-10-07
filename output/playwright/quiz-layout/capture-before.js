async page=>{
  const reports=[];
  for(const width of [320,375,390]){
    await page.setViewportSize({width,height:812});await page.evaluate(()=>{window.__quizTest.renderQuestion();window.scrollTo({top:0,behavior:'instant'})});await page.waitForTimeout(400);
    await page.screenshot({path:`output/playwright/quiz-layout/before-${width}-hidden.png`,fullPage:true});
    const measure=()=>page.evaluate(()=>Object.fromEntries(['qContext','qPrompt','qChoices'].map(id=>{const e=document.getElementById(id),s=getComputedStyle(e),r=e.getBoundingClientRect();return[id,{font:s.fontSize,height:r.height,top:r.top}]})));
    reports.push({width,hidden:await measure()});await page.getByRole('button',{name:'Toon antwoorden'}).click();await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:`output/playwright/quiz-layout/before-${width}-revealed.png`,fullPage:true});
  }
  await page.evaluate(reports=>window.__layoutBefore=reports,reports);
}