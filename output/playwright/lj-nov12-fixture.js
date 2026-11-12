async page => {
 await page.addInitScript(() => {
   if(!sessionStorage.getItem('lj-fixture'))return;
   sessionStorage.removeItem('lj-fixture');
   const key='taal-japanse-leerapp-v1',v=JSON.parse(localStorage.getItem(key));
   v.state.thematicCompleted={...(v.state.thematicCompleted||{}),'l11-home-1':{A:true,B:true}};
   localStorage.setItem(key,JSON.stringify(v));
 });
 await page.evaluate(()=>sessionStorage.setItem('lj-fixture','1'));await page.reload();
}
