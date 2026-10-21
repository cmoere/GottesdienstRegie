const {spawn}=require('node:child_process');
const path=require('node:path');
const fs=require('node:fs/promises');
async function captureProbe({root,folder,state,command}){
  const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
  const child=spawn(require('electron'),[__filename,folder,state.rootWindowHandle,JSON.stringify(state.crop)],{env,windowsHide:true,stdio:['ignore','pipe','pipe','ipc']});
  let log='';child.stdout.on('data',chunk=>{log+=chunk;process.stdout.write(chunk)});child.stderr.on('data',chunk=>log+=chunk);
  let report;
  child.on('message',async message=>{
    if(message?.type==='office-command'){
      try{if(!['goto','play','pause','next','status'].includes(message.command))throw Error('PROBE_COMMAND_NOT_ALLOWED');const response=await command(message.command,message.command==='goto'?{index:message.index}:{});child.send({type:'office-reply',id:message.id,response});}
      catch(error){child.send({type:'office-reply',id:message.id,error:error.message})}
    }else if(message?.type==='report')report=message.report;
  });
  const timeout=setTimeout(()=>child.kill(),100000);
  const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve)});
  clearTimeout(timeout);await fs.writeFile(path.join(folder,'capture.log'),log);
  if(code!==0||!report)throw Error('PROBE_CAPTURE_FAILED: '+log.slice(-2500));
  return report;
}
module.exports={captureProbe};

