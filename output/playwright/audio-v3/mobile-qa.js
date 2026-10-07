async page=>{
  // Isolated browser fixture only: no Japanese recordings have been generated.
  await page.addInitScript(()=>{
    let data;Object.defineProperty(window,'LanguageJourneyAudioManifest',{configurable:true,set(value){data=value},get(){
      if(data&&window.LanguageJourneyContent&&!data.fixture){data.fixture=true;data.assets=window.LanguageJourneyContent.audioEntries.filter(r=>r.pronunciation?.audioTextKana).flatMap(ref=>['A','B'].map(voiceRole=>({entryId:ref.id,displayText:ref.displayText,readingId:'default',audioTextKana:ref.pronunciation.audioTextKana,voiceRole,reviewed:true,pipelineVersion:data.pipelineVersion,path:'assets/audio/ja/sentences/fixture-'+voiceRole+'.mp3'})))}return data;
    }});
    window.__audioCalls=[];
    window.Audio=class{constructor(path){this.path=path;window.__audioCalls.push(this)}play(){queueMicrotask(()=>this.onplaying?.());return Promise.resolve()}pause(){this.paused=true}};
  });
  const seed=async(state,ranks={'l4-exam':{rank:'Copper'}})=>{
    await page.evaluate(({state,ranks})=>{localStorage.setItem('language-journey-platform-v1',JSON.stringify({uiLanguage:'nl',courseId:'japanese'}));localStorage.setItem('taal-japanse-leerapp-v1',JSON.stringify({version:9,state:{currentCourse:'japanese',level8Revision:2,audioEnabled:true,audioCoachEnabled:false,introducedVocabIds:['vocab-ねこ','vocab-いぬ'],...state},ranks}))},{state,ranks});
  };
  const check=async(name)=>{
    const result=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,buttons:[...document.querySelectorAll('.audio-speaker')].filter(b=>b.getClientRects().length).map(b=>{const r=b.getBoundingClientRect();return{id:b.dataset.audioKey,width:r.width,height:r.height,x:r.x,right:r.right}})}));
    if(result.overflow||result.buttons.some(b=>b.width<44||b.height<44||b.x<0||b.right>result.width))throw Error('Layout '+name+' '+JSON.stringify(result));return{name,...result};
  };
  const results=[];
  for(const width of [320,375,390,1280]){
    await page.setViewportSize({width,height:812});
    await seed({screen:'module',level:3,langView:'lesson',langLesson:0,langStep:'model'});
    await page.goto('http://127.0.0.1:8766/#/course/japanese/learn/module/4');await page.reload();
    await page.locator('#modelNext').waitFor();results.push(await check('model'));
    if(await page.locator('.model-sentence .audio-speaker').count()!==1)throw Error('Model speaker count');
    await page.locator('.model-sentence .audio-speaker').click();if(await page.locator('.model-sentence .audio-speaker').getAttribute('data-audio-state')!=='playing')throw Error('No playing state');
    await page.locator('.model-sentence .audio-speaker').click();if(!(await page.evaluate(()=>window.__audioCalls.at(-1).paused)))throw Error('No stop on repeat tap');
    if(width===375)await page.screenshot({path:'output/playwright/audio-v3/model-375-fixture.png',fullPage:true});
    await seed({screen:'module',level:3,langView:'lesson',langLesson:0,langStep:'words'});await page.reload();results.push(await check('words'));
    const speakers=page.locator('#langStepBody .audio-speaker');if(await speakers.count()<2)throw Error('Word speakers missing');await speakers.nth(0).click();await speakers.nth(1).click();
    if(!(await page.evaluate(()=>window.__audioCalls.at(-2).paused)))throw Error('Word playback overlaps');
    if(width===375)await page.screenshot({path:'output/playwright/audio-v3/words-375-fixture.png',fullPage:true});
    await page.locator('#langStepBody [data-dictionary-open]').first().click();if(await page.locator('#dictionaryModal .audio-speaker').count()!==1)throw Error('Dictionary speaker count');results.push(await check('dictionary'));
    if(width===375)await page.screenshot({path:'output/playwright/audio-v3/dictionary-375-fixture.png',fullPage:true});
  }
  return{fixture:true,realSpeechQualityVerified:false,results};
}
