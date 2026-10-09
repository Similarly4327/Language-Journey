async page => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:375,height:812});
  await page.route('http://127.0.0.1:9037/**',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const response=await route.fetch(),body=(await response.text()).replace(/(<script>\s*)([\s\S]*?)(<\/script>)/,(_,a,code,b)=>a+code.replace(/\}\)\(\);\s*$/,'window.__timeProbe={state,studySessions,totalStudySeconds,studyTotals,progressSummaryPoints};})();')+b);
    await route.fulfill({response,body});
  });
  await page.addInitScript(()=>{
    const NativeDate=Date;window.__timeNow=Number(sessionStorage.getItem('__timeNow'))||Date.parse('2026-10-09T11:00:00Z');
    window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[window.__timeNow]))}static now(){return window.__timeNow}};
    if(!sessionStorage.getItem('__timeSeeded')){
      localStorage.setItem('language-journey-platform-v1',JSON.stringify({uiLanguage:'nl',courseId:'japanese'}));
      localStorage.setItem('taal-japanse-leerapp-v1',JSON.stringify({version:9,state:{courseId:'japanese',currentCourse:'japanese',screen:'module',level:3,langView:'lesson',langLesson:0,langStep:'overview',level8Revision:2},ranks:{'l4-1':{rank:'Copper'}}}));
      sessionStorage.setItem('__timeSeeded','1');
    }
  });
  const advance=minutes=>page.evaluate(m=>{window.__timeNow+=m*60000;sessionStorage.setItem('__timeNow',String(window.__timeNow))},minutes);
  const totals=()=>page.evaluate(()=>window.__timeProbe.studyTotals());
  await page.goto('http://127.0.0.1:9037/#/course/japanese/learn/module/4');
  await page.reload();
  await page.locator('#startLangRoute').click();await advance(20);await page.locator('#learnNav').click();
  let result=await totals();if(result.byGroup.curriculum!==1200)throw new Error('Curriculum timing failed');
  await page.locator('#flashcardsNav').click();await advance(5);
  if((await totals()).total!==1200)throw new Error('Passive Recall tab counted');
  await page.locator('#fcStartRecall').click();await advance(10);await page.locator('#fcPause').click();
  result=await totals();if(result.byGroup.recall!==600)throw new Error('Scheduled Recall timing failed');
  await page.locator('#fcNew').click();await page.locator('#recallCustom summary').click();
  await page.locator('#fcCustomFree').click();await advance(8);await page.locator('#fcPause').click();
  result=await totals();if(result.total!==2280||result.byGroup.recall!==1080)throw new Error('Free practice timing failed');
  await page.locator('#fcResume').click();await advance(2);
  await page.reload();
  const recovered=await page.evaluate(()=>({sessions:window.__timeProbe.studySessions(),status:window.__timeProbe.state.flashcardSession?.status,total:window.__timeProbe.totalStudySeconds()}));
  if(recovered.total!==2400||recovered.status!=='paused'||new Set(recovered.sessions.map(s=>s.id)).size!==4)throw new Error('Reload recovery failed');
  await page.locator('#sessionBtn').click();await page.locator('[data-progress-metric="time"]').click();
  await page.locator('[data-time-series="recall"]').waitFor();await page.waitForTimeout(500);
  if(await page.locator('#progressSummaryChart polyline').count()!==2)throw new Error('Wrong number of time series');
  await page.screenshot({path:'output/playwright/study-time/mobile-time.png',fullPage:true});
  const chart=await page.locator('#progressChartDetail').innerText();
  const widths=await page.evaluate(()=>({viewport:innerWidth,content:document.documentElement.scrollWidth}));
  if(widths.content>widths.viewport)throw new Error('Mobile horizontal overflow');
  await page.locator('#recentActivitiesToggle').click();await page.locator('#activityManagerToggle').click();
  const activities=await page.locator('#studySessionList').innerText();
  if(!activities.includes('Recall')||!activities.includes('Vrij oefenen')||!activities.includes('Curriculum'))throw new Error('Activity groups missing');
  const record=await page.evaluate(()=>window.__timeProbe.studySessions().find(s=>s.activityType==='freePractice'));
  await page.locator(`[data-edit-session="${record.id}"]`).click();await page.locator('[name="effectiveMinutes"]').fill('6');await page.locator('#studyForm button[type="submit"]').click();
  const corrected=await page.evaluate(id=>window.__timeProbe.studySessions().find(s=>s.id===id),record.id);
  if(corrected.rawSeconds!==480||corrected.effectiveSeconds!==360||corrected.activityGroup!=='recall')throw new Error('Manual Recall correction failed');
  if(errors.length)throw new Error(errors.join('\n'));
  return {totalsBeforeCorrection:result,totalsAfterCorrection:await totals(),sessions:recovered.sessions.map(({id,activityGroup,activityType,effectiveSeconds})=>({id,activityGroup,activityType,effectiveSeconds})),chart,widths,activities,errors,corrected:{raw:corrected.rawSeconds,effective:corrected.effectiveSeconds,group:corrected.activityGroup}};
}
