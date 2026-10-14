async (page) => {
  const check=(condition,message)=>{if(!condition)throw Error(message)};
  await page.goto('http://127.0.0.1:8768/#/course/japanese/learn/level/11');
  await page.setViewportSize({width:390,height:844});
  const rows=await page.evaluate(()=>{
    const q=window.didacticQa,m=window.LanguageJourneyContent.manifest,out=[];
    q.state.avatarEnabled=false;
    for(const l of m.lessons.filter(l=>l.didactics)){
      q.state.level=l.level-1;q.state.screen='module';q.state.thematic={level:l.level,lessonIndex:l.order-1,part:'A',step:'lesson',questionIndex:0,correct:0,flowRevision:1};q.renderMain();
      document.getElementById('thematicStartA').click();
      const wordBlocks=[];
      while(q.state.thematic.step==='words'){
        wordBlocks.push(document.querySelectorAll('#thematicBody .thematic-words .panel').length);
        document.getElementById('thematicWordsNext').click();
      }
      const deck=q.crash?.queue||[],planned=deck.map(card=>({id:card.word.id,direction:card.direction}));
      // Exercise timing is checked below; here inspect every authored preparation screen.
      q.thematicAdvance('sentences');
      const sentences=[];
      while(q.state.thematic.step==='sentences'){
        sentences.push(document.querySelector('#thematicBody .model-sentence')?.textContent);
        document.getElementById('thematicSentenceNext').click();
      }
      const story=document.querySelector('#thematicBody .thematic-reading')?.textContent;
      q.state.thematic.part='B';q.thematicAdvance('reading');
      const source=document.querySelector('.thematic-resource');
      out.push({id:l.id,newWords:l.didactics.newWordIds.length,wordBlocks,planned,sentences:sentences.length,story:!!story,resource:source?.dataset.resourceKind,resourceRows:source?.children.length,overflow:document.documentElement.scrollWidth>innerWidth+1});
    }
    return out;
  });
  check(rows.length===20,'all 20 lessons');
  for(const row of rows){check(row.wordBlocks.every(n=>n<=3),row.id+' vocabulary block');check(row.story&&row.sentences>0,row.id+' preparation/story');check(row.resourceRows>1&&!row.overflow,row.id+' practical source/layout');check(row.planned.length===row.newWords*2,row.id+' vocabulary coverage')}
  await page.screenshot({path:'output/playwright/didactic-hotel-390.png',fullPage:true});
  // Actual click/clock flow, using the same DOM a learner sees.
  await page.evaluate(()=>{const q=window.didacticQa;q.state.level=10;q.state.screen='module';q.state.thematic={level:11,lessonIndex:0,part:'A',step:'questions',questionIndex:0,correct:0,answered:false,preparedLesson:true,flowRevision:1};q.renderMain()});
  const before=await page.locator('.thematic-choices').boundingBox();
  check(await page.locator('#thematicReveal').isVisible(),'options concealed');
  check(await page.locator('[data-thematic-choice]').first().isDisabled(),'hidden options locked');
  await page.locator('#thematicReveal').click();
  const after=await page.locator('.thematic-choices').boundingBox();check(before.height===after.height,'reveal preserves height');
  check(await page.evaluate(()=>!window.didacticQa.state.thematic.answered),'reveal is not an answer');
  await page.waitForTimeout(200);
  let answer=await page.evaluate(()=>window.LanguageJourneyContent.thematicCourses[10].lessons[0].applications[0].questions[0].answer);
  await page.locator('[data-thematic-choice]').filter({hasText:answer}).click();
  check(await page.locator('.is-correct').count()===1,'correct green');check(await page.locator('#thematicNext').count()===0,'no mandatory next after correct');
  await page.waitForTimeout(1750);
  check(await page.evaluate(()=>window.didacticQa.state.thematic.questionIndex===1),'automatic next');
  check(await page.locator('#thematicReveal').isVisible(),'next options reset');
  await page.locator('#thematicReveal').click();await page.waitForTimeout(200);
  answer=await page.evaluate(()=>window.LanguageJourneyContent.thematicCourses[10].lessons[0].applications[0].questions[1].answer);
  await page.locator('[data-thematic-choice]').filter({hasNotText:answer}).first().click();
  check(await page.locator('.is-correct').count()===1&&await page.locator('.is-incorrect').count()===1,'wrong red and correct green');
  await page.waitForTimeout(1750);check(await page.locator('#thematicNext').isVisible(),'wrong requires manual continue');
  await page.screenshot({path:'output/playwright/didactic-feedback-390.png',fullPage:true});
  await page.locator('#thematicNext').click();check(await page.evaluate(()=>window.didacticQa.state.thematic.step==='done'),'manual completes A');
  // Correct final automatically completes; a stale timer must not reopen an exited lesson.
  for(const exit of [false,true]){
    await page.evaluate(()=>{const q=window.didacticQa;q.state.thematic={level:11,lessonIndex:0,part:'A',step:'questions',questionIndex:1,correct:0,answered:false,preparedLesson:true,flowRevision:1};q.renderMain()});
    await page.locator('#thematicReveal').click();await page.waitForTimeout(200);
    await page.locator('[data-thematic-choice]').filter({hasText:answer}).click();
    if(exit)await page.evaluate(()=>window.didacticQa.thematicAdvance('lesson'));
    await page.waitForTimeout(1750);
    check(await page.evaluate(expected=>window.didacticQa.state.thematic.step===expected,exit?'lesson':'done'),exit?'stale clock cancelled':'last auto-completes');
  }
  await page.setViewportSize({width:320,height:800});
  await page.evaluate(()=>{const q=window.didacticQa;q.state.level=13;q.state.screen='module';q.state.thematic={level:14,lessonIndex:0,part:'B',step:'reading',preparedLesson:true,questionIndex:0,correct:0,flowRevision:1};q.renderMain()});
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'320px has no horizontal overflow');
  check(await page.locator('.dialogue-turn').count()===3,'three hotel dialogue turns');
  for(const image of await page.locator('.dialogue-identity img').all())await image.scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('.dialogue-identity img')).every(img=>img.complete&&img.naturalWidth>0));
  await page.screenshot({path:'output/playwright/didactic-dialogue-320.png',fullPage:true});
  const report={lessons:rows,feedback:'correct auto / wrong manual / final auto / stale timer cancelled',mobileWidths:[320,390]};
  const pending=page.waitForEvent('download');
  await page.evaluate(report=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));a.download='didactic-results.json';a.click()},report);
  const download=await pending;await download.saveAs('output/playwright/didactic-results.json');
}
