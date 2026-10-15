async page=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',async route=>{
    if(route.request().resourceType()==='document'){
      const response=await route.fetch(),html=(await response.text()).replace(/\}\)\(\);\s*<\/script>/,'window.__level11QA={state,rankState,openThematicLesson,renderMain,saveProgress,get active(){return activeWordCrashCourse}};})();</script>');
      await route.fulfill({response,body:html});
    }else await route.continue();
  });
  await page.addInitScript(()=>{
    // One isolated browser profile; seed once, so later reloads test real persistence.
    if(!sessionStorage.getItem('level11-qa-seeded')){
      localStorage.setItem('language-journey-platform-v1',JSON.stringify({uiLanguage:'nl',courseId:'japanese'}));
      localStorage.setItem('taal-japanse-leerapp-v1',JSON.stringify({version:9,state:{currentCourse:'japanese',audioEnabled:false,avatarEnabled:false,level11IntegrationRevision:2,thematicRevision:1,level:10,thematic:{level:11,lessonIndex:0,part:'A',step:'lesson',flowRevision:2}},ranks:{}}));
      sessionStorage.setItem('level11-qa-seeded','1');
    }
  });
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4185/#/course/japanese/learn/module/11');
  await page.reload();
  await page.waitForFunction(()=>!!window.__level11QA);
  await page.screenshot({path:'output/playwright/level11-integration/lesson1-overview.png',fullPage:true});
  await page.evaluate(()=>window.__level11QA.errors=[]);
  return {url:page.url(),text:await page.locator('body').innerText(),errors};
}
