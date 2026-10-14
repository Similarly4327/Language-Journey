// Local QA only: exposes a narrow test probe in the served response, never in index.html.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
http.createServer((req,res)=>{
 const relative=decodeURIComponent(req.url.split('?')[0]),file=path.resolve(root,'.'+(relative==='/'?'/index.html':relative)),within=path.relative(root,file);
 if(within.startsWith('..')||path.isAbsolute(within)||relative.split('/').some(p=>p.startsWith('.'))){res.writeHead(403).end();return}
 fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return}
  if(file===path.join(root,'index.html'))data=data.toString().replace('let hadSavedProgress=false;','window.didacticQa={state,rankState,startThematicPart,thematicAdvance,thematicQuestions,renderMain,show,dialogueHtml,saveProgress,loadProgress,get crash(){return activeWordCrashCourse}};let hadSavedProgress=false;');
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg'})[path.extname(file)]||'application/octet-stream');res.end(data);
 });
}).listen(8768,'127.0.0.1',()=>console.log('Didactic QA: http://127.0.0.1:8768'));
