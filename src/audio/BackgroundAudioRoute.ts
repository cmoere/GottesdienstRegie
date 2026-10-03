/** Owns the media element's native sink. Analysis must never take over this path. */
export class BackgroundAudioRoute{
 ready=false;deviceId='';name='Standardausgang';private queue=Promise.resolve(false);private generation=0;
 constructor(private readonly media:HTMLMediaElement&{setSinkId?:(id:string)=>Promise<void>},private readonly devices:()=>Promise<MediaDeviceInfo[]>=()=>navigator.mediaDevices?.enumerateDevices()??Promise.resolve([])){}
 apply(deviceId:string){
  const id=deviceId==='default'?'':deviceId,generation=++this.generation;this.ready=false;
  this.queue=this.queue.catch(()=>false).then(async()=>{
   try{const list=await this.devices(),device=list.find(d=>d.kind==='audiooutput'&&d.deviceId===id);
    if(id&&!device)throw Error('Output unavailable');
    if(this.media.setSinkId)await this.media.setSinkId(id);else if(id)throw Error('Sink selection unavailable');
    if(generation!==this.generation)return false;
    this.deviceId=id;this.name=device?.label||(id?'Audioausgang':'Standardausgang');this.ready=true;return true;
   }catch{if(generation===this.generation){this.deviceId=id;this.name='Nicht verfügbar';this.ready=false}return false}
  });return this.queue;
 }
}
