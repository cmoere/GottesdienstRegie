import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {readWindowsGitHubCredential} from './windowsCredential';

function gitExecutable(){
  if(process.platform==='win32')for(const root of [process.env.ProgramW6432,process.env.ProgramFiles,process.env.LOCALAPPDATA&&path.join(process.env.LOCALAPPDATA,'Programs')]){
    if(root){const file=path.join(root,'Git','cmd','git.exe');if(existsSync(file))return file;}
  }
  return 'git';
}

// The repository owner is not necessarily the signed-in GitHub user. Let the
// credential helper select the existing host account; repository permissions
// are checked separately. Never open an interactive login from a background read.
export function createGitHubCredentialReader(){
  let pending:Promise<string|null>|undefined,cached:string|null=null,expiresAt=0;
  return (owner=''):Promise<string|null>=>{
    if(Date.now()<expiresAt)return Promise.resolve(cached);
    if(pending)return pending;
    const lookup=new Promise<string|null>(resolve=>{
      let done=false;const chunks:Buffer[]=[];let bytes=0;
      const child=spawn(gitExecutable(),['credential','fill'],{windowsHide:true,stdio:['pipe','pipe','ignore'],env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'never'}});
      const finish=(token:string|null)=>{if(done)return;done=true;clearTimeout(timer);resolve(token)};
      const timer=setTimeout(()=>{finish(null);child.kill()},5000);timer.unref?.();
      child.stdin.on('error',()=>finish(null));child.stdout.on('error',()=>finish(null));
      child.on('error',()=>finish(null));
      child.stdout.on('data',chunk=>{bytes+=chunk.length;if(bytes>65536){finish(null);child.kill();return}chunks.push(Buffer.from(chunk))});
      child.on('close',code=>{
        if(code!==0){finish(null);return}
        const fields=new Map(Buffer.concat(chunks).toString('utf8').split(/\r?\n/).map(line=>{const at=line.indexOf('=');return [line.slice(0,at),line.slice(at+1)]}));
        finish(fields.get('password')||fields.get('oauth_token')||null);
      });
      child.stdin.end('protocol=https\nhost=github.com\n\n');
    });
    pending=lookup.catch(()=>null).then(async token=>token??await readWindowsGitHubCredential(owner)).then(token=>{cached=token;expiresAt=Date.now()+(token?30000:2000);pending=undefined;return token});
    return pending;
  };
}
