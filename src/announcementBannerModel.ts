export type BannerPosition='top'|'bottom';
export type BannerContext={liveSection:'pre'|'warmup'|'service'|'post'|'other';quickType:string|null;countdownActive:boolean};
export function isBannerAllowed(context:BannerContext):boolean{
  if(context.quickType)return context.quickType==='countdown';
  return context.countdownActive||context.liveSection==='pre'||context.liveSection==='warmup'||context.liveSection==='post';
}
export function bannerCycleDurationMs(textWidth:number,_viewportWidth:number):number{
  const safe=(value:number)=>Number.isFinite(value)?Math.max(0,value):0;
  return Math.max(64,safe(textWidth)+64)/60*1000;
}
