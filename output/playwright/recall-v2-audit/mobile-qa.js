async page=>{
 await page.route(/127\.0\.0\.1:8770\/(?:index\.html)?$/,async route=>{const response=await route.fetch();const html=(await response.text()).replace(/<script>\s*([\s\S]*?)<\/script>/,(whole,source)=>'<script>'+source.replace(/\}\)\(\);\s*$/,'window.__recallQA={state,rankState,vocabById,getRecallSession,startRecallSession,renderFlashcardsScreen,createFlashcardSession,flashcardRate};})();')+'</script>');await route.fulfill({response,body:html})});
 await page.reload();const results=[];
 for(const width of [320,375,390,1280]){
  await page.setViewportSize({width,height:844});
  await page.evaluate(()=>{const t=__recallQA;t.state.screen='flashcards';t.state.currentCourse='japanese';t.state.uiLanguage='nl';t.rankState['l4-1'].rank='Copper';t.createFlashcardSession([{cardId:'vocab-ねこ',direction:'jp-nl',answerChoices:['kat','hond','water']}],'scheduled');t.state.flashcardSession.revealed=true;t.state.flashcardSession.optionsRevealed=true;t.flashcardRate('again','hond');window.scrollTo({top:0,behavior:'instant'})});await page.waitForTimeout(400);
  const r=await page.evaluate(()=>{const skip=document.getElementById('fcSkip').getBoundingClientRect(),pause=document.getElementById('fcPause').getBoundingClientRect(),next=[...document.querySelectorAll('.flashcard-actions button')].find(b=>b.textContent==='Volgende kaart').getBoundingClientRect();if(Math.abs(skip.top-next.top)>1||pause.top<skip.bottom||document.documentElement.scrollWidth>innerWidth)throw Error('Action layout invalid');return{width:innerWidth,skipHeight:skip.height,nextHeight:next.height,sameRow:true,pauseBelow:true,pool:__recallQA.getRecallSession().counts.pool}});
  await page.screenshot({path:`output/playwright/recall-v2-audit/feedback-${width}.png`,fullPage:true});
  const before=await page.evaluate(()=>JSON.stringify({session:__recallQA.state.flashcardSession,cards:__recallQA.state.flashcardProgress.cards,ranks:__recallQA.rankState}));
  await page.locator('[data-dictionary-open="vocab-ねこ"]').click();await page.waitForTimeout(1800);await page.getByRole('button',{name:'Dictionary sluiten'}).click();
  const after=await page.evaluate(()=>JSON.stringify({session:__recallQA.state.flashcardSession,cards:__recallQA.state.flashcardProgress.cards,ranks:__recallQA.rankState}));if(before!==after)throw Error('Dictionary changed state');results.push(r);
 }
 return results;
}
