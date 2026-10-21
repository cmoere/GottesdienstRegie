// Standalone diagnostic: never imports the application main process or starts ON AIR.
const fs=require('node:fs/promises'),path=require('node:path'),{spawn}=require('node:child_process'),readline=require('node:readline');
async function runProbe({root}){
  root=path.resolve(root);
  if(process.platform!=='win32')return {visual:false,audio:'unsupported',results:{reason:'WINDOWS_REQUIRED'}};
  const folder=await fs.mkdtemp(path.join(root,'work/powerpoint-probe-'));
  await fs.writeFile(path.join(folder,'.probe-owned'),'GottesdienstRegie own diagnostic files only\n');
  const compiler=path.join(process.env.SystemRoot||'C:/Windows','Microsoft.NET/Framework64/v4.0.30319/csc.exe'),exe=path.join(folder,'PowerPointProbe.exe');
  const interop=path.join(process.env.SystemRoot||'C:/Windows','assembly/GAC_MSIL/Microsoft.Office.Interop.PowerPoint/15.0.0.0__71e9bce111e9429c/Microsoft.Office.Interop.PowerPoint.dll');
  const build=spawn(compiler,['/nologo','/target:exe','/out:'+exe,'/r:Microsoft.CSharp.dll','/r:System.Web.Extensions.dll','/r:System.Windows.Forms.dll','/link:'+interop,path.join(root,'scripts/powerpoint-probe/PowerPointProbe.cs')],{windowsHide:true,stdio:['ignore','pipe','pipe']});
  let compileOutput='';build.stdout.on('data',c=>compileOutput+=c);build.stderr.on('data',c=>compileOutput+=c);
  const buildCode=await new Promise((resolve,reject)=>{build.once('error',reject);build.once('close',resolve)});
  if(buildCode!==0)throw Error('PROBE_COMPILE_FAILED: '+compileOutput);
  const helper=spawn(exe,[folder],{windowsHide:true,stdio:['pipe','pipe','pipe']});
  const pending=new Map();let serial=0,readyResolve,readyReject;
  const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject});
  const readyTimeout=setTimeout(()=>readyReject(Error('PROBE_OFFICE_TIMEOUT')),30000);
  const lines=readline.createInterface({input:helper.stdout});
  lines.on('line',line=>{try{const value=JSON.parse(line);if(value.kind==='ready'){clearTimeout(readyTimeout);readyResolve(value)}else if(value.kind==='error'){clearTimeout(readyTimeout);readyReject(Error(value.message));for(const waiter of pending.values())waiter.reject(Error(value.message));pending.clear()}else if(value.id&&pending.has(value.id)){const waiter=pending.get(value.id);pending.delete(value.id);clearTimeout(waiter.timer);waiter.resolve(value)}}catch(error){readyReject(error)}});
  helper.once('error',readyReject);
  helper.once('exit',code=>{if(code!==0)readyReject(Error('PROBE_HELPER_EXIT_'+code));for(const waiter of pending.values())waiter.reject(Error('PROBE_HELPER_EXIT'));pending.clear()});
  function command(type,extra={}){return new Promise((resolve,reject)=>{const id=String(++serial),timer=setTimeout(()=>{pending.delete(id);reject(Error('PROBE_COMMAND_TIMEOUT'))},10000);pending.set(id,{resolve,reject,timer});helper.stdin.write(JSON.stringify({id,type,...extra})+'\n')})}
  const report={visual:false,audio:'unsupported',results:{folder}};
  try{
    const state=await ready;report.results.office=state;
    if(state.sourcePath!==path.join(folder,'owned-source.pptx'))throw Error('PROBE_UNICODE_PATH_MISMATCH');
    console.log('POWERPOINT_PROBE_READY '+JSON.stringify({version:state.version,windowHandle:state.windowHandle,status:state.status}));
    const assert=require('node:assert/strict');
    await command('play');
    const first=await command('next'),second=await command('next'),third=await command('next');
    assert.equal(first.status.clickIndex,1);assert.equal(second.status.clickIndex,2);assert.equal(third.status.slideIndex,2);
    await command('pause');await new Promise(resolve=>setTimeout(resolve,2300));
    assert.equal((await command('status')).status.slideIndex,2);
    await command('resume');await new Promise(resolve=>setTimeout(resolve,2300));
    assert.equal((await command('status')).status.slideIndex,3);
    report.results.controls={clickSequence:[first.status,second.status,third.status],pause:true,automaticAdvance:true};
    await command('goto',{index:1});await command('pause');
    // Capture implementation is deliberately gated by the native helper being operational.
    if(!require('node:fs').existsSync(path.join(root,'scripts/powerpoint-probe/capture.cjs')))report.results.reason='CAPTURE_PROBE_NOT_IMPLEMENTED';
    else report.results= {...report.results,...await require('./powerpoint-probe/capture.cjs').captureProbe({root,folder,state,command})};
    const closed=await command('close');report.results.foreignDocumentUnchanged=closed.foreignDocumentUnchanged;
    report.visual=report.results.captureReady===true&&closed.foreignDocumentUnchanged===true;
  }catch(error){report.results.reason=error.message;try{const closed=await command('close');report.results.foreignDocumentUnchanged=closed.foreignDocumentUnchanged}catch{}}
  finally{clearTimeout(readyTimeout);lines.close();if(helper.exitCode===null){helper.stdin.end();setTimeout(()=>{if(helper.exitCode===null)helper.kill()},3000).unref()}}
  await fs.writeFile(path.join(folder,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('POWERPOINT_PROBE_REPORT '+path.join(folder,'report.json'));
  return report;
}
module.exports={runProbe};
if(require.main===module)runProbe({root:path.resolve(__dirname,'..')}).then(result=>{console.log(JSON.stringify(result,null,2));if(!result.visual)process.exitCode=1}).catch(error=>{console.error(error);process.exitCode=1});
