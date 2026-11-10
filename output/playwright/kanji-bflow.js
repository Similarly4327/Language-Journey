async page => {
 await page.addInitScript(() => {
  if(!sessionStorage.getItem('lj-kanji-bflow'))return;
  sessionStorage.removeItem('lj-kanji-bflow');
  const k='taal-japanse-leerapp-v1',v=JSON.parse(localStorage.getItem(k));
  v.state.screen='module';v.state.level=10;
  v.state.thematic={level:11,lessonIndex:0,part:'A',step:'words',questionIndex:0,correct:0,answered:false,selected:null,preparedLesson:false,wordBlockIndex:0,microblockIndex:1,sentenceIndex:0,flowRevision:4};
  localStorage.setItem(k,JSON.stringify(v));
 });
 await page.evaluate(()=>sessionStorage.setItem('lj-kanji-bflow','1'));await page.reload();
}
