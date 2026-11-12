async page => {
 const results=[];
 for(const width of [375,1280]){
  await page.setViewportSize({width,height:812});
  results.push({width,choices:await page.locator('[data-thematic-choice]').evaluateAll(buttons=>buttons.map(b=>({text:b.textContent.trim(),align:getComputedStyle(b).textAlign,font:getComputedStyle(b).fontSize}))) });
 }
 return results;
}
