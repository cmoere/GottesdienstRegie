'use strict';
(async()=>{
 const {createServer}=await import('vite');
 const {spawn}=require('node:child_process'),path=require('node:path');
 const root=path.resolve(__dirname,'..');
 const server=await createServer({root,server:{host:'127.0.0.1',port:0,watch:{ignored:['**/work/**']}},optimizeDeps:{noDiscovery:true}});
 await server.listen();
 try{
  const env={...process.env,OPERATOR_DESIGN_URL:`http://127.0.0.1:${server.httpServer.address().port}`};delete env.ELECTRON_RUN_AS_NODE;
  const fixture=process.argv.includes('--real')?'operator-surfaces.cjs':'operator-design.cjs';
  const child=spawn(require('electron'),[path.join(root,'tests/smoke',fixture)],{cwd:root,env,windowsHide:true,stdio:'inherit'});
  const timeout=setTimeout(()=>child.kill(),120000);
  try{const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve)});if(code)throw Error('OPERATOR_DESIGN_FAILED '+code)}finally{clearTimeout(timeout)}
 }finally{await server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
