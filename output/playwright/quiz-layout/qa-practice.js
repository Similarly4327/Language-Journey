async page=>{
 await page.reload();
 const reports=[];
 for(const width of [320,375,390,1280]){
  await page.setViewportSize({width,height:812});
  for(const level of [4,6,8,9]){
   await page.evaluate(level=>{const t=__quizTest,c=Object.values(t.advancedCourses).find(c=>c.number===level),l=level===4?t.langLessons[0]:c.lessons[0];t.state.screen='module';t.state.level=level-1;if(level===4){t.state.langView='lesson';t.state.langStep='model'}else{t.state.advancedView[level-1]='lesson';t.state.advancedStep[level-1]='model'}t.renderMain();t.beginWordCrashCourse({hostId:level===4?'langStepBody':'advancedStepBody',lesson:l,words:t.lessonNewWords(l),returnToLesson:()=>{},onComplete:()=>{}});window.scrollTo({top:0,behavior:'instant'})},level);
   await page.waitForTimeout(400);
   const before=await page.evaluate(()=>{const e=document.querySelector('.word-crash-course .flashcard-face-main'),b=document.querySelector('.word-crash-course .flashcard-options-reveal');if(!e||!b)throw Error('Practice not rendered');return{text:e.textContent,font:getComputedStyle(e).fontSize,buttonHeight:b.getBoundingClientRect().height,headerPosition:getComputedStyle(document.querySelector('.app-header')).position,overflow:document.documentElement.scrollWidth>innerWidth}});
   if(before.overflow||parseFloat(before.font)>32||before.buttonHeight>60||before.headerPosition!=='relative')throw Error(JSON.stringify(before));
   await page.getByRole('button',{name:'Toon antwoorden'}).click();
   reports.push({width,level,...before});
   if(width===375){await page.screenshot({path:`output/playwright/quiz-layout/practice-level-${level}.png`,fullPage:true});}
  }
 }
 return reports;
}
