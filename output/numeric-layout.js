async page => {
 const results=[];
 for (const width of [375,1280]) {
  await page.setViewportSize({width,height:812});
  const result=await page.evaluate(()=>{
    const root=document.createElement('div');root.className='thematic-choices';root.innerHTML=['2','12345','にほん'].map(x=>`<div class="answer-option-row"><button class="btn thematic-choice thematic-choice-jp">${x}</button></div>`).join('');document.querySelector('main').append(root);
    const list=[...root.querySelectorAll('button')].map(b=>({text:b.textContent,align:getComputedStyle(b).textAlign,font:getComputedStyle(b).fontSize,width:Math.round(b.getBoundingClientRect().width)}));root.remove();return list;
  });
  results.push({width,options:result});
 }
 return results;
}
