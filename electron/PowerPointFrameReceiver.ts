type Binding={sessionId:string;generation:string};
type Key=Binding&{slotId:number;sequence:number};
type ImportRef={getVideoFrame():VideoFrame;release():void};
type Receive=(payload:{importedSharedTexture:ImportRef},key:unknown)=>Promise<void>;
type ReceiverBridge={invoke(channel:string):Promise<unknown>;listen(channel:string,callback:(value:unknown)=>void):()=>void;send(channel:string,value:unknown):void;receive(callback:Receive):void};
type Surface={canvas:HTMLCanvasElement;draw(frame:VideoFrame):Promise<void>;copy(canvas:HTMLCanvasElement):Promise<void>|void;dispose():void};
type Factory=(dom:Document,onLost:()=>void)=>Surface;
const exact=(v:any,keys:string[])=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(key=>Object.hasOwn(v,key));
const token=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{32}$/.test(v);
const binding=(v:any):v is Binding=>exact(v,['sessionId','generation'])&&token(v.sessionId)&&token(v.generation);
const id=(v:Binding)=>v.sessionId+'/'+v.generation;

/** Isolated preload only: textures and VideoFrames never cross contextBridge. */
export function installPowerPointFrameReceiver(bridge:ReceiverBridge,dom:Document=document,factory:Factory=createSurface){
 type Session={binding:Binding;surface:Surface;replicas:Map<HTMLElement,Surface>;sequence:number;hasFrame:boolean;busy:boolean;retired:boolean;failed:boolean};
 const sessions=new Map<string,Session>();let latest='',closed=false,liveBindingSeen=false;
 const targets=(s:Session)=>Array.from(dom.querySelectorAll<HTMLElement>(`[data-powerpoint-session="${s.binding.sessionId}"][data-powerpoint-generation="${s.binding.generation}"]`)).slice(0,4);
 function fault(s:Session){if(s.failed||closed)return;s.failed=true;bridge.send('powerpoint:frame-fault',{...s.binding,code:'POWERPOINT_FRAME_RENDER_FAILED'})}
 function dispose(s:Session){s.retired=true;sessions.delete(id(s.binding));if(s.busy)return;s.surface.dispose();s.surface.canvas.remove();for(const replica of s.replicas.values()){replica.dispose();replica.canvas.remove()}s.replicas.clear()}
 async function attach(s:Session){
  if(s.retired||s.busy||!s.hasFrame||closed)return;const nodes=targets(s);
  if(!nodes.length)return;
  if(s.surface.canvas.parentElement!==nodes[0])nodes[0].replaceChildren(s.surface.canvas);
  for(const[node,replica]of s.replicas)if(!nodes.includes(node)||node===nodes[0]){replica.dispose();replica.canvas.remove();s.replicas.delete(node)}
  for(const node of nodes.slice(1)){if(s.replicas.has(node))continue;const replica=factory(dom,()=>fault(s));s.replicas.set(node,replica);await replica.copy(s.surface.canvas);if(!s.retired&&node.isConnected)node.replaceChildren(replica.canvas)}
 }
 function reconcile(){if(closed)return;for(const s of [...sessions.values()]){if(id(s.binding)!==latest&&!targets(s).length){dispose(s);continue}void attach(s).catch(()=>fault(s))}}
 const observer=new MutationObserver(reconcile);observer.observe(dom.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-powerpoint-session','data-powerpoint-generation']});
 function bind(value:unknown){
  if(closed||value===null)return;if(!binding(value))return;const key=id(value);latest=key;
  if(!sessions.has(key)){
   for(const old of [...sessions.values()])if(!targets(old).length)dispose(old);
   if(sessions.size>=2){bridge.send('powerpoint:frame-fault',{...value,code:'POWERPOINT_FRAME_BUSY'});return;}
   let s:Session;try{const surface=factory(dom,()=>{if(s)fault(s)});s={binding:{...value},surface,replicas:new Map(),sequence:0,hasFrame:false,busy:false,retired:false,failed:false};sessions.set(key,s)}catch{bridge.send('powerpoint:frame-fault',{...value,code:'POWERPOINT_FRAME_UNSUPPORTED'});return;}
  }
  bridge.send('powerpoint:receiver-ready',{...value});reconcile();
 }
 const off=bridge.listen('powerpoint:frame-bind',value=>{liveBindingSeen=true;bind(value)});
 bridge.receive(async({importedSharedTexture:reference},value)=>{
  let frame:VideoFrame|undefined,s:Session|undefined,released=false,ownedBusy=false;
  try{
   if(closed||!exact(value,['sessionId','generation','slotId','sequence']))return;const key=value as Key;
   if(!token(key.sessionId)||!token(key.generation))return;s=sessions.get(id(key));
   // An old in-flight import is closed, without reporting a new-source fault.
   if(!s||s.retired||s.failed)return;
   if(!Number.isInteger(key.slotId)||key.slotId<0||key.slotId>2||!Number.isSafeInteger(key.sequence)||key.sequence<=s.sequence||s.busy)throw Error('FRAME_KEY');
   s.busy=true;ownedBusy=true;frame=reference.getVideoFrame();if(frame.codedWidth!==1920||frame.codedHeight!==1080)throw Error('FRAME_SIZE');
   await Promise.all([s.surface,...s.replicas.values()].map(surface=>surface.draw(frame!)));
   const drawn=frame;frame=undefined;drawn.close();released=true;reference.release();s.sequence=key.sequence;s.hasFrame=true;
   if(!s.retired)bridge.send('powerpoint:frame-ack',{key:{sessionId:key.sessionId,generation:key.generation,slotId:key.slotId,sequence:key.sequence}});
  }catch{if(s)fault(s)}finally{
   try{frame?.close()}catch{if(s)fault(s)}
   try{if(!released){released=true;reference.release()}}catch{if(s)fault(s)}
   if(s&&ownedBusy){const source=s;source.busy=false;if(source.retired)dispose(source);else void attach(source).catch(()=>fault(source))}
  }
 });
 void bridge.invoke('powerpoint:receiver-boot').then(value=>{if(!liveBindingSeen)bind(value)}).catch(()=>{});
 return()=>{closed=true;off();observer.disconnect();for(const s of [...sessions.values()])dispose(s)};
}

// One plain source-texture pass: no probe stamps, slide styles or transitions.
const vertex=`#version 300 es
in vec2 position;out vec2 uv;void main(){gl_Position=vec4(position,0.,1.);uv=vec2((position.x+1.)*.5,(1.-position.y)*.5);}`;
const fragment=`#version 300 es
precision highp float;uniform sampler2D sourceTexture;in vec2 uv;out vec4 color;void main(){color=texture(sourceTexture,uv);}`;
function createSurface(dom:Document,onLost:()=>void):Surface{
 const canvas=dom.createElement('canvas');canvas.width=1920;canvas.height=1080;canvas.setAttribute('aria-hidden','true');canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';
 const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:true});if(!gl)throw Error('WEBGL_UNAVAILABLE');let dead=false;
 const lost=(event:Event)=>{event.preventDefault();if(!dead)onLost()};canvas.addEventListener('webglcontextlost',lost);
 function shader(type:number,source:string){const result=gl!.createShader(type);if(!result)throw Error('SHADER');gl!.shaderSource(result,source);gl!.compileShader(result);if(!gl!.getShaderParameter(result,gl!.COMPILE_STATUS)){gl!.deleteShader(result);throw Error('SHADER')}return result}
 const program=gl.createProgram(),buffer=gl.createBuffer(),texture=gl.createTexture();if(!program||!buffer||!texture)throw Error('WEBGL_RESOURCES');
 const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('PROGRAM');
 gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
 gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.uniform1i(gl.getUniformLocation(program,'sourceTexture'),0);gl.viewport(0,0,1920,1080);
 async function draw(source:VideoFrame|HTMLCanvasElement){
  if(dead)throw Error('SURFACE_CLOSED');gl!.texImage2D(gl!.TEXTURE_2D,0,gl!.RGBA,gl!.RGBA,gl!.UNSIGNED_BYTE,source);gl!.drawArrays(gl!.TRIANGLES,0,3);const sync=gl!.fenceSync(gl!.SYNC_GPU_COMMANDS_COMPLETE,0);gl!.flush();if(!sync||gl!.getError()!==gl!.NO_ERROR)throw Error('DRAW');
  try{const deadline=performance.now()+400;await new Promise<void>((resolve,reject)=>{const poll=()=>{if(dead)return reject(Error('SURFACE_CLOSED'));const status=gl!.clientWaitSync(sync,0,0);if(status===gl!.ALREADY_SIGNALED||status===gl!.CONDITION_SATISFIED)resolve();else if(status===gl!.WAIT_FAILED||performance.now()>=deadline)reject(Error('FENCE'));else setTimeout(poll,1)};poll()})}finally{gl!.deleteSync(sync)}
 }
 return{canvas,draw,copy:draw,dispose(){if(dead)return;dead=true;canvas.removeEventListener('webglcontextlost',lost);gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext()}};
}
