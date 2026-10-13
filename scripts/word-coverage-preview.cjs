const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
http.createServer((request,response)=>{
  let relative;try{relative=decodeURIComponent(request.url.split('?')[0])}catch{response.writeHead(400).end();return}
  const file=path.resolve(root,'.'+(relative==='/'?'/index.html':relative)),within=path.relative(root,file);
  if(within.startsWith('..')||path.isAbsolute(within)||relative.split('/').some(part=>part.startsWith('.'))){response.writeHead(403).end();return}
  fs.readFile(file,(error,data)=>{if(error){response.writeHead(404).end();return}
    const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.mp3':'audio/mpeg'};
    response.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');response.end(data);
  });
}).listen(8766,'127.0.0.1',()=>console.log('Word coverage preview: http://127.0.0.1:8766'));
