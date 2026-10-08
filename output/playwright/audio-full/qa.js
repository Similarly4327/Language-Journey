async page => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:375,height:812});
  await page.route('http://127.0.0.1:8785/**',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const response=await route.fetch();
    const html=(await response.text()).replace(/(<script>\s*)([\s\S]*?)(<\/script>)/,(_,a,s,b)=>a+s.replace(/\}\)\(\);\s*$/,
      'window.__audioQa={state,renderMain,startQuiz,speakerButtonHtml,stopAvatarAudio};})();')+b);
    await route.fulfill({response,body:html});
  });
  await page.addInitScript(()=>{
    window.__plays=[];
    window.Audio=class {
      constructor(path){this.src=path;this.paused=true;}
      play(){this.paused=false;window.__plays.push(this);queueMicrotask(()=>this.onplaying?.());return Promise.resolve();}
      pause(){this.paused=true;}
    };
  });
  await page.reload();
  await page.evaluate(()=>{
    const c=window.LanguageJourneyContent,m=window.LanguageJourneyAudioManifest;
    m.assets=c.audioEntries.filter(r=>r.pronunciation?.audioTextKana&&r.pronunciation.status==='specified').map(r=>({
      entryId:r.id,displayText:r.displayText,readingId:r.pronunciation.readingId,audioTextKana:r.pronunciation.audioTextKana,
      voiceRole:'A',reviewed:true,pipelineVersion:m.pipelineVersion,path:'assets/audio/ja/sentences/mock.mp3'}));
    window.__audioQa.state.audioEnabled=true;window.__audioQa.state.avatarAudioOverlay=false;
  });
  const report={screens:[],errors};
  const check=async name=>{
    const row=await page.evaluate(name=>({name,buttons:[...document.querySelectorAll('.audio-speaker')].filter(b=>b.getBoundingClientRect().width>0).length,
      overflow:document.documentElement.scrollWidth>innerWidth,smallButtons:[...document.querySelectorAll('.audio-speaker')].filter(b=>{const r=b.getBoundingClientRect();return r.width>0&&(r.width<44||r.height<44)}).length}),name);
    if(row.overflow||row.smallButtons||!row.buttons)throw Error(JSON.stringify(row));
    report.screens.push(row);
    await page.screenshot({path:'output/playwright/audio-full/'+name+'.png',fullPage:true});
  };
  for(const level of [11,12]){
    await page.evaluate(level=>{const a=window.__audioQa;a.state.level=level-1;a.state.screen='module';a.state.thematic={level,lessonIndex:level===12?2:4,part:'A',step:'reading',questionIndex:0,correct:0,answered:false,selected:null};a.renderMain();},level);
    await check('level-'+level+'-story');
    await page.locator('.audio-speaker').first().click();
    const played=await page.evaluate(()=>window.__plays.length);if(!played)throw Error('No playback');
    await page.locator('.audio-speaker').first().click();
    if(!await page.evaluate(()=>window.__plays.at(-1).paused))throw Error('Second tap did not stop');
  }
  await page.evaluate(()=>{const a=window.__audioQa;a.state.level=4;a.state.screen='module';a.state.tabs.small='learn';a.state.smallLesson=3;a.renderMain();});
  await check('small-tsu');
  if(!await page.locator('#smallItems').innerText().then(t=>t.includes('Hoor in きって')&&t.includes('Hoor in ベッド')))throw Error('Missing example labels');
  await page.evaluate(()=>{const a=window.__audioQa;a.state.smallLesson=4;a.renderMain();});
  await check('long-vowels');
  await page.evaluate(()=>{const a=window.__audioQa;a.state.level=5;a.startQuiz({source:'advanced',title:'Audio QA',official:false,pool:[],choices:3,
    questions:[{kind:'fill',prompt:'これ ___ ねこ です',correct:'は',choices:['は','を','に'],instruction:'Vul in'}]});});
  const before=await page.locator('#qPromptAudio .audio-speaker').count();if(before)throw Error('Blank leaks its answer before answering');
  await page.getByRole('button',{name:'Toon antwoorden',exact:true}).click();
  await page.waitForTimeout(220);
  await page.locator('#qChoices button[data-correct="0"]').first().click();
  if(!await page.locator('#qCorrectAudio .audio-speaker').getAttribute('data-audio-text').then(t=>t==='これ は ねこ です'))throw Error('Missing completed sentence');
  await check('completed-question');
  if(errors.length)throw Error(JSON.stringify(errors));
  return report;
}
