async page=>{
  const browser=page.context().browser(),base=new URL(page.url()).origin,results=[];
  const assert=(value,message)=>{if(!value)throw Error(message)};
  async function setup(p){
    await p.route('**/*',async route=>{
      if(route.request().resourceType()==='document'){
        const response=await route.fetch(),html=(await response.text()).replace(/\}\)\(\);\s*<\/script>/,'window.__examQA={state,renderMain,startDakExam,startSmallExam,buildSmallExamQuestions,renderQuestion};})();</script>');
        await route.fulfill({response,body:html});
      }else await route.continue();
    });
    await p.addInitScript(()=>{
      localStorage.setItem('language-journey-platform-v1',JSON.stringify({uiLanguage:'nl',courseId:'japanese'}));
      localStorage.setItem('taal-japanse-leerapp-v1',JSON.stringify({version:9,state:{currentCourse:'japanese',currentLevel:5},ranks:{'dak-examA':{rank:'Copper',attempts:1},'dak-examB':{rank:'Gold',attempts:3}}}));
    });
    await p.goto(base+'/#/',{waitUntil:'domcontentloaded'});
    await p.waitForFunction(()=>!!window.__examQA);
  }
  for(const device of [{name:'mobile',width:375,height:812},{name:'desktop',width:1280,height:900}]){
    const context=await browser.newContext({viewport:{width:device.width,height:device.height}}),p=await context.newPage();
    try{
      await setup(p);
      const level3=await p.evaluate(()=>{const api=window.__examQA;api.state.screen='module';api.state.level=2;api.state.tabs.dakuten='exams';api.renderMain();return{cards:[...document.querySelectorAll('#dakExamList .dakExam')].map(button=>button.dataset.id),copy:document.querySelector('#dakBody').innerText,rank:api.state.ranks?.['dak-examB']}});
      assert(level3.cards.length===1&&level3.cards[0]==='dak-examA'&&!/Examen B/i.test(level3.copy),device.name+' retired Level 3 exam remains accessible');
      await p.evaluate(()=>{const api=window.__examQA;api.state.screen='module';api.state.level=4;api.state.tabs.small='exams';api.renderMain()});
      await p.locator('#smallExam').click();
      const exam=await p.evaluate(()=>{
        const api=window.__examQA,quiz=api.state.quiz,index=quiz.questions.findIndex(question=>(question.targetGoalIds||[]).some(goal=>goal.startsWith('kana:')));
        quiz.index=index;api.renderQuestion();
        return{title:document.querySelector('#quizTitle').textContent,meta:document.querySelector('#quizMeta').textContent,prompt:document.querySelector('#qPrompt').textContent.trim(),hint:document.querySelector('#qHint').textContent.trim(),questionNumber:document.querySelector('#qNow').textContent,total:document.querySelector('#qTotal').textContent,bar:document.querySelector('#qBar').style.width,answers:[...document.querySelectorAll('#qChoices button')].map(button=>button.textContent.trim()).filter(Boolean),pageWidth:document.documentElement.scrollWidth,viewport:innerWidth};
      });
      assert(exam.title==='Level 5 examen',device.name+' exam title missing');
      assert(exam.meta==='',device.name+' level exam still shows the repeated rank sentence');
      assert(exam.prompt&&exam.hint,device.name+' small-kana prompt or pronunciation instruction missing');
      assert(exam.questionNumber&&exam.total==='30'&&exam.bar,device.name+' question number or progress bar missing');
      assert(exam.answers.length>=3&&exam.answers.every(answer=>!/[\u3040-\u30ff\u3400-\u9fff]/u.test(answer)),device.name+' sound choices are absent or still kana');
      assert(exam.pageWidth<=exam.viewport+1,device.name+' exam has horizontal page overflow');
      results.push({device:device.name,retiredExamButtons:level3.cards,level5Exam:exam});
      if(device.name==='mobile')await p.screenshot({path:'output/playwright/exam-corrections/mobile-level5-exam.png',fullPage:true});
    }finally{await context.close()}
  }
  return{engine:'Chromium',results};
}
