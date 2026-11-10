async page => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('lj-kanji-fixture')) return;
    sessionStorage.removeItem('lj-kanji-fixture');
    const key='taal-japanse-leerapp-v1', saved=JSON.parse(localStorage.getItem(key));
    saved.state.introducedVocabIds=[...new Set([...(saved.state.introducedVocabIds||[]),'vocab-わたし'])];
    saved.state.kanjiExposureIds=['vocab-わたし'];
    saved.state.kanjiRecognitionEvidence={'vocab-わたし':{sourceId:'exercise-l11-home-1-watashi-kanji',at:Date.now()}};
    saved.ranks['l11-home-1']={...saved.ranks['l11-home-1'],rank:'Copper'};
    localStorage.setItem(key,JSON.stringify(saved));
  });
  await page.evaluate(() => sessionStorage.setItem('lj-kanji-fixture','1'));
  await page.reload();
}
