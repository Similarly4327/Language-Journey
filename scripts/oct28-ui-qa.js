async page=>{
  const assert=(v,m)=>{if(!v)throw Error(m)},errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
    if(route.request().resourceType()==='document'){
      const response=await route.fetch(),html=(await response.text()).replace(/\}\)\(\);\s*<\/script>/,'window.__oct28QA={state,rankState,advancedCourses,buildAdvancedExamQuestions,startQuiz,createFlashcardSession};})();</script>');
      await route.fulfill({response,body:html});
    }else await route.continue();
  });
  await page.addInitScript(()=>{
    if(!sessionStorage.getItem('oct28fixture')){
      const ranks={};for(let level=4;level<=14;level++)for(let lesson=1;lesson<=10;lesson++)ranks[level===11?`l11-home-${lesson}`:`l${level}-${lesson}`]={rank:'Copper',last:1,attempts:1};
      localStorage.setItem('taal-japanse-leerapp-v1',JSON.stringify({version:9,ranks,state:{currentCourse:'japanese',currentLevel:14,level:8,level11IntegrationRevision:2,thematicRevision:1,audioEnabled:false,avatarEnabled:false}}));
      sessionStorage.setItem('oct28fixture','1');
    }
    if(window.__oct28TraceInstalled)return;window.__oct28TraceInstalled=true;
    window.__routeTrace=[];const log=event=>window.__routeTrace.push({time:performance.now(),event,view:document.body?.dataset.view,hash:location.hash,state:window.__oct28QA?.state.screen});
    for(const name of ['focus','popstate','hashchange','click','visibilitychange'])window.addEventListener(name,()=>log(name),true);
    document.addEventListener('DOMContentLoaded',()=>new MutationObserver(()=>log('render')).observe(document.body,{attributes:true,attributeFilter:['data-view']}));
    for(const method of ['pushState','replaceState']){const original=history[method];history[method]=function(...args){const result=original.apply(this,args);log(method);return result}}
  });
  await page.goto('http://127.0.0.1:4186/#/course/japanese/recall');await page.reload();await page.waitForFunction(()=>!!window.__oct28QA);
  await page.clock.install();
  const touch=await page.evaluate(()=>matchMedia('(pointer:coarse)').matches),tap=async locator=>touch?locator.tap():locator.click();
  const before=await page.evaluate(()=>JSON.stringify(window.__oct28QA.state.flashcardProgress));
  for(let i=0;i<12;i++){
    await tap(page.getByRole('button',{name:'Recall',exact:true}));
    if(i%2)await page.clock.fastForward(350);
    await tap(page.getByRole('button',{name:'Voortgang',exact:true}));
    await page.evaluate(()=>{window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'))});
    await page.clock.fastForward(61000);
    assert(await page.evaluate(()=>document.body.dataset.view==='session'&&location.hash.endsWith('/progress')),'Recall cannot reclaim Progress');
    await tap(page.getByRole('button',{name:'Voortgang',exact:true}));assert(await page.evaluate(()=>document.body.dataset.view==='session'),'repeat tab is idempotent');
    await tap(page.getByRole('button',{name:'Leren',exact:true}));assert(await page.evaluate(()=>location.hash.endsWith('/learn/levels')),'Learn is latest intent');
  }
  await tap(page.getByRole('button',{name:'Voortgang',exact:true}));await tap(page.locator('[data-progress="knowledge"]'));await page.locator('#knowledgeCategory').selectOption('grammar');await page.locator('#knowledgeSearch').fill('handeling');
  const grammarRows=await page.locator('#knowledgeItems .knowledge-item').count();assert(grammarRows>0,'known grammar is visible and searchable');
  await tap(page.locator('#knowledgeItems .vocab-progress-row').first());await page.waitForTimeout(250);
  assert(await page.locator('#dictionaryModalBody mark').count()>=3,'examples highlight the target');
  const engine=await page.evaluate(()=>/AppleWebKit/.test(navigator.userAgent)&&!/(Chrome|Edg)/.test(navigator.userAgent)?'webkit':'edge');
  await page.screenshot({path:`output/playwright/oct28/${engine}-grammar.png`,fullPage:true,animations:'disabled'});
  await tap(page.locator('#dictionaryClose'));assert(await page.locator('#knowledgeSearch').inputValue()==='handeling','closing preserves grammar search');
  assert(await page.evaluate(()=>JSON.stringify(window.__oct28QA.state.flashcardProgress))===before,'navigation/reference do not reschedule');
  await page.evaluate(()=>{const p=window.__oct28QA;p.state.screen='flashcards';p.createFlashcardSession([{cardId:'vocab-ねこ',direction:'jp-nl',round:0,answerChoices:['kat','hond','water']},{cardId:'vocab-ねこ',direction:'nl-jp',round:0,answerChoices:['ねこ','いぬ','みず']}],'scheduled')});
  await tap(page.getByRole('button',{name:'Voortgang',exact:true}));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.clock.fastForward(61000);
  const paused=await page.evaluate(()=>window.__oct28QA.state.flashcardSession);assert(paused.position===0&&paused.queue.length===2&&paused.status==='paused','in-progress Recall survives navigation');
  assert(await page.evaluate(()=>JSON.stringify(window.__oct28QA.state.flashcardProgress))===before,'paused Recall does not reschedule');
  await page.evaluate(()=>{const p=window.__oct28QA;p.state.level=8;p.state.screen='module';p.state.tabs.advanced='exams';p.startQuiz({source:'advanced',title:'Level 9 examen',official:true,rankId:'l9-exam',pool:[],choices:3,questions:p.buildAdvancedExamQuestions(p.advancedCourses[8])})});
  let screenshot=false;
  for(let i=0;i<30;i++){
    const question=await page.evaluate(()=>{const q=window.__oct28QA.state.quiz;return q.questions[q.index]});
    assert(await page.locator('#quizMeta').innerText()==='','no repeated rank notice');
    await tap(page.locator('.quiz-options-reveal'));await page.clock.fastForward(210);
    if(!screenshot&&question.contextLanguage==='ja'){
      await page.waitForTimeout(300);await page.screenshot({path:`output/playwright/oct28/${engine}-exam.png`,fullPage:true,animations:'disabled'});screenshot=true;
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
    }
    await tap(page.locator('#qChoices button').filter({hasText:new RegExp('^'+question.correct.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}));await page.clock.fastForward(1600);
  }
  assert(await page.locator('#resultScore').innerText()==='30 / 30','exam scoring');
  const result=await page.evaluate(()=>({engine:navigator.userAgent,trace:window.__routeTrace,rank:window.__oct28QA.rankState['l9-exam'],view:document.body.dataset.view}));
  assert(!errors.length,errors.join('; '));return{touch,grammarRows,errors,score:'30/30',...result};
}
