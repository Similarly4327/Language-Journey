async page=>{
  // Run through playwright-cli against a local preview, in isolated contexts only.
  const browser=page.context().browser(),base=new URL(page.url()).origin,results=[],errors=[];
  const assert=(value,message)=>{if(!value)throw Error(message)};
  async function setup(p){
    p.on('pageerror',error=>errors.push(error.message));
    await p.route('**/*',async route=>{
      if(route.request().resourceType()==='document'){
        const response=await route.fetch(),html=(await response.text()).replace(/\}\)\(\);\s*<\/script>/,'window.__recallQA={state,createFlashcardSession,renderFlashcardsScreen};})();</script>');
        await route.fulfill({response,body:html});
      }else await route.continue();
    });
    await p.addInitScript(()=>{
      localStorage.setItem('language-journey-platform-v1',JSON.stringify({uiLanguage:'nl',courseId:'japanese'}));
      localStorage.setItem('taal-japanse-leerapp-v1',JSON.stringify({version:9,state:{currentCourse:'japanese',audioEnabled:true,audioCoachEnabled:false,level8Revision:2,introducedVocabIds:['vocab-これ','vocab-ねこ','vocab-いぬ','vocab-みず','vocab-パン']},ranks:{'l4-1':{rank:'Copper'}}}));
      let manifest;Object.defineProperty(window,'LanguageJourneyAudioManifest',{configurable:true,set(value){manifest=value},get(){
        if(manifest&&window.LanguageJourneyContent&&!manifest.fixture){manifest.fixture=true;manifest.assets=window.LanguageJourneyContent.audioEntries.filter(r=>r.pronunciation?.audioTextKana).flatMap(ref=>['A','B'].map(voiceRole=>({entryId:ref.id,displayText:ref.displayText,readingId:ref.pronunciation.readingId||'default',audioTextKana:ref.pronunciation.audioTextKana,voiceRole,reviewed:true,pipelineVersion:manifest.pipelineVersion,path:'assets/audio/ja/words/fixture-'+Array.from(ref.id,c=>c.codePointAt(0).toString(16)).join('')+'-'+voiceRole+'.mp3'})))}return manifest;
      }});
      window.__audioCalls=[];window.Audio=class{
        constructor(path){this.path=path;window.__audioCalls.push(this)}
        play(){if(window.__failAudioNext){window.__failAudioNext=false;return Promise.reject(Error('Fixture failure'))}queueMicrotask(()=>this.onplaying?.());return Promise.resolve()}
        pause(){this.paused=true}
      };
    });
    await p.goto(base+'/#/course/japanese/recall',{waitUntil:'domcontentloaded'});
    await p.waitForFunction(()=>!!window.__recallQA);
  }
  const state=p=>p.evaluate(()=>{
    const s=window.__recallQA.state.flashcardSession;
    return{position:s.position,status:s.status,knew:s.knew,again:s.again,skipped:s.skipped,feedback:s.feedback,progress:JSON.stringify(window.__recallQA.state.flashcardProgress.cards),calls:window.__audioCalls.length};
  });
  async function fresh(p,{direction='nl-jp',mode='scheduled',missing=false,queue=null}={}){
    await p.evaluate(({direction,mode,missing,queue})=>{
      const api=window.__recallQA,manifest=window.LanguageJourneyAudioManifest;
      window.__fixtureAssets??=manifest.assets;manifest.assets=missing?[]:window.__fixtureAssets;
      api.state.flashcardProgress.cards={};window.__audioCalls=[];window.__failAudioNext=false;
      const item={cardId:'vocab-ねこ',direction,round:0,answerChoices:direction==='nl-jp'?['ねこ','いぬ','みず','パン']:['kat','hond','water','brood']};
      api.createFlashcardSession(queue||[item],mode);
    },{direction,mode,missing,queue});
  }
  async function reveal(p){await p.locator('.flashcard-options-reveal').click();}
  async function point(p,selector,kind){
    const locator=p.locator(selector);await locator.scrollIntoViewIfNeeded();
    return locator.evaluate((button,kind)=>{
      const r=button.getBoundingClientRect();let x=r.x+r.width/2,y=r.y+r.height/2;
      if(kind==='text'){const range=document.createRange();range.selectNodeContents(button);const t=range.getBoundingClientRect();x=t.x+t.width/2;y=t.y+t.height/2;}
      if(kind==='edge'){x=r.x+3;y=r.y+r.height/2;}
      if(kind==='space'){x=r.right-12;y=r.bottom-12;}
      const hit=document.elementFromPoint(x,y)?.closest('button');
      return{x,y,index:hit?.dataset.fcAnswer,key:hit?.dataset.audioKey};
    },kind);
  }
  for(const touch of [false,true]){
    const context=await browser.newContext({viewport:{width:touch?375:1280,height:844},hasTouch:touch,isMobile:touch});
    const p=await context.newPage(),device=touch?'mobile-touch':'desktop';
    const click=async target=>touch?p.touchscreen.tap(target.x,target.y):p.mouse.click(target.x,target.y);
    try{
      await setup(p);
      for(const index of [0,1,2,3])for(const kind of ['text','edge','space']){
        await fresh(p);await reveal(p);
        const target=await point(p,`[data-fc-answer="${index}"]`,kind);
        assert(target.index===String(index)&&!target.key,device+' answer hitbox '+index+' '+kind+' '+JSON.stringify(target));
        await click(target);const after=await state(p);
        assert(after.feedback?.chosen===['ねこ','いぬ','みず','パン'][index],device+' selected its own answer');
        assert(after.feedback.grade===(index===0?'knew':'again'),device+' correct/incorrect feedback');
        assert(after.knew+after.again===1&&after.calls===0,device+' exactly one grade, no unintended pronunciation');
        const before=after.progress;await click(target);assert((await state(p)).progress===before,device+' duplicate click grades twice');
        results.push({device,test:'answer-target',index,kind});
      }
      await fresh(p);await reveal(p);
      const before=await state(p),keys=[];
      for(let index=0;index<4;index++){
        const row=p.locator('.flashcard-answer-options .answer-option-row').nth(index),speaker=row.locator('.audio-speaker');
        const data=await speaker.evaluate(button=>({key:button.dataset.audioKey,text:button.dataset.audioText,expected:'./'+window.LanguageJourneyAudioManifest.assets.find(a=>a.entryId===button.dataset.audioKey&&a.voiceRole==='A').path}));
        assert(data.text===await row.locator('[data-fc-answer]').textContent(),device+' own option text');keys.push(data.key);
        // Use the observed speaker's own rectangle; rows follow a small instruction div.
        const rect=await speaker.boundingBox();await click({x:rect.x+rect.width/2,y:rect.y+rect.height/2});
        await p.waitForFunction(()=>window.__audioCalls.at(-1)?.onplaying===null||document.querySelector('.flashcard-answer-options [data-audio-state="playing"]'));
        const actual=await p.evaluate(()=>window.__audioCalls.at(-1)?.path);
        assert(actual===data.expected,device+' option '+index+' played wrong asset '+actual);
        const after=await state(p);assert(after.progress===before.progress&&!after.feedback&&after.knew===0&&after.again===0,device+' audio changed grading/SRS');
      }
      assert(new Set(keys).size===4,device+' all speakers reused last key');
      await click(await point(p,'[data-fc-answer="0"]','space'));
      assert((await state(p)).feedback?.chosen==='ねこ',device+' audio then another answer');
      results.push({device,test:'four-independent-speakers',keys});

      await fresh(p);await reveal(p);
      const answer=p.locator('[data-fc-answer="0"]');await answer.focus();await p.keyboard.press('Tab');
      assert(await p.evaluate(()=>document.activeElement.matches('.audio-speaker')),device+' speaker keyboard focus');
      await p.keyboard.press('Enter');assert(!(await state(p)).feedback,device+' keyboard audio graded');
      await p.keyboard.press('Shift+Tab');assert(await p.evaluate(()=>document.activeElement.dataset.fcAnswer==='0'),device+' answer keyboard focus');
      await p.keyboard.press('Space');assert((await state(p)).feedback?.chosen==='ねこ',device+' keyboard answer');
      results.push({device,test:'keyboard-separated-actions'});

      for(const failure of ['missing','error']){
        await fresh(p,{missing:failure==='missing'});await reveal(p);
        if(failure==='error'){
          await p.evaluate(()=>window.__failAudioNext=true);
          const speaker=p.locator('.flashcard-answer-options .audio-speaker').first(),rect=await speaker.boundingBox();await click({x:rect.x+rect.width/2,y:rect.y+rect.height/2});
          await p.waitForFunction(()=>!!document.querySelector('.flashcard-answer-options [data-audio-state="error"]'));
          assert(!(await state(p)).feedback&&(await state(p)).progress==='{}',device+' failure graded');
        }else assert(await p.locator('.flashcard-answer-options .audio-speaker').count()===0,device+' missing audio fixture');
        await click(await point(p,'[data-fc-answer="0"]','text'));assert((await state(p)).feedback?.grade==='knew',device+' '+failure+' blocks answer');
        await p.waitForFunction(()=>window.__recallQA.state.flashcardSession.status==='complete');
        assert(await p.locator('#fcSummaryDone').isVisible(),device+' '+failure+' blocks completion');
        results.push({device,test:'audio-'+failure+'-answer-still-works'});
      }
      await fresh(p,{direction:'jp-nl'});await reveal(p);
      assert(await p.locator('.flashcard-face-main>.audio-speaker').evaluate(button=>getComputedStyle(button).position)==='absolute',device+' prompt speaker placement changed');
      assert(await p.locator('.flashcard-answer-options .audio-speaker').count()===0,device+' Dutch answers got Japanese audio');
      await click(await point(p,'[data-fc-answer="1"]','space'));assert((await state(p)).feedback?.chosen==='hond',device+' reverse direction');
      results.push({device,test:'jp-nl-answer'});

      const queue=[{cardId:'vocab-ねこ',direction:'nl-jp',round:0},{cardId:'vocab-いぬ',direction:'jp-nl',round:0},{cardId:'vocab-みず',direction:'nl-jp',round:0},{cardId:'vocab-パン',direction:'jp-nl',round:0}];
      for(const mode of ['scheduled','free']){
        await fresh(p,{mode,queue});let grades=0,wrong=0;
        while((await state(p)).status==='active'){
          assert(grades<12,device+' session stuck');await reveal(p);
          const info=await p.evaluate(()=>{
            const s=window.__recallQA.state.flashcardSession,item=s.queue[s.position],word=window.LanguageJourneyContent.vocabById[item.cardId];
            return{key:item.cardId+'::'+item.direction,correct:item.direction==='nl-jp'?word.kana:word.meaning};
          });
          const options=p.locator('[data-fc-answer]'),labels=await options.allTextContents(),shouldMiss=grades===0||grades===2;
          const selected=labels.findIndex(label=>shouldMiss?label!==info.correct:label===info.correct);assert(selected>=0,'answer available');
          const prior=JSON.parse((await state(p)).progress),calls=(await state(p)).calls;
          await click(await point(p,`[data-fc-answer="${selected}"]`,'text'));grades++;if(shouldMiss)wrong++;
          const after=await state(p),records=JSON.parse(after.progress);
          assert(after.feedback?.chosen===labels[selected],device+' full session picked wrong answer');assert(after.calls===calls,device+' ordinary answer played audio');
          if(mode==='free')assert(after.progress==='{}',device+' free practice changed SRS');
          else{
            assert(after.knew+after.again===grades,device+' grade counted more than once');
            assert(records[info.key].lastGrade===(shouldMiss?'again':'knew'),device+' wrong SRS direction');
            assert(shouldMiss?records[info.key].lapses===(prior[info.key]?.lapses||0)+1:records[info.key].repetitions===(prior[info.key]?.repetitions||0)+1,device+' SRS not exactly once');
            for(const key of Object.keys(prior).filter(key=>key!==info.key))assert(JSON.stringify(records[key])===JSON.stringify(prior[key]),device+' changed another SRS key');
          }
          if(shouldMiss)await p.locator('#flashcardView .flashcard-actions .btn.primary').click();
          else await p.waitForFunction(()=>window.__recallQA.state.flashcardSession.feedback===null||window.__recallQA.state.flashcardSession.status==='complete');
        }
        assert(await p.locator('#fcSummaryDone').isVisible(),device+' no completion screen');
        results.push({device,test:'complete-'+mode+'-mixed-session',grades,wrong,final:await state(p)});
      }
      await fresh(p);await reveal(p);
      await p.screenshot({path:'output/playwright/recall-audio-hitbox/'+device+'-after.png',fullPage:true});
      await fresh(p,{queue});await p.locator('#fcSkip').click();assert((await state(p)).position===1&&(await state(p)).progress==='{}',device+' skip graded');
      await p.locator('#fcPause').click();assert((await state(p)).status==='paused'&&(await state(p)).progress==='{}',device+' pause graded');
      await p.locator('#fcResume').click();assert((await state(p)).position===1,device+' resume reset position');
      results.push({device,test:'skip-pause-resume'});
    }finally{await context.close();}
  }
  assert(errors.length===0,'JavaScript errors '+errors.join(', '));
  return{engine:'Chromium',touchEmulation:true,actualIosSafari:false,mockAudio:true,errors,results};
}
