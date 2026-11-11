async page => {
 await page.addInitScript(() => {
  if(!sessionStorage.getItem('lj-music-fixture'))return;
  sessionStorage.removeItem('lj-music-fixture');
  const key='taal-japanse-leerapp-v1',v=JSON.parse(localStorage.getItem(key));
  const ids=['vocab-music-yorokobi','vocab-music-kanashimi','vocab-music-kimochi'];
  v.state.music={...(v.state.music||{}),introduced:ids,kanjiIntroduced:[],wordRanks:{['words:'+ids.join('|')]:'Copper'},kanjiRanks:{},componentEvidence:{}};
  v.state.introducedVocabIds=[...new Set([...(v.state.introducedVocabIds||[]),...ids])];
  localStorage.setItem(key,JSON.stringify(v));
 });
 await page.evaluate(()=>sessionStorage.setItem('lj-music-fixture','1'));await page.reload();
}
