async page=>{
  const browser=page.context().browser(),base=new URL(page.url()).origin,results=[],errors=[];
  const assert=(value,message)=>{if(!value)throw Error(message)};
  async function setup(p){
    p.on('pageerror',error=>errors.push(error.message));
    await p.route('**/*',async route=>{
      if(route.request().resourceType()==='document'){
        const response=await route.fetch(),html=(await response.text()).replace(/\}\)\(\);\s*<\/script>/,'window.__recallQA={state,createFlashcardSession,japaneseWordHtml};})();</script>');
        await route.fulfill({response,body:html});
      }else await route.continue();
    });
    await p.addInitScript(()=>{
      localStorage.setItem('language-journey-platform-v1',JSON.stringify({uiLanguage:'nl',courseId:'japanese'}));
      localStorage.setItem('taal-japanse-leerapp-v1',JSON.stringify({version:9,state:{currentCourse:'japanese',audioEnabled:true,audioCoachEnabled:false,level8Revision:2,introducedVocabIds:['vocab-これ','vocab-ねこ','vocab-いぬ','vocab-みず','vocab-パン']},ranks:{'l4-1':{rank:'Copper'}}}));
      let manifest;Object.defineProperty(window,'LanguageJourneyAudioManifest',{configurable:true,set(value){manifest=value},get(){
        if(manifest&&window.LanguageJourneyContent&&!manifest.fixture){manifest.fixture=true;manifest.assets=window.LanguageJourneyContent.audioEntries.filter(ref=>ref.pronunciation?.audioTextKana).map(ref=>({entryId:ref.id,displayText:ref.displayText,readingId:ref.pronunciation.readingId||'default',audioTextKana:ref.pronunciation.audioTextKana,voiceRole:'A',reviewed:true,pipelineVersion:manifest.pipelineVersion,path:'assets/audio/ja/words/fixture.mp3'}))}return manifest;
      }});
      window.Audio=class{play(){return Promise.resolve()}pause(){}};
    });
    await p.goto(base+'/#/course/japanese/recall',{waitUntil:'domcontentloaded'});
    await p.waitForFunction(()=>!!window.__recallQA);
  }
  async function setSampleText(p,scenario){
    await p.evaluate(({scenario})=>{
      const api=window.__recallQA,main=document.querySelector('.flashcard-face-main'),speaker=main.querySelector('.audio-speaker');
      main.innerHTML=api.japaneseWordHtml(scenario.front)+(scenario.direction==='jp-nl'?speaker?.outerHTML||'':'');
      const first=document.querySelector('[data-fc-answer]');first.innerHTML=api.japaneseWordHtml(scenario.answer);
      if(scenario.lang==='ja'&&!first.querySelector('.jp-word'))first.innerHTML=`<span class="jp-word" lang="ja">${scenario.answer}</span>`;
    },{scenario});
  }
  const scenarios=[
    {direction:'jp-nl',front:'ねこ',answer:'kat',lang:'nl'},
    {direction:'jp-nl',front:'おねがいします',answer:'onafhankelijkheidsverklaring',lang:'nl'},
    {direction:'nl-jp',front:'kat',answer:'ねこ',lang:'ja'},
    {direction:'nl-jp',front:'geïnteresseerd',answer:'よんでください',lang:'ja'}
  ];
  for(const device of [{name:'mobile-320',width:320,touch:true},{name:'mobile-375',width:375,touch:true},{name:'desktop',width:1440,touch:false}]){
    const context=await browser.newContext({viewport:{width:device.width,height:900},hasTouch:device.touch,isMobile:device.touch});
    const p=await context.newPage();
    try{
      await setup(p);
      for(const scenario of scenarios){
        await p.evaluate(({scenario})=>{
          const api=window.__recallQA;api.state.flashcardProgress.cards={};
          const answers=scenario.direction==='jp-nl'?['kat','hond','water','brood']:['ねこ','いぬ','みず','パン'];
          api.createFlashcardSession([{cardId:'vocab-ねこ',direction:scenario.direction,round:0,answerChoices:answers}],'scheduled');
        },{scenario});
        await setSampleText(p,scenario);
        for(const phase of ['blurred','revealed']){
          if(phase==='revealed'){await p.locator('.flashcard-options-reveal').click();await setSampleText(p,scenario)}
          const measurements=await p.evaluate(()=>{
            const view=document.querySelector('#flashcardView'),front=view.querySelector('.flashcard-front'),main=view.querySelector('.flashcard-face-main'),speaker=main.querySelector('.audio-speaker'),button=view.querySelector('[data-fc-answer]'),row=button.closest('.answer-option-row');
            const textRange=document.createRange();for(const node of main.childNodes)if(node.nodeType===Node.TEXT_NODE||node.nodeType===Node.ELEMENT_NODE&&!node.matches('.audio-speaker'))textRange.selectNodeContents(node);
            const textRects=[...textRange.getClientRects()].filter(r=>r.width&&r.height),mainRect=main.getBoundingClientRect(),speakerRect=speaker?.getBoundingClientRect(),buttonRect=button.getBoundingClientRect(),rowSpeaker=row.querySelector('.audio-speaker'),rowSpeakerRect=rowSpeaker?.getBoundingClientRect(),answerRange=document.createRange();answerRange.selectNodeContents(button);const answerRects=[...answerRange.getClientRects()].filter(r=>r.width&&r.height);
            return{viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,frontWidth:front.clientWidth,frontScroll:front.scrollWidth,mainWidth:main.clientWidth,mainScroll:main.scrollWidth,mainFont:getComputedStyle(main).fontSize,buttonWidth:button.clientWidth,buttonScroll:button.scrollWidth,buttonFont:getComputedStyle(button).fontSize,rowWidth:row.clientWidth,rowScroll:row.scrollWidth,speakerOverlap:speakerRect&&textRects.some(r=>r.right>speakerRect.left&&r.left<speakerRect.right&&r.bottom>speakerRect.top&&r.top<speakerRect.bottom),answerAudioOverlap:rowSpeakerRect&&buttonRect.right>rowSpeakerRect.left-1,answerOutside:answerRects.some(r=>r.left<buttonRect.left-1||r.right>buttonRect.right+1)};
          });
          assert(measurements.documentWidth<=device.width+1,`${device.name} page horizontal overflow ${JSON.stringify(measurements)}`);
          assert(measurements.frontScroll<=measurements.frontWidth+1&&measurements.mainScroll<=measurements.mainWidth+1,`${device.name} front clipped ${JSON.stringify(measurements)}`);
          assert(measurements.buttonScroll<=measurements.buttonWidth+1&&!measurements.answerOutside,`${device.name} answer text clipped ${JSON.stringify(measurements)}`);
          assert(!measurements.speakerOverlap&&!measurements.answerAudioOverlap,`${device.name} text/audio overlap ${JSON.stringify(measurements)}`);
          results.push({device:device.name,direction:scenario.direction,front:scenario.front,answer:scenario.answer,phase,...measurements});
          if(device.name==='mobile-320'&&scenario.front==='おねがいします'&&phase==='revealed')await p.screenshot({path:'output/playwright/recall-typography/mobile-long-japanese.png',fullPage:true});
          if(device.name==='mobile-320'&&scenario.front==='geïnteresseerd'&&phase==='revealed')await p.screenshot({path:'output/playwright/recall-typography/mobile-long-dutch.png',fullPage:true});
        }
      }
      await p.evaluate(()=>{
        const api=window.__recallQA,word=window.LanguageJourneyContent.vocabById['vocab-ねこ'];word.meaning='onafhankelijkheidsverklaring';
        api.createFlashcardSession([{cardId:word.id,direction:'jp-nl',round:0,answerChoices:[word.meaning,'hond','water','brood']}],'scheduled');
      });
      await p.locator('.flashcard-options-reveal').click();await p.locator('[data-fc-answer="1"]').click();
      const feedback=await p.locator('.recall-source').evaluate(node=>({width:node.clientWidth,scroll:node.scrollWidth,font:getComputedStyle(node).fontSize,documentWidth:document.documentElement.scrollWidth}));
      assert(feedback.scroll<=feedback.width+1&&feedback.documentWidth<=device.width+1,`${device.name} long feedback text clipped ${JSON.stringify(feedback)}`);
      results.push({device:device.name,test:'long-dutch-feedback',...feedback});
      await p.screenshot({path:`output/playwright/recall-typography/${device.name}.png`,fullPage:true});
    }finally{await context.close()}
  }
  assert(!errors.length,'browser errors '+errors.join(', '));
  return{engine:'Chromium',touchEmulation:true,scenarios:results.length,errors,results};
}
