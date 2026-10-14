// Parent owns test-profile cleanup, only after Electron has completely exited.
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');

async function cleanupProfile(profile,{childExited=false,remove=fs.rmSync,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
  if(!childExited||typeof profile!=='string'||!path.isAbsolute(profile))return false;
  const target=path.resolve(profile),temp=path.resolve(os.tmpdir());
  if(path.dirname(target)!==temp||!/^regie-login-smoke-[\w-]+$/.test(path.basename(target)))return false;
  try{if(fs.lstatSync(target).isSymbolicLink()||fs.realpathSync(target)!==target)return false}catch{return false}
  for(let attempt=0;attempt<3;attempt++){
    try{remove(target,{recursive:true,force:true,maxRetries:0});return true}catch{
      if(attempt<2)await wait(250*(attempt+1));
    }
  }
  return false;
}

async function run(){
  const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
  const child=spawn(require('electron'),[path.join(__dirname,'native-v81-login.cjs')],{env,stdio:['ignore','pipe','pipe'],windowsHide:true});
  let profile='',buffer='',passed=false;
  child.stdout.on('data',data=>{
    process.stdout.write(data);buffer+=data.toString();
    const match=buffer.match(/^LOGIN_SMOKE_PROFILE: (.+)\r?$/m);if(match)profile=match[1].trim();
    if(buffer.includes('LOGIN_BACKGROUND_SMOKE_PASS'))passed=true;
  });
  child.stderr.on('data',data=>process.stderr.write(data));
  return new Promise(resolve=>{
    child.on('error',error=>{console.error(error);resolve(1)});
    child.on('close',async code=>{
      if(profile&&!await cleanupProfile(profile,{childExited:true}))console.warn(`LOGIN_SMOKE_PROFILE_RETAINED: ${profile}`);
      resolve(code===0&&passed?0:code||1);
    });
  });
}
module.exports={cleanupProfile};
if(require.main===module)run().then(code=>{process.exitCode=code}).catch(error=>{console.error(error);process.exitCode=1});
