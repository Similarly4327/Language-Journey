async page=>{
  const browser=page.context().browser(),base='http://127.0.0.1:8770',results=[];
  const assert=(value,message)=>{if(!value)throw Error(message)};
  for(const viewport of [{width:375,height:812},{width:1280,height:900}]){
    const context=await browser.newContext({viewport}),p=await context.newPage();
    try{
      await p.route('**/*',async route=>{
        if(route.request().resourceType()!=='document')return route.continue();
        const response=await route.fetch(),html=(await response.text()).replace(/\}\)\(\);\s*<\/script>/,'window.__wordQA={state,startLanguageExam,finishQuiz,knowledgeSnapshot,flashcardEligibleCards};})();</script>');
        await route.fulfill({response,body:html});
      });
      await p.addInitScript(()=>{
        const key='taal-japanse-leerapp-v1';
        if(localStorage.getItem(key))return;
        localStorage.setItem('language-journey-platform-v1',JSON.stringify({uiLanguage:'nl',courseId:'japanese'}));
        localStorage.setItem(key,JSON.stringify({version:9,state:{currentCourse:'japanese',level:3,thematicRevision:1,level11IntegrationRevision:2,introducedVocabIds:['vocab-ねこ'],flashcardProgress:{cards:{'vocab-ねこ::jp-nl':{dueAt:1900000000000,intervalDays:12,repetitions:5,lapses:1,lastGrade:'knew'},'vocab-ねこ::nl-jp':{dueAt:1910000000000,intervalDays:20,repetitions:6,lapses:0,lastGrade:'knew'}}}},ranks:{}}));
      });
      await p.goto(base+'/#/',{waitUntil:'domcontentloaded'});
      await p.waitForFunction(()=>!!window.__wordQA);
      const first=await p.evaluate(()=>{
        const api=window.__wordQA,before=api.knowledgeSnapshot().vocab,srs=JSON.stringify(api.state.flashcardProgress);
        api.startLanguageExam();const afterFirstPrompt=api.knowledgeSnapshot().vocab;api.state.quiz.score=api.state.quiz.questions.length;api.state.quiz.index=api.state.quiz.questions.length;api.finishQuiz();
        const stored=JSON.parse(localStorage.getItem('taal-japanse-leerapp-v1'));
        return{before,afterFirstPrompt,after:api.knowledgeSnapshot().vocab,added:api.state.quiz.newWordCount,recall:api.flashcardEligibleCards().map(word=>word.id).sort(),srs,afterSrs:JSON.stringify(api.state.flashcardProgress),storedWords:stored.state.introducedVocabIds.length,score:document.querySelector('#resultScore').textContent,lastScore:stored.ranks['l4-exam'].last,sessionWords:stored.state.studyTracker.sessions.at(-1).snapshotEnd.vocab};
      });
      // Showing a real question already records its vocabulary as encountered.
      assert(first.before===1&&first.after===20&&first.added===20-first.afterFirstPrompt&&first.storedWords===20&&first.sessionWords===20,'word growth or storage differs from the 19 missing Level 4 words: '+JSON.stringify(first));
      assert(first.recall.length===20&&first.srs===first.afterSrs&&first.lastScore===1&&first.score==='30 / 30','Recall, score or original SRS changed incorrectly');
      await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.__wordQA);
      const repeated=await p.evaluate(()=>{
        const api=window.__wordQA,before=api.knowledgeSnapshot().vocab,srs=JSON.stringify(api.state.flashcardProgress),recall=api.flashcardEligibleCards().map(word=>word.id).sort();
        api.startLanguageExam();api.state.quiz.score=api.state.quiz.questions.length;api.state.quiz.index=api.state.quiz.questions.length;api.finishQuiz();
        return{before,after:api.knowledgeSnapshot().vocab,added:api.state.quiz.newWordCount,srs,recall,rank:JSON.parse(localStorage.getItem('taal-japanse-leerapp-v1')).ranks['l4-exam'].rank,pageWidth:document.documentElement.scrollWidth,viewport:innerWidth};
      });
      assert(repeated.before===20&&repeated.after===20&&repeated.added===0&&repeated.rank==='Silver','reload or repeated pass changes the unique-word count incorrectly');
      assert(repeated.srs===first.srs&&JSON.stringify(repeated.recall)===JSON.stringify(first.recall),'reload changes SRS or Recall eligibility');
      assert(repeated.pageWidth<=repeated.viewport+1,'result page overflows');
      if(viewport.width===375)await p.screenshot({path:'output/playwright/exam-vocabulary/mobile-result.png',fullPage:true});
      results.push({viewport,first,repeated});
    }finally{await context.close()}
  }
  return results;
}
