async (page) => {
  const script=await page.locator('script:not([src])').last().textContent();
  const functionSource=script.slice(script.indexOf('function japaneseWordHtml('),script.indexOf('function dictionaryLessonLabel('));
  await page.evaluate(({functionSource})=>{
    const escapeHtml=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const render=new Function('vocabCatalog','escapeHtml',functionSource+'; return japaneseWordHtml;')(window.LanguageJourneyContent.vocabCatalog,escapeHtml);
    const speaker=document.querySelector('.audio-speaker').cloneNode(true);
    const host=document.getElementById('mainView');
    host.innerHTML='<section class="card"><div class="h2">Woordunits en normale zinnen · layoutcontrole</div><div class="choices" id="qaChoices"></div><div class="panel" style="margin-top:12px">Een langere context voor het losse leerwoord '+render('ください')+'</div><div class="prompt prompt--jp" id="qaSentence" lang="ja">'+render('きっぷをひとつください。ホテルまでのでんしゃにのります。'.repeat(5))+'</div></section>';
    for(const word of ['ください','おねがいします','よんでください']){
      const row=document.createElement('div');row.className='answer-option-row';
      row.innerHTML='<button class="choice choice-jp">'+render(word)+'</button>';
      row.appendChild(speaker.cloneNode(true));document.getElementById('qaChoices').appendChild(row);
    }
  },{functionSource});
  const results=[];
  for(const width of [320,390,768,1280]){
    await page.setViewportSize({width,height:900});
    const metrics=await page.evaluate(()=>{
      const rects=element=>{const range=document.createRange();range.selectNodeContents(element);return [...range.getClientRects()].map(r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom}))};
      return{width:innerWidth,pageWidth:document.documentElement.scrollWidth,
        words:[...document.querySelectorAll('#qaChoices .jp-word')].map(word=>{
          const text=rects(word),unit=word.getBoundingClientRect(),audio=word.closest('.answer-option-row').querySelector('.audio-speaker').getBoundingClientRect();
          return{text:word.textContent,lines:text.length,fullyVisible:word.scrollWidth<=word.clientWidth+1,audioWidth:audio.width,audioHeight:audio.height,noOverlap:unit.right<=audio.left+1||unit.bottom<=audio.top+1||audio.bottom<=unit.top+1};
        }),sentenceLines:rects(document.getElementById('qaSentence')).length,sentenceHasWordUnit:!!document.querySelector('#qaSentence .jp-word')};
    });
    if(metrics.pageWidth>width+1||metrics.sentenceLines<2||metrics.sentenceHasWordUnit||metrics.words.some(word=>word.lines!==1||!word.fullyVisible||!word.noOverlap||word.audioWidth<43||word.audioHeight<43))throw new Error(JSON.stringify(metrics));
    results.push(metrics);await page.screenshot({path:'output/playwright/japanese-word-units-'+width+'.png',fullPage:true});
  }
  console.log(JSON.stringify(results));
}
