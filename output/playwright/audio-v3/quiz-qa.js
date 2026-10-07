async page=>{
  const results=[];
  for(const width of [320,375,390]){
    await page.setViewportSize({width,height:812});
    await page.evaluate(()=>localStorage.setItem('taal-japanse-leerapp-v1',JSON.stringify({version:9,state:{currentCourse:'japanese',level8Revision:2,screen:'module',level:3,langView:'lesson',langLesson:0,langStep:'check',audioEnabled:true,audioCoachEnabled:false},ranks:{}})));
    await page.goto('http://127.0.0.1:8766/#/course/japanese/learn/module/4');await page.reload();await page.locator('#miniCheckStart').click();
    let tested=0,withAudio=0,feedbackAudio=0;
    for(let index=0;index<5;index++){
      if(await page.locator('#quizView .audio-speaker').count()>1)throw Error('More than one quiz speaker');
      if(await page.locator('#quizView .audio-speaker').count())withAudio++;
      if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Quiz overflow before reveal');
      await page.locator('.quiz-options-reveal').click();await page.waitForTimeout(200);
      const wrong=page.locator('#qChoices button[data-correct="0"]');
      if(!(await wrong.count())){if(await page.locator('#quizView .audio-speaker').count())throw Error('Audio leaks into sentence builder');results.push({width,sentenceBuilderObserved:true,speakerCount:0});break;}
      await wrong.first().click();
      if(await page.locator('#quizView .audio-speaker').count()>1)throw Error('More than one quiz feedback speaker');
      if(await page.locator('#quizView .audio-speaker').count())feedbackAudio++;
      if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Quiz overflow after reveal');
      if(width===375&&index===0)await page.screenshot({path:'output/playwright/audio-v3/quiz-feedback-375-fixture.png',fullPage:true});
      tested++;await page.locator('.feedback-next').click();
    }
    results.push({width,questions:tested,withAudio,feedbackAudio,maximumOneSpeaker:true,overflow:false});
  }
  for(const script of ['hiragana','katakana']){
    await page.setViewportSize({width:375,height:812});
    await page.addInitScript(script=>localStorage.setItem('taal-japanse-leerapp-v1',JSON.stringify({version:9,state:{currentCourse:'japanese',level8Revision:2,screen:'module',level:0,basisModule:script,audioEnabled:true,audioCoachEnabled:false},ranks:{}})),script);
    await page.goto('http://127.0.0.1:8766/#/course/japanese/learn/module/1');await page.reload();await page.locator('#startLearn').click();
    let stimuli=0;
    for(let index=0;index<6;index++){
      const prompt=await page.locator('#qPrompt').innerText();
      if(/[ぁ-んァ-ヶ]/.test(prompt)){stimuli++;if(await page.locator('#qPromptAudio .audio-speaker').count()!==1)throw Error('Missing kana stimulus audio');const id=await page.locator('#qPromptAudio .audio-speaker').getAttribute('data-audio-key');if(!id.startsWith('kana-'+script+'-'))throw Error('Wrong kana ID '+id+' expected '+script+' prompt '+prompt);}
      await page.locator('.quiz-options-reveal').click();await page.waitForTimeout(200);await page.locator('#qChoices button[data-correct="0"]').first().click();
      if(await page.locator('#quizView .audio-speaker').count()!==1)throw Error('Kana feedback speaker count');
      await page.locator('.feedback-next').click();
    }
    results.push({script,kanaQuestions:6,japaneseStimuli:stimuli,correctKanaIds:true,maximumOneSpeaker:true});
  }
  return{fixture:true,results};
}
