const {spawn}=require('node:child_process'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'..'),folder=await fs.mkdtemp(path.join(root,'work/screen-test-native-'));
 await fs.writeFile(path.join(folder,'.probe-owned'),'Owned Bildschirmtest UI fixture\n');
 const {createServer}=await import('vite');const server=await createServer({root,server:{host:'127.0.0.1',port:0,watch:{ignored:['**/work/**','**/.superpowers/**']}},optimizeDeps:{entries:['tests/smoke/screen-test-output.html']}});
 await server.listen();
 try{const env={...process.env,SCREEN_TEST_PROBE_FOLDER:folder,SCREEN_TEST_PROBE_URL:`http://127.0.0.1:${server.httpServer.address().port}/tests/smoke/screen-test-output.html`};delete env.ELECTRON_RUN_AS_NODE;
  const child=spawn(require('electron'),[path.join(root,'tests/smoke/screen-test-output.cjs')],{cwd:root,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
  let log='';child.stdout.on('data',data=>{log+=data;process.stdout.write(data)});child.stderr.on('data',data=>{log+=data;process.stderr.write(data)});
  const timer=setTimeout(()=>child.kill(),165000);
  let code;try{code=await new Promise((resolve,reject)=>{child.once('close',resolve);child.once('error',reject)})}finally{clearTimeout(timer);await fs.writeFile(path.join(folder,'process.log'),log)}
  if(code!==0)throw Error('SCREEN_TEST_NATIVE_FAILED '+folder);
 }finally{await server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