if(process.versions.electron){
  const {app,BrowserWindow,desktopCapturer,ipcMain}=require('electron');
  const assert=require('node:assert/strict');
  const folder=path.resolve(process.argv[2]),handle=process.argv[3],crop=JSON.parse(process.argv[4]);
  app.setPath('userData',path.join(folder,'electron-profile'));
  app.commandLine.appendSwitch('autoplay-policy','no-user-gesture-required');
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const commandPending=new Map();let requestId=0;
  process.on('message',message=>{if(message.type!=='office-reply')return;const pending=commandPending.get(message.id);if(!pending)return;commandPending.delete(message.id);message.error?pending.reject(Error(message.error)):pending.resolve(message.response)});
  function office(command,index){return new Promise((resolve,reject)=>{const id=++requestId;commandPending.set(id,{resolve,reject});process.send({type:'office-command',id,command,index})})}
  const frames=[],windows=[],latest=new Map();
  ipcMain.on('probe:frame',(event,frame)=>{const role=windows.find(win=>win.webContents.id===event.sender.id)?.probeRole;if(!role||!Number.isFinite(frame.marker)||!Number.isFinite(frame.at))return;const value={...frame,role};frames.push(value);latest.set(role,value)});
  const html='<!doctype html><style>html,body{margin:0;background:black}video{width:100vw;height:100vh;object-fit:contain}</style><video autoplay playsinline muted></video>';
  async function window(role){const win=new BrowserWindow({show:false,width:1920,height:1080,webPreferences:{nodeIntegration:true,contextIsolation:false,backgroundThrottling:false}});win.probeRole=role;windows.push(win);await win.loadFile(path.join(__dirname,'capture.html'));return win;}
  const gathered=`new Promise(resolve=>{if(pc.iceGatheringState==='complete')resolve();else{const timer=setTimeout(()=>resolve(),5000);pc.addEventListener('icegatheringstatechange',()=>{if(pc.iceGatheringState==='complete'){clearTimeout(timer);resolve()}})}})`;
  app.whenReady().then(async()=>{
    const sources=await desktopCapturer.getSources({types:['window'],thumbnailSize:{width:1920,height:1080}});
    const own=sources.find(source=>source.id.split(':')[1]===handle);
    // Record IDs only, never titles or thumbnails of other windows.
    await fs.writeFile(path.join(folder,'capture-source-identities.json'),JSON.stringify({requestedHandle:handle,availableIds:sources.map(source=>source.id)},null,2));
    assert.ok(own,'Own PowerPoint HWND is not an available window capture source');
    await fs.writeFile(path.join(folder,'owned-window-thumbnail.png'),own.thumbnail.toPNG());
    console.log('PROBE_SOURCE_OWNED '+own.id);
    const host=await window('host');
    host.webContents.on('console-message',event=>console.log('PROBE_HOST_CONSOLE '+event.message));
    await host.webContents.executeJavaScript(`(async()=>{globalThis.stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{mandatory:{chromeMediaSource:'desktop',chromeMediaSourceId:${JSON.stringify(own.id)},maxWidth:1920,maxHeight:1080,maxFrameRate:30}}});globalThis.peers={};return true})()`);
    assert.ok(crop.width>0&&crop.height>0&&crop.x>=0&&crop.y>=0&&crop.x+crop.width<=crop.outerWidth&&crop.y+crop.height<=crop.outerHeight,'Owned slide surface must be fully inside its show frame');
    await host.webContents.executeJavaScript(`(async()=>{const video=document.querySelector('video');video.srcObject=stream;await video.play();const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;const context=canvas.getContext('2d');const tap=document.createElement('canvas');tap.width=tap.height=1;const probe=tap.getContext('2d',{willReadFrequently:true});let previous=-1;const crop=${JSON.stringify(crop)};const frame=()=>{if(video.readyState>=2){context.drawImage(video,video.videoWidth*crop.x/crop.outerWidth,video.videoHeight*crop.y/crop.outerHeight,video.videoWidth*crop.width/crop.outerWidth,video.videoHeight*crop.height/crop.outerHeight,0,0,1920,1080);probe.drawImage(video,video.videoWidth*.5,video.videoHeight*.15,1,1,0,0,1,1);const pixel=probe.getImageData(0,0,1,1).data,max=Math.max(pixel[0],pixel[1],pixel[2]),marker=max<30?0:pixel[0]===max?1:pixel[1]===max?2:3;if(marker!==previous){previous=marker;require('electron').ipcRenderer.send('probe:frame',{marker,at:Date.now(),pixel:Array.from(pixel),mediaTime:video.currentTime})}}setTimeout(frame,33)};setTimeout(frame,33);globalThis.stream=canvas.captureStream(30);return true})()`);
    for(const role of ['main','mirror']){
      const consumer=await window(role);
      await consumer.webContents.executeJavaScript(`globalThis.pc=new RTCPeerConnection({iceServers:[]});pc.ontrack=event=>{const video=document.querySelector('video');video.srcObject=event.streams[0];video.play();const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const context=canvas.getContext('2d',{willReadFrequently:true});let previous=-1;const frame=(now,metadata)=>{if(video.readyState<2){setTimeout(()=>frame(Date.now(),{mediaTime:video.currentTime}),33);return;}context.drawImage(video,video.videoWidth*.5,video.videoHeight*.15,1,1,0,0,1,1);const pixel=context.getImageData(0,0,1,1).data;const max=Math.max(pixel[0],pixel[1],pixel[2]);const marker=max<30?0:pixel[0]===max?1:pixel[1]===max?2:3;if(marker!==previous){previous=marker;require('electron').ipcRenderer.send('probe:frame',{marker,at:Date.now(),pixel:Array.from(pixel),mediaTime:metadata.mediaTime});}setTimeout(()=>frame(Date.now(),{mediaTime:video.currentTime}),33)};setTimeout(()=>frame(Date.now(),{mediaTime:video.currentTime}),33)};true`);
      const offer=await host.webContents.executeJavaScript(`(async()=>{const pc=new RTCPeerConnection({iceServers:[]});peers[${JSON.stringify(role)}]=pc;for(const track of stream.getTracks())pc.addTrack(track,stream);await pc.setLocalDescription(await pc.createOffer());await ${gathered};return pc.localDescription.toJSON()})()`);
      const answer=await consumer.webContents.executeJavaScript(`(async()=>{await pc.setRemoteDescription(${JSON.stringify(offer)});await pc.setLocalDescription(await pc.createAnswer());await ${gathered};return pc.localDescription.toJSON()})()`);
      await host.webContents.executeJavaScript(`peers[${JSON.stringify(role)}].setRemoteDescription(${JSON.stringify(answer)})`);
    }
    // Observe real yellow-marker positions, not merely advancing video clocks.
    for(const win of windows){
      const region=win.probeRole==='host'?{x:crop.x/crop.outerWidth,y:(crop.y+crop.height*.89)/crop.outerHeight,width:crop.width/crop.outerWidth}:{x:0,y:.89,width:1};
      await win.webContents.executeJavaScript(`(()=>{globalThis.motionSamples=[];const video=document.querySelector('video'),canvas=document.createElement('canvas');canvas.width=960;canvas.height=1;const context=canvas.getContext('2d',{willReadFrequently:true}),region=${JSON.stringify(region)};setInterval(()=>{if(video.readyState<2||motionSamples.length>=5000)return;context.drawImage(video,video.videoWidth*region.x,video.videoHeight*region.y,video.videoWidth*region.width,1,0,0,960,1);const data=context.getImageData(0,0,960,1).data;let sum=0,count=0;for(let x=0;x<960;x++)if(data[x*4]>150&&data[x*4+1]>150&&data[x*4+2]<100){sum+=x;count++}motionSamples.push({at:Date.now(),mediaTime:video.currentTime,x:count?sum/count:null})},33);return true})()`);
    }
    const deadline=Date.now()+12000;
    while(Date.now()<deadline&&(!latest.has('main')||!latest.has('mirror')))await wait(100);
    await fs.writeFile(path.join(folder,'initial-frames.json'),JSON.stringify(frames,null,2));
    async function observeTransport(filename){
      const transport=[];
      for(const win of windows){
        const status=await win.webContents.executeJavaScript(`(async()=>{const video=document.querySelector('video'),quality=video.getVideoPlaybackQuality(),peersToCheck=globalThis.peers?Object.entries(globalThis.peers):globalThis.pc?[['consumer',globalThis.pc]]:[];const connections=[];for(const [role,peer] of peersToCheck){const stats=await peer.getStats();connections.push({role,connection:peer.connectionState,ice:peer.iceConnectionState,stats:[...stats.values()].filter(row=>['inbound-rtp','outbound-rtp','transport','candidate-pair','media-source','codec'].includes(row.type))})}return {observedAt:Date.now(),visibility:document.visibilityState,video:{readyState:video.readyState,width:video.videoWidth,height:video.videoHeight,currentTime:video.currentTime,paused:video.paused,error:video.error?.message,totalVideoFrames:quality.totalVideoFrames,droppedVideoFrames:quality.droppedVideoFrames},tracks:[...(globalThis.stream?.getTracks()??video.srcObject?.getTracks()??[])].map(track=>({kind:track.kind,state:track.readyState,muted:track.muted,settings:track.getSettings()})),connections}})()`);
        transport.push({role:win.probeRole,...status});
      }
      await fs.writeFile(path.join(folder,filename),JSON.stringify(transport,null,2));
      const motion=[];
      for(const win of windows)motion.push({role:win.probeRole,samples:await win.webContents.executeJavaScript('globalThis.motionSamples')});
      await fs.writeFile(path.join(folder,'motion-'+filename),JSON.stringify(motion,null,2));
    }
    await observeTransport('transport-diagnostics.json');
    assert.equal(latest.get('main')?.marker,1,'MAIN did not decode the owned red slide marker');
    assert.equal(latest.get('mirror')?.marker,1,'Mirror did not decode the owned red slide marker');
    await office('play');
    const started=Date.now(),samples=[];
    while(Date.now()-started<60000){
      const target=samples.length%2===0?3:1,start=Date.now();
      await office('goto',target);
      const until=Date.now()+2000;
      while(Date.now()<until&&!['main','mirror'].every(role=>latest.get(role)?.marker===target&&latest.get(role).at>=start))await wait(10);
      const a=latest.get('main'),b=latest.get('mirror');
      if(!(a?.marker===target&&b?.marker===target&&a.at>=start&&b.at>=start)){
        const videos=[];
        for(const win of windows)videos.push({role:win.probeRole,...await win.webContents.executeJavaScript(`(()=>{const video=document.querySelector('video');const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const context=canvas.getContext('2d',{willReadFrequently:true});if(video.readyState>=2)context.drawImage(video,video.videoWidth*.5,video.videoHeight*.15,1,1,0,0,1,1);return {readyState:video.readyState,currentTime:video.currentTime,width:video.videoWidth,height:video.videoHeight,paused:video.paused,pixel:Array.from(context.getImageData(0,0,1,1).data)}})()`)});
        await fs.writeFile(path.join(folder,'failed-command-observation.json'),JSON.stringify({start,target,office:await office('status'),latest:Object.fromEntries(latest),frames,videos},null,2));
        await observeTransport('transport-at-failure.json');
      }
      assert.ok(a?.marker===target&&b?.marker===target&&a.at>=start&&b.at>=start,'Original frame did not reach both outputs');
      const source=latest.get('host');
      samples.push({start,target,sourceAt:source?.marker===target?source.at:undefined,mainAt:a.at,mirrorAt:b.at,mirrorSkewMs:Math.abs(a.at-b.at),commandToFrameMs:Math.max(a.at,b.at)-start});
      await wait(Math.max(0,1000-(Date.now()-start)));
    }
    await observeTransport('transport-after-measurement.json');
    const percentile=values=>values.sort((a,b)=>a-b)[Math.ceil(values.length*.95)-1];
    const measuredSource=samples.filter(sample=>Number.isFinite(sample.sourceAt)&&sample.sourceAt>=sample.start);
    const metrics={durationMs:Date.now()-started,sampleCount:samples.length,mirrorSkewP95Ms:percentile(samples.map(x=>x.mirrorSkewMs)),commandToFrameP95Ms:percentile(samples.map(x=>x.commandToFrameMs)),commandToSourceP95Ms:percentile(measuredSource.map(x=>x.sourceAt-x.start)),sourceToFrameP95Ms:percentile(measuredSource.map(x=>Math.max(x.mainAt,x.mirrorAt)-x.sourceAt))};
    await fs.writeFile(path.join(folder,'frame-measurements.json'),JSON.stringify({metrics,samples,frames},null,2));
    for(const win of windows)await fs.writeFile(path.join(folder,win.probeRole+'-output.png'),(await win.webContents.capturePage()).toPNG());
    const report={captureReady:metrics.mirrorSkewP95Ms<=150&&metrics.commandToFrameP95Ms<=250,metrics};
    process.send({type:'report',report});console.log('PROBE_CAPTURE_METRICS '+JSON.stringify(metrics));
    for(const win of windows)win.destroy();app.exit(0);
  }).catch(error=>{console.error(error.stack||error);for(const win of windows)if(!win.isDestroyed())win.destroy();app.exit(1)});
}
