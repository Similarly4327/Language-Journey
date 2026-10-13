async (page) => {
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:375,height:812});
  await page.route('http://127.0.0.1:8766/**',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const response=await route.fetch();
    const html=(await response.text()).replace(/(<script>\s*)([\s\S]*?)(<\/script>)/,(_,a,code,b)=>a+code.replace(/\}\)\(\);\s*$/,'window.__coverage={state,langLessons,smallLessons,advancedCourses,lessonNewWords,assertWordCoverage,assertCompactExam,examQuestionBudget,get round(){return activeWordCrashCourse}};})();')+b);
    await route.fulfill({response,body:html});
  });
  await page.addInitScript(()=>{
    const seed=sessionStorage.getItem('__coverageSeed');
    if(seed){localStorage.setItem('taal-japanse-leerapp-v1',seed);localStorage.setItem('language-journey-platform-v1',JSON.stringify({uiLanguage:'nl',courseId:'japanese'}))}
  });
  const load=async(level,patch)=>{
    const state={screen:'module',level:level-1,courseId:'japanese',level8Revision:2,...patch};
    await page.evaluate(seed=>sessionStorage.setItem('__coverageSeed',JSON.stringify({version:9,state:seed,ranks:{}})),state);
    await page.goto(`http://127.0.0.1:8766/#/course/japanese/learn/module/${level}`);
    await page.reload();
    await page.waitForFunction(()=>!!window.__coverage);
  };
  const report={practice:[],exams:[],errors};
  for(let level=4;level<=10;level++){
    await load(level,{});
    const lessons=await page.evaluate(n=>{const p=window.__coverage;return (n===4?p.langLessons:n===5?p.smallLessons:p.advancedCourses[n-1].lessons).map((l,index)=>({id:l.id,index,words:p.lessonNewWords(l).length,blocks:l.microsteps?.length||0}))},level);
    for(const l of lessons.filter(l=>l.words)){
      for(let block=0;block<(l.blocks||1);block++){
        const patch=level===4?{langView:'lesson',langLesson:l.index,langStep:'model'}:level===5?{smallLesson:l.index}:{advancedView:{[level-1]:'lesson'},advancedLesson:{[level-1]:l.index},advancedStep:{[level-1]:'model'},...(l.blocks?{monthLearning:{block,completed:[],practice:{}}}:{})};
        await load(level,patch);
        await page.locator(level===4?'#modelNext':level===5?'#smallQuick':l.blocks?'#monthPractice':'#advancedModelNext').click();
        const result=await page.evaluate(()=>{const p=window.__coverage,r=p.round;p.assertWordCoverage(r.words,r.deck);return{lesson:r.lesson.id,turns:r.deck.length,words:r.words.length,text:document.querySelector('.word-crash-course').innerText}});
        if(result.turns!==result.words*2)throw new Error('Wrong turn count');
        await page.locator('#wordCrashReveal').click();
        if(!(await page.locator('.flashcard-answer-choice').count()))throw new Error('No answers');
        if(level===6&&l.index===3){
          await page.screenshot({path:'output/playwright/word-coverage/mobile-practice.png',fullPage:true});
          const answered=[];
          for(let index=0;index<8;index++){
            const current=await page.evaluate(()=>{const r=window.__coverage.round,q=r.queue[r.index];return{key:q.key,choice:q.choices.indexOf(q.correct),revealed:q.revealed}});
            if(!current.revealed)await page.locator('#wordCrashReveal').click();
            await page.waitForTimeout(200);
            await page.locator(`#wordCrashChoice${current.choice}`).click();
            answered.push(current.key);
            await page.waitForFunction(i=>{const r=window.__coverage.round;return r.index>i||r.phase==='summary'},index);
          }
          if(new Set(answered).size!==8)throw new Error('Repeated real UI target');
          report.completedFourWordRound=answered;
        }
        report.practice.push({level,lesson:l.id,block:l.blocks?block+1:undefined,turns:result.turns});
      }
    }
  }
  for(let level=3;level<=10;level++){
    const tab=level===3?'dakuten':level===4?'lang':level===5?'small':'advanced';
    await load(level,{tabs:{[tab]:'exams'}});
    if(level===3){
      const runs=[];
      for(const id of ['dak-examA','dak-examB'])for(let attempt=1;attempt<=3;attempt++){await load(3,{tabs:{dakuten:'exams'}});await page.locator(`.dakExam[data-id="${id}"]`).click();const run=await page.evaluate(()=>({rankId:window.__coverage.state.quiz.rankId,questions:window.__coverage.state.quiz.questions.length,targetKanaIds:window.__coverage.state.quiz.questions.map(q=>q.item.id)}));if(run.questions!==30)throw new Error('Level 3 budget mismatch');runs.push({...run,attempt});}
      report.exams.push({level,lexicalWords:0,status:'niet van toepassing',runs});
      continue;
    }
    const runs=[];
    for(let attempt=1;attempt<=3;attempt++){
      await load(level,{tabs:{[tab]:'exams'}});
      const start=page.locator(level===4?'#langExam':level===5?'#smallExam':'#advancedExamStart'),label=await start.innerText();await start.click();
      const result=await page.evaluate(n=>{const p=window.__coverage,lessons=n===4?p.langLessons:n===5?p.smallLessons:p.advancedCourses[n-1].lessons,q=p.state.quiz.questions,balance=p.assertCompactExam(lessons,q,p.examQuestionBudget(n));return{level:n,total:q.length,parts:balance.parts,lessonCounts:balance.lessonCounts,directions:balance.directions,targets:q.filter(q=>q.targetWordId).map(q=>({id:q.targetWordId,direction:q.targetDirection}))}},level);
      await page.locator('#qPrompt').waitFor({state:'visible'});if(!label.includes(String(result.total)))throw new Error('Exam length label differs from session');
      if(level===8&&attempt===1){await page.waitForTimeout(700);await page.screenshot({path:'output/playwright/word-coverage/mobile-exam.png',fullPage:true})}runs.push({...result,attempt});
    }
    if(new Set(runs.map(r=>r.targets.map(t=>t.id).sort().join('|'))).size<2)throw new Error(`Level ${level} word sample did not vary across UI attempts`);
    report.exams.push({level,runs});
  }
  if(errors.length)throw new Error(errors.join('\n'));
  await page.evaluate(report=>sessionStorage.setItem('__coverageResult',JSON.stringify(report)),report);
  const downloading=page.waitForEvent('download');await page.evaluate(report=>{const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));link.download='ui-audit.json';link.click()},report);await(await downloading).saveAs('docs/word-coverage/ui-audit.json');
  return{practiceRoutes:report.practice.length,fourWordRound:report.completedFourWordRound,exams:report.exams.map(r=>({level:r.level,attempts:r.runs.length,counts:r.runs.map(run=>run.total||run.questions)})),errors};
}
