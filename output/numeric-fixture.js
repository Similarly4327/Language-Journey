async page => {
 await page.addInitScript(() => {
  if (!sessionStorage.getItem('numeric-fixture')) return;
  sessionStorage.removeItem('numeric-fixture');
  const key='taal-japanse-leerapp-v1', data=JSON.parse(localStorage.getItem(key));
  data.state.level=11; data.state.screen='module';
  data.state.thematic={level:12,lessonIndex:0,part:'A',step:'questions',microblockIndex:1,flowRevision:1,questionIndex:0,correct:0,answered:false,optionsRevealed:true};
  localStorage.setItem(key,JSON.stringify(data));
 });
 await page.evaluate(()=>sessionStorage.setItem('numeric-fixture','1'));
 await page.reload();
}
