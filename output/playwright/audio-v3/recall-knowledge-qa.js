async page=>{
  // Run after mobile-qa.js in the same isolated session (its mock audio fixture).
  const results=[];
  const seed=async state=>page.evaluate(state=>localStorage.setItem('taal-japanse-leerapp-v1',JSON.stringify({version:9,state:{currentCourse:'japanese',level8Revision:2,audioEnabled:true,audioCoachEnabled:false,introducedVocabIds:['vocab-ねこ','vocab-いぬ'],...state},ranks:{'l4-exam':{rank:'Copper'}}})),state);
  for(const width of [320,375,390])for(const direction of ['jp-nl','nl-jp']){
    await page.setViewportSize({width,height:812});
    await seed({screen:'flashcards',recallCustomOpen:true,flashcardSelection:{auto:false,lessonIds:['l4-1'],direction}});
    await page.goto('http://127.0.0.1:8766/#/course/japanese/recall');await page.reload();
    if(!(await page.locator('#recallCustom').evaluate(e=>e.open)))await page.locator('#recallCustom > summary').click();
    await page.locator('#fcCustomFree').click();
    const expected=direction==='jp-nl'?1:0;
    if(await page.locator('#flashcardView .audio-speaker').count()!==expected)throw Error('Premature/missing Recall audio '+direction);
    await page.locator('.flashcard-options-reveal').click();
    if(await page.locator('#flashcardView .audio-speaker').count()!==expected)throw Error('Choice reveal leaks Japanese audio '+direction);
    const wrong=await page.evaluate(direction=>{
      const face=document.querySelector('.flashcard-face-main').cloneNode(true);face.querySelectorAll('button').forEach(b=>b.remove());const front=face.textContent.trim();
      const card=window.LanguageJourneyContent.vocabCatalog.find(c=>direction==='nl-jp'?c.meaning===front:c.kana===front);
      const correct=direction==='nl-jp'?card.jp:card.meaning;
      return[...document.querySelectorAll('[data-fc-answer]')].find(b=>b.textContent.trim()!==correct).dataset.fcAnswer;
    },direction);
    await page.locator(`[data-fc-answer="${wrong}"]`).click();
    if(await page.locator('#flashcardView .audio-speaker').count()!==1)throw Error('Multiple/missing feedback speakers');
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Recall overflow');
    if(width===375)await page.screenshot({path:`output/playwright/audio-v3/recall-${direction}-375-fixture.png`,fullPage:true});
    await page.waitForTimeout(400);
    const records=await page.evaluate(()=>JSON.parse(localStorage.getItem('taal-japanse-leerapp-v1')).state.flashcardProgress?.cards||{});
    if(Object.keys(records).length)throw Error('Free practice created SRS records');
    results.push({width,direction,preAnswerSpeaker:expected,feedbackSpeaker:1,freePracticeSrsUnchanged:true});
  }
  await seed({screen:'session',progressTab:'knowledge'});await page.goto('http://127.0.0.1:8766/#/course/japanese/progress');await page.reload();
  await page.locator('#knowledgeCategory').selectOption('words');
  const tile=page.locator('.knowledge-item').first(),id=await tile.locator('.audio-speaker').getAttribute('data-audio-key');
  await tile.locator('.audio-speaker').click();if(await page.locator('#dictionaryModal').isVisible())throw Error('Speaker opened Dictionary');
  await tile.locator('.vocab-progress-row').click();if(!(await page.locator('#dictionaryModal').isVisible()))throw Error('Tile did not open Dictionary');
  if(await page.locator('#dictionaryModal .audio-speaker').getAttribute('data-audio-key')!==id)throw Error('Different Dictionary audio');
  results.push({knowledgeSpeakerDirect:true,dictionarySharesId:id});
  return{fixture:true,results};
}
