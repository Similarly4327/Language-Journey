async page=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(route.request().resourceType()==='document'&&(url.pathname==='/'||url.pathname==='/index.html')){
      const response=await route.fetch();let html=await response.text();
      html=html.replace(/\}\)\(\);\s*<\/script>/,'window.__questionQA={state,startQuiz,advancedCourses,advancedQuestions,advancedQuestionPool,buildAdvancedExamQuestions,allKana,renderQuestion};})();</script>');
      await route.fulfill({response,body:html});
    }else await route.continue();
  });
  await page.addInitScript(()=>{
    localStorage.setItem('language-journey-platform-v1',JSON.stringify({uiLanguage:'nl',courseId:'japanese'}));
    localStorage.setItem('taal-japanse-leerapp-v1',JSON.stringify({version:9,state:{audioEnabled:true,audioCoachEnabled:false,currentCourse:'japanese',level8Revision:2}}));
    let manifest;Object.defineProperty(window,'LanguageJourneyAudioManifest',{configurable:true,set(value){manifest=value},get(){
      if(manifest&&window.LanguageJourneyContent&&!manifest.fixture){manifest.fixture=true;manifest.assets=window.LanguageJourneyContent.audioEntries.filter(r=>r.pronunciation?.audioTextKana).flatMap(ref=>['A','B'].map(voiceRole=>({entryId:ref.id,displayText:ref.displayText,readingId:ref.pronunciation.readingId||'default',audioTextKana:ref.pronunciation.audioTextKana,voiceRole,reviewed:true,pipelineVersion:manifest.pipelineVersion,path:'assets/audio/ja/sentences/fixture-'+voiceRole+'.mp3'})))}return manifest;
    }});
    window.__audioCalls=[];window.Audio=class{constructor(path){this.path=path;window.__audioCalls.push(this)}play(){queueMicrotask(()=>this.onplaying?.());return Promise.resolve()}pause(){this.paused=true}};
  });
  await page.goto('http://127.0.0.1:8792/#/course/japanese/learn/module/1',{waitUntil:'domcontentloaded'});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.__questionQA);
  const results=[];
  for(const width of [320,375,1280]){
    await page.setViewportSize({width,height:844});
    for(const name of ['kana-forward','kana-reverse','small-two','level10-show','level10-lesson5','level10-reading','level10-exam','without-audio','long-translation']){
      await page.evaluate(name=>{
        const api=window.__questionQA,c=api.advancedCourses[9],pool=api.allKana('hiragana').slice(0,5);
        api.state.audioEnabled=name!=='without-audio';
        let q,source='advanced',questions;
        if(name.startsWith('kana-')||name==='small-two'){
          source='hiragana';q={type:'kana',mode:name==='kana-forward'?'forward':'reverse',item:pool[0]};
          if(name==='small-two')pool.splice(2);
        }else if(name==='level10-show'||name==='without-audio')q=api.advancedQuestionPool(c,c.lessons[1],1).current.find(q=>q.correct==='みせて');
        else if(name==='level10-reading')q=api.advancedQuestionPool(c,c.lessons[4],4).current.find(q=>q.kind==='reading');
        else if(name==='level10-lesson5')q=api.advancedQuestions(c,c.lessons[4],4).find(q=>q.kind==='meaning');
        else if(name==='long-translation')q=api.advancedQuestionPool(c,c.lessons[4],4).current.filter(q=>q.kind==='meaning').sort((a,b)=>b.correct.length-a.correct.length)[0];
        else{for(let i=0;i<30&&!q;i++){questions=api.buildAdvancedExamQuestions(c);q=questions.find(q=>q.correct==='みせて')||null;}if(!q)throw Error('Exam sample missing');}
        api.startQuiz({source,title:name,official:false,pool,questions:[q],choices:3});
      },name);
      await page.locator('.quiz-options-reveal').waitFor();
      if(await page.locator('#qChoices .choice:visible').count()!==0)throw Error('Options visible before reveal');
      const hiddenHeight=await page.locator('#qChoices').evaluate(e=>e.getBoundingClientRect().height);
      if(hiddenHeight>60)throw Error('Empty option rows increase hidden height '+hiddenHeight);
      if(await page.locator('#qPromptAudio .audio-speaker').count()){
        const before=await page.evaluate(()=>window.__questionQA.state.quiz.index);
        await page.locator('#qPromptAudio .audio-speaker').click();
        if(await page.evaluate(()=>window.__questionQA.state.quiz.index)!==before)throw Error('Prompt audio selected answer');
      }
      await page.locator('.quiz-options-reveal').click();await page.waitForTimeout(200);
      const geometry=await page.evaluate(()=>{
        const card=document.querySelector('#quizView .question'),prompt=document.querySelector('#qPrompt'),choices=document.querySelector('#qChoices');
        const r=card.getBoundingClientRect(),s=getComputedStyle(card),inner=r.width-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)-parseFloat(s.borderLeftWidth)-parseFloat(s.borderRightWidth);
        const overlaps=[...choices.querySelectorAll('.answer-option-row:has(.audio-speaker)')].some(row=>{
          const t=row.querySelector('.choice').getBoundingClientRect(),b=row.querySelector('.audio-speaker').getBoundingClientRect();return t.right>b.left&&t.left<b.right&&t.bottom>b.top&&t.top<b.bottom;
        });
        const outside=[...document.querySelectorAll('#quizView button')].filter(e=>e.getClientRects().length).some(e=>{const b=e.getBoundingClientRect();return b.left<0||b.right>innerWidth+1});
        return{overflow:document.documentElement.scrollWidth>innerWidth,overlaps,outside,promptWidth:prompt.getBoundingClientRect().width,choicesWidth:choices.getBoundingClientRect().width,inner,options:choices.querySelectorAll('.choice').length,speakers:document.querySelectorAll('#quizView .audio-speaker').length};
      });
      if(geometry.overflow||geometry.overlaps||geometry.outside||Math.abs(geometry.choicesWidth-geometry.inner)>2)throw Error(name+' layout '+JSON.stringify(geometry));
      if(width<520&&Math.abs(geometry.promptWidth-geometry.inner)>2)throw Error(name+' narrow prompt '+JSON.stringify(geometry));
      if(name==='small-two'&&geometry.options!==2)throw Error('Small kana pool not kept');
      if(['kana-forward','kana-reverse','level10-show','level10-exam'].includes(name)&&geometry.options!==4)throw Error(name+' missing fourth option');
      if(name==='level10-reading'&&geometry.options!==4)throw Error('Reading source changed');
      if(name==='without-audio'&&geometry.speakers)throw Error('Audio disabled visibility');
      const optionAudio=page.locator('#qChoices .audio-speaker').first();
      if(await optionAudio.count()){
        const before=await page.evaluate(()=>({index:window.__questionQA.state.quiz.index,score:window.__questionQA.state.quiz.score}));
        await optionAudio.click();
        const after=await page.evaluate(()=>({index:window.__questionQA.state.quiz.index,score:window.__questionQA.state.quiz.score}));
        if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Option audio selected answer');
        if(await optionAudio.getAttribute('data-audio-state')!=='playing')throw Error('Option audio did not play');
      }
      if(width===320&&['kana-reverse','level10-reading','level10-show','long-translation'].includes(name))await page.screenshot({path:'output/playwright/question-layout/'+name+'-320.png',fullPage:true});
      await page.locator('#qChoices .choice[data-correct="0"]').first().click();
      if(!(await page.locator('#qFeedback').textContent()).includes('Niet goed'))throw Error('Feedback missing');
      if(!(await page.locator('#qChoices .choice.correct').count()))throw Error('Correct answer feedback missing');
      results.push({width,name,hiddenHeight,...geometry});
    }
  }
  if(errors.length)throw Error('Page errors '+JSON.stringify(errors));
  return{fixtureAudio:true,errors,results};
}

