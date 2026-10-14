export type BannerPosition='top'|'bottom';
export type BannerContext={liveSection:'pre'|'service'|'post'|'other';quickType:string|null;countdownActive:boolean};
export function isBannerAllowed(context:BannerContext):boolean{
  if(context.quickType)return context.quickType==='countdown';
  return context.countdownActive||context.liveSection==='pre'||context.liveSection==='post';
}
export function bannerCycleDurationMs(textWidth:number,viewportWidth:number):number{
  const safe=(value:number)=>Number.isFinite(value)?Math.max(0,value):0;
  return 2000+(safe(textWidth)+safe(viewportWidth))/60*1000;
}
