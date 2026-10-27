'use strict';
(async()=>{
 const {createServer}=await import('vite'),{spawn}=require('node:child_process'),path=require('node:path');
 const root=path.resolve(__dirname,'..'),server=await createServer({root,server:{host:'127.0.0.1',port:0,watch:{ignored:['**/work/**','**/.superpowers/**']}},optimizeDeps:{entries:['tests/smoke/full-app-powerpoint.html']}});
 await server.listen();
 try{
  const env={...process.env,FULL_APP_POWERPOINT_URL:`http://127.0.0.1:${server.httpServer.address().port}/tests/smoke/full-app-powerpoint.html?demo=1`};delete env.ELECTRON_RUN_AS_NODE;
  const child=spawn(require('electron'),[path.join(root,'tests/smoke/native-full-app-powerpoint.cjs')],{cwd:root,env,windowsHide:true,stdio:'inherit'});
  const timer=setTimeout(()=>child.kill(),180000);
  try{const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve)});if(code)throw Error('FULL_APP_ORIGINAL_FAILED '+code)}finally{clearTimeout(timer)}
 }finally{await server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
