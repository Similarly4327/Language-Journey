async page=>{
 if(!(await page.locator('#recallInfo').evaluate(e=>e.open)))await page.locator('#recallInfo summary').click();
 await page.waitForTimeout(200);
 const before=await page.evaluate(()=>localStorage.getItem('taal-japanse-leerapp-v1'));
 const downloadPromise=page.waitForEvent('download');await page.locator('#recallBackup').click();const download=await downloadPromise;await download.saveAs('output/playwright/recall-recovery/downloaded-test-backup.json');
 if(before!==await page.evaluate(()=>localStorage.getItem('taal-japanse-leerapp-v1')))throw Error('Export mutated progress');
 return {filename:download.suggestedFilename(),progressUnchanged:true};
}
