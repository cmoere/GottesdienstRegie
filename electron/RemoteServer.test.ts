import {afterEach,expect,it,vi} from 'vitest';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import https from 'node:https';
import {getLocalTlsIdentity} from './LocalTlsIdentity';
import {RemoteServer} from './RemoteServer';
let server:RemoteServer;
afterEach(()=>server?.stop());
async function startRemote(file:string, command: (message:unknown)=>void, copy?:ConstructorParameters<typeof RemoteServer>[4], nextFrame?:ConstructorParameters<typeof RemoteServer>[5]){
 server=new RemoteServer(file,command,0,undefined,copy,nextFrame);
 await server.start();
 const identity=await getLocalTlsIdentity(path.dirname(file),['127.0.0.1']);
 await server.enableSecure(identity);
 const port=server.get().securePort;
 return (pathname:string,options:RequestInit={})=>new Promise<Response>((resolve,reject)=>{
  const req=https.request({hostname:'127.0.0.1',port,path:pathname,method:options.method,headers:options.headers as Record<string,string>,ca:identity.cert},res=>{
   const chunks:Buffer[]=[];
   res.on('data',chunk=>chunks.push(chunk));
   res.on('end',()=>resolve(new Response(Buffer.concat(chunks),{status:res.statusCode,headers:res.headers as Record<string,string>})));
   res.on('error',reject);
  });
  req.on('error',reject);
  req.end(options.body);
 });
}
it('allows paired annotation commands only on the current live take and revokes them',async()=>{
 const command=vi.fn();
 const request=await startRemote(path.join(await mkdtemp(path.join(tmpdir(),'regie-remote-')),'devices.json'),command);
 const input={name:'Presenter',permissionRole:'view' as const,preferredLanguage:'de' as const,permissions:['remote.view','remote.annotate']};
 const remote=await server.createSession(input),viewer=await server.createSession({...input,permissions:['remote.view']});
 server.updateLive({onAir:true,annotationTakeId:'slide:1',notes:'private'} as any);
 const stroke={id:'one',color:'#ff3b30',width:.004,points:[{x:0,y:0},{x:1,y:1}]};
 const post=(token:string,extra:Record<string,unknown>={})=>request('/api/command',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token,action:'annotate',commandId:crypto.randomUUID(),timestamp:Date.now(),takeId:'slide:1',stroke,...extra})});
 expect((await post(viewer.token)).status).toBe(403);
 expect((await post('monitor:prediger')).status).toBe(403);
 expect((await post(remote.token,{takeId:'old'})).status).toBe(409);
 expect((await post(remote.token,{stroke:{...stroke,width:99}})).status).toBe(400);
 expect((await post(remote.token)).status).toBe(202);
 expect(command).toHaveBeenCalledWith(expect.objectContaining({action:'annotate',stroke,takeId:'slide:1'}));
 const state=await(await request('/api/state?token='+viewer.token)).json();expect(state.notes).toBeUndefined();expect(state.current?.notes).toBeUndefined();
 await server.revokeSession(remote.id);
 expect(command).toHaveBeenLastCalledWith(expect.objectContaining({action:'annotation-clear'}));
 expect((await post(remote.token)).status).toBe(403);
});

it('persists lighting monitors and serves four authorized public previews with revision checks',async()=>{
 const file=path.join(await mkdtemp(path.join(tmpdir(),'regie-lighting-')),'devices.json');
 const command=vi.fn(),frame=vi.fn(async(index=0)=>Buffer.from('preview-'+index));
 const request=await startRemote(file,command,undefined,frame);
 const monitor=await server.saveMonitor({id:'lighting',name:'Lichtoperator (Lighting Operator)',slug:'lichtoperator',profile:'lighting',
  sourceType:'main',layout:'lighting',defaultLanguage:'de',showCurrent:true,showNext:true,showClock:true,showCountdown:true,
  showNotes:false,showOrderOfService:false,enabled:true});
 const viewer=await server.createSession({name:'Viewer',permissionRole:'view',preferredLanguage:'en',permissions:['remote.view']});
 const upcoming=Array.from({length:5},(_,index)=>({slide:{id:String(index),title:'Folie '+index,body:'Sichtbarer Text',notes:'privat'},sourceHash:'secret',itemTitle:'Lied'}));
 server.updateLive({onAir:true,next:upcoming[0].slide,upcoming:upcoming as any,nextPreviewRevision:4});
 const token=encodeURIComponent('monitor:'+monitor.token);
 const state=await(await request('/api/state?token='+token)).json();
 expect(state.monitor).toMatchObject({profile:'lighting',layout:'lighting'});
 expect(state.upcoming).toHaveLength(4);
 expect(JSON.stringify(state)).not.toContain('privat');
 expect(JSON.stringify(state)).not.toContain('secret');
 expect((await(await request('/api/state?token='+viewer.token)).json()).upcoming).toBeUndefined();
 expect((await request('/api/next-frame?token='+token+'&index=3&revision=4')).status).toBe(200);
 expect(frame).toHaveBeenCalledWith(3);
 expect((await request('/api/next-frame?token='+token+'&index=4')).status).toBe(400);
 expect((await request('/api/next-frame?token='+token+'&index=-1')).status).toBe(400);
 expect((await request('/api/next-frame?token='+viewer.token+'&index=1')).status).toBe(403);
 expect((await request('/api/next-frame?token='+token+'&index=1&revision=3')).status).toBe(409);
 const restored=new RemoteServer(file,vi.fn());await restored.start();
 expect(restored.get().monitors[0]).toMatchObject({profile:'lighting',layout:'lighting',token:monitor.token});
 const savedAgain=await server.saveMonitor({...monitor,id:'another-generated-id'});
 expect(savedAgain.id).toBe(monitor.id);expect(savedAgain.token).toBe(monitor.token);
 server.updateLive({onAir:false,title:'Andere Präsentation',notes:'Interne Notiz'});
 const offAir=await(await request('/api/state?token='+token)).json();
 expect(offAir).toMatchObject({onAir:false,current:null,next:null,upcoming:[],title:monitor.name});
 expect(offAir.notes).toBeUndefined();
 expect((await request('/api/next-frame?token='+token+'&index=0')).status).toBe(409);
 server.updateLive({onAir:true,title:'Nächste Präsentation'});
 expect((await request('/monitor/'+monitor.token)).status).toBe(200);
 expect(command).not.toHaveBeenCalled();
 await server.removeMonitor(monitor.id);
 expect((await request('/api/next-frame?token='+token+'&index=0')).status).toBe(403);
});

