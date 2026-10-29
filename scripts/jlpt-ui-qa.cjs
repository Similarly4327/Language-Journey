/* Isolated local UI check; never uses an existing browser profile. */
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
async function run(playwright){
  const http=require('node:http'),root=process.cwd();
  const server=http.createServer((request,response)=>{
    const name=decodeURIComponent(new URL(request.url,'http://localhost').pathname),file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
    if(!file.startsWith(root+path.sep)){response.writeHead(403);response.end();return}
    fs.readFile(file,(error,data)=>{if(error){response.writeHead(404);response.end();return}response.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');response.end(data)});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const dir=path.resolve('output/playwright/jlpt');fs.mkdirSync(dir,{recursive:true});
  const results=[];
  const browser=await playwright.chromium.launch({channel:'msedge',headless:true});
  try{
    for(const viewport of [{width:1280,height:900},{width:390,height:844},{width:320,height:740}]){
      const context=await browser.newContext({viewport,hasTouch:viewport.width<500,isMobile:viewport.width<500});
      const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(()=>{
        const now=Date.now(),record={repetitions:3,intervalDays:7,lastGrade:'knew',lastReviewedAt:now-86400000,dueAt:now+86400000,lapses:0};
        localStorage.setItem('taal-japanse-leerapp-v1',JSON.stringify({version:9,ranks:{'l4-1':{rank:'Copper',attempts:1}},state:{currentCourse:'japanese',currentLevel:4,avatarEnabled:false,audioEnabled:false,introducedVocabIds:['vocab-ねこ'],vocabFirstSeen:{'vocab-ねこ':'2026-10-28'},flashcardProgress:{cards:{'vocab-ねこ::jp-nl':record,'vocab-ねこ::nl-jp':record}}}}));
      });
      await page.goto(base+'/#/course/japanese/progress');
      await page.getByRole('button',{name:'Voortgang',exact:true}).click();
      const card=page.locator('.jlpt-guideline');await card.waitFor({state:'visible'});
      await card.scrollIntoViewIfNeeded();
      assert.match(await card.innerText(),/N5/);assert.doesNotMatch(await card.innerText(),/\d+%/);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal page overflow');
      const info=card.getByLabel('Uitleg over het indicatieve JLPT-niveau');await info.focus();await page.keyboard.press('Enter');
      assert.equal(await card.locator('.jlpt-info').getAttribute('open'),'','keyboard opens info');
      const rect=await card.locator('.jlpt-info p').boundingBox();assert(rect.x>=0&&rect.x+rect.width<=viewport.width+1,'info stays inside viewport');
      await info.click();await card.getByText('Gekoppelde N5-woordkennis',{exact:true}).click();
      assert.match(await card.locator('.jlpt-word-detail p').innerText(),/1 herhaald/);
      await page.screenshot({path:path.join(dir,`progress-${viewport.width}.png`),fullPage:true});
      assert.equal(errors.length,0,errors.join('; '));
      results.push({viewport,errors,overflow:false,keyboardInfo:true,bothDirections:true});
      await context.close();
    }
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
  fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
}
if(require.main===module)run(require(process.env.LJ_PLAYWRIGHT_MODULE||'playwright')).catch(error=>{console.error(error);process.exitCode=1});
module.exports={run};
