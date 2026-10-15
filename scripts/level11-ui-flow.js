async page=>{
  const assert=(value,message)=>{if(!value)throw Error(message)},results=[];
  await page.reload();
  await page.clock.install();
  const measure=async label=>{
    const m=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert(m.scroll<=m.width+1,`${label}: horizontal overflow ${JSON.stringify(m)}`);
  };
  async function quiz(){
    const total=await page.evaluate(()=>window.__level11QA.state.quiz.questions.length);
    for(let index=0;index<total;index++){
      const question=await page.evaluate(()=>{const q=window.__level11QA.state.quiz;return q.questions[q.index]});
      await page.locator('.quiz-options-reveal').click();await page.clock.fastForward(220);
      await page.locator('#qChoices button').filter({hasText:new RegExp('^'+question.correct.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}).click();
      await page.clock.fastForward(1600);
    }
    assert(await page.locator('#resultScore').innerText()===`${total} / ${total}`,'quiz score');
  }
  for(let index=0;index<4;index++){
    await page.evaluate(index=>window.__level11QA.openThematicLesson(index),index);
    await page.locator('#thematicStartA').click();
    const metrics=[];
    for(const part of ['A','B']){
      assert(await page.locator('.thematic-words>.panel').count()===5,`${index+1}${part}: five words`);await measure(`words ${index+1}${part}`);
      if(index===0&&part==='A'){
        await page.setViewportSize({width:320,height:760});await measure('320px words');await page.screenshot({path:'output/playwright/level11-integration/lesson1-five-words-320.png',fullPage:true});await page.setViewportSize({width:390,height:844});
      }
      await page.locator('#thematicWordsNext').click();
      const deck=await page.evaluate(()=>window.__level11QA.active.deck.map(q=>({id:q.word.id,direction:q.direction})));assert(deck.length===10,'ten word questions');
      for(let turn=0;turn<10;turn++){
        const answer=await page.evaluate(()=>{const c=window.__level11QA.active,q=c.queue[c.index];return q.direction==='jp-nl'?q.word.meaning:q.word.jp});
        await page.locator('#wordCrashReveal').click();await page.clock.fastForward(220);
        await page.locator('.flashcard-answer-choice').getByText(answer,{exact:true}).click();
        await page.clock.fastForward(1600);
      }
      await page.locator('#wordPracticeContinue').click();
      let sentences=0;while(await page.locator('#thematicSentenceNext').count()){
        await measure(`sentence ${index+1}${part}`);await page.locator('#thematicSentenceNext').click();sentences++;
      }
      assert(sentences>=2&&sentences<=3,'compact sentence screens');
      for(let turn=0;turn<2;turn++){
        const answer=await page.evaluate(()=>{const api=window.__level11QA,s=api.state.thematic;return window.LanguageJourneyContent.thematicCourses[10].lessons[s.lessonIndex].applications.find(p=>p.part===s.part).questions[s.questionIndex].answer});
        await page.locator('#thematicReveal').click();await page.clock.fastForward(220);
        await page.locator('[data-thematic-choice]').getByText(answer,{exact:true}).click();await page.clock.fastForward(1600);
      }
      await page.locator('#thematicDoneNext').click();metrics.push({part,words:5,turns:deck.length,sentences});
    }
    await page.locator('#thematicCheck').click();await quiz();results.push({lesson:index+1,metrics,score:await page.locator('#resultScore').innerText()});
  }
  await page.evaluate(()=>window.__level11QA.openThematicLesson(4));await measure('exam intro');await page.screenshot({path:'output/playwright/level11-integration/exam-intro-mobile.png',fullPage:true});
  await page.locator('#level11ExamStart').click();await measure('exam question');await page.screenshot({path:'output/playwright/level11-integration/exam-source-mobile.png',fullPage:true});
  const exam=await page.evaluate(()=>window.__level11QA.state.quiz.questions.map(q=>({source:q.integrationSourceId,targets:q.targetVocabIds})));await quiz();
  await page.screenshot({path:'output/playwright/level11-integration/exam-result-mobile.png',fullPage:true});
  const before=await page.evaluate(()=>{window.__level11QA.saveProgress();return JSON.parse(localStorage.getItem('taal-japanse-leerapp-v1'))});
  assert(before.ranks['l11-exam'].rank==='Copper','exam Copper persisted');assert(before.state.level11IntegrationPass.targetVocabIds.length>0,'exact exam targets persisted');
  await page.reload();const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('taal-japanse-leerapp-v1')));
  assert(JSON.stringify(before.state.level11IntegrationPass)===JSON.stringify(after.state.level11IntegrationPass),'pass survives reload');
  await page.setViewportSize({width:1280,height:900});await page.evaluate(()=>window.__level11QA.openThematicLesson(4));await measure('desktop');await page.screenshot({path:'output/playwright/level11-integration/exam-desktop.png',fullPage:true});
  return {results,exam,rank:after.ranks['l11-exam'],pass:after.state.level11IntegrationPass,reload:true};
}
