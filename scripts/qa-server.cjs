'use strict';
// CI-only server: production HTML and the real optional-tutor handler, offline.
// No credentials or upstream provider requests are used by browser regressions.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../dist');
delete process.env.OPENAI_API_KEY;
http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1');
  if(url.pathname==='/api/tutor') {
    const {default:handler}=await import('../api/tutor.js');
    const chunks=[];let size=0;
    for await(const chunk of req) {size+=chunk.length;if(size>40000){res.writeHead(413);res.end();return;}chunks.push(chunk);}
    let body={};try {if(chunks.length)body=JSON.parse(Buffer.concat(chunks).toString());}catch{res.writeHead(400);res.end();return;}
    await handler({method:req.method,body},{status(code){res.statusCode=code;return this;},json(data){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));}});
    return;
  }
  if(url.pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}
  const file=url.pathname==='/'?'index.html':url.pathname==='/SHA256.txt'?'SHA256.txt':url.pathname==='/release.json'?'release.json':null;
  if(!file){res.writeHead(404);res.end('Not found');return;}
  res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.json')?'application/json':'text/plain');
  res.end(fs.readFileSync(path.join(root,file)));
}).listen(4173,'127.0.0.1');
