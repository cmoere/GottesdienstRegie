const {spawn}=require('node:child_process');
const path=require('node:path');
async function run(){
 const root=path.resolve(__dirname,'..');
 const {createServer}=await import('vite');
 const server=await createServer({root,server:{host:'127.0.0.1',port:5173,strictPort:true,watch:{ignored:['**/work/**','**/.superpowers/**']}},optimizeDeps:{entries:['tests/smoke/live-announcement-update.html']}});
 await server.listen();
 try{
  for(const fixture of ['desktop-interaction','live-announcement-update']){
   const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
   const child=spawn(require('electron'),[path.join(root,'tests/smoke',fixture+'.cjs')],{cwd:root,env,windowsHide:true,stdio:'inherit'});
   const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve)});
   if(code!==0)throw Error(`${fixture} failed: ${code}`);
  }
 }finally{await server.close()}
}
run().catch(error=>{console.error(error);process.exitCode=1});
