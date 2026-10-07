async page=>{
 const results=[];
 for(const lang of ['nl','en','de'])for(const width of [320,375,390])for(const copper of [true,false]){
  await page.setViewportSize({width,height:812});
  await page.evaluate(({lang,copper})=>{localStorage.setItem('language-journey-platform-v1',JSON.stringify({uiLanguage:lang,courseId:'japanese'}));localStorage.setItem('taal-japanse-leerapp-v1',JSON.stringify({version:'8',state:{screen:'flashcards',currentCourse:'japanese',level8Revision:2,introducedVocabIds:['vocab-ねこ'],flashcardSelection:{auto:false,lessonIds:['l4-1'],direction:'jp-nl'},flashcardProgress:{version:1,cards:{'vocab-ねこ::jp-nl':{dueAt:1791400000000,repetitions:4,intervalDays:14,lapses:1}}}},ranks:copper?{'l4-exam':{rank:'Copper',last:.9,attempts:1}}:{}}))},{lang,copper});
  await page.reload();await page.waitForTimeout(200);
  const text=await page.locator('#flashcardView').innerText();if(/flashcards\./.test(text))throw Error('Literal key '+lang);
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow '+lang+' '+width);
  await page.locator('#recallInfo summary').click();if(!(await page.locator('#recallInfo').evaluate(e=>e.open)))throw Error('Info closed');
  await page.locator('#recallInfo summary').click();if(await page.locator('#recallInfo').evaluate(e=>e.open))throw Error('Info open');
  if(width===375)await page.screenshot({path:`output/playwright/recall-recovery/${lang}-${copper?'copper':'reviews-locked'}.png`,fullPage:true});
  const cards=await page.evaluate(()=>JSON.parse(localStorage.getItem('taal-japanse-leerapp-v1')).state.flashcardProgress.cards);if(cards['vocab-ねこ::jp-nl'].repetitions!==4)throw Error('History changed');
  results.push({lang,width,copper,reload:true,keys:false,overflow:false,reviewPreserved:true});
 }
 return results;
}
