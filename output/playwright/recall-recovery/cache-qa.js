async page=>{
 await page.unrouteAll();
 await page.setViewportSize({width:375,height:812});
 await page.route(/127\.0\.0\.1:8770\/(?:index\.html)?$/,route=>route.fulfill({path:'output/playwright/recall-recovery/before-index.html',contentType:'text/html'}));
 await page.route('**/language-journey-content/content.js',route=>route.fulfill({path:'output/playwright/recall-recovery/before-content.js',contentType:'text/javascript'}));
 for(const lang of ['nl','en','de'])await page.route(`**/locales/${lang}.js?v=20260924-levels`,route=>route.fulfill({path:`output/playwright/recall-recovery/before-${lang}.js`,contentType:'text/javascript'}));
 await page.evaluate(()=>{localStorage.setItem('language-journey-platform-v1',JSON.stringify({uiLanguage:'nl',courseId:'japanese'}));localStorage.setItem('taal-japanse-leerapp-v1',JSON.stringify({version:8,state:{screen:'flashcards',currentCourse:'japanese',uiLanguage:'nl',level8Revision:2,introducedVocabIds:['vocab-ねこ'],flashcardProgress:{version:1,cards:{'vocab-ねこ::jp-nl':{dueAt:1791400000000,repetitions:4,intervalDays:14,lapses:1}}}},ranks:{'l4-1':{rank:'Copper',last:.9,attempts:2}}}));});
 await page.goto('http://127.0.0.1:8770/#/course/japanese/recall');await page.reload();await page.waitForTimeout(400);
 const before=await page.locator('#flashcardView').innerText();if(!before.includes('flashcards.mixedHelp'))throw Error('Stale locale not reproduced');await page.screenshot({path:'output/playwright/recall-recovery/before-stale-assets.png',fullPage:true});
 await page.unrouteAll();await page.reload();await page.waitForTimeout(400);
 const after=await page.locator('#flashcardView').innerText();if(/flashcards\./.test(after)||!after.includes('5 woorden in Recall-pool'))throw Error('Recovery failed: '+after);
 await page.screenshot({path:'output/playwright/recall-recovery/after-copper.png',fullPage:true});
 await page.locator('#recallInfo summary').click();
 await page.screenshot({path:'output/playwright/recall-recovery/after-info.png',fullPage:true});
 await page.locator('#recallInfo summary').click();
 await page.reload();if(/flashcards\./.test(await page.locator('#flashcardView').innerText()))throw Error('Reload keys');
 return {before,after,storage:await page.evaluate(()=>({backupExists:!!localStorage.getItem('taal-japanse-leerapp-v1:before-recall-recovery-20261007'),cards:JSON.parse(localStorage.getItem('taal-japanse-leerapp-v1')).state.flashcardProgress.cards}))};
}