it('passes regional captions to the actual authorized German remote page',async()=>{
 const command=vi.fn(),copy=vi.fn((key:string)=>'regional:'+key);
 const request=await startRemote(path.join(await mkdtemp(path.join(tmpdir(),'regie-remote-copy-')),'devices.json'),command,copy);
 const remote=await server.createSession({name:'Presenter',permissionRole:'view',preferredLanguage:'de',permissions:['remote.view']});
 const response=await request('/remote/'+remote.token),html=await response.text();
 expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toBe('no-store');
 expect(html).toContain('regional:remoteWaiting');expect(copy).toHaveBeenCalledWith('remoteCurrent');
 expect(command).not.toHaveBeenCalled();
});

it('migrates monitor links to HTTPS credentials and denies the old readable slug',async()=>{
 const file=path.join(await mkdtemp(path.join(tmpdir(),'regie-monitor-')),'devices.json');
 await writeFile(file,JSON.stringify({monitors:[{id:'one',slug:'prediger',name:'Prediger',sourceType:'main',enabled:true,showNotes:true}],remotes:[]}));
 const request=await startRemote(file,vi.fn());
 const monitor=server.get().monitors[0];
 expect(monitor.token).toMatch(/^[A-Za-z0-9_-]{32}$/);
 expect((await request('/monitor/prediger')).status).toBe(403);
 expect((await request('/api/state?token=monitor:prediger')).status).toBe(403);
 const page=await request('/monitor/'+monitor.token);
 expect(page.status).toBe(200);
 expect(page.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
 server.updateLive({notes:'Predigtnotizen'});
 const state=await(await request('/api/state?token=monitor:'+monitor.token)).json();
 expect(state.notes).toBe('Predigtnotizen');
 await expect(fetch('http://127.0.0.1:'+server.get().securePort+'/api/state')).rejects.toThrow();
});
it('authorizes the live stream and ends an existing connection when access is revoked',async()=>{
 const folder=await mkdtemp(path.join(tmpdir(),'regie-stream-')),command=vi.fn(),capture=vi.fn(async()=>Buffer.from('jpeg-frame'));
 server=new RemoteServer(path.join(folder,'devices.json'),command,0,capture);await server.start();const identity=await getLocalTlsIdentity(folder,['127.0.0.1']);await server.enableSecure(identity);
 const viewer=await server.createSession({name:'Viewer',permissionRole:'view',preferredLanguage:'de',permissions:['remote.view']});
 const request=(token:string,revoke=false)=>new Promise<{status:number;type:string;data:string}>((resolve,reject)=>{const req=https.get({hostname:'127.0.0.1',port:server.get().securePort,path:'/api/live?token='+encodeURIComponent(token)+'&view=test',ca:identity.cert},res=>{const chunks:Buffer[]=[];let revoked=false;res.on('data',chunk=>{chunks.push(chunk);if(revoke&&!revoked){revoked=true;void server.revokeSession(viewer.id)}});res.on('end',()=>resolve({status:res.statusCode!,type:String(res.headers['content-type']),data:Buffer.concat(chunks).toString()}));res.on('error',reject)});req.on('error',reject)});
 expect((await request('invalid')).status).toBe(403);expect((await request(viewer.token)).status).toBe(409);
 server.updateLive({onAir:true});const result=await request(viewer.token,true);expect(result.status).toBe(200);expect(result.type).toContain('multipart/x-mixed-replace');expect(result.data).toContain('jpeg-frame');expect(capture).toHaveBeenCalledTimes(1);expect((await request(viewer.token)).status).toBe(403);
});
