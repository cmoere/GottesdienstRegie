import{warningDurationMs,type WeatherWarningReply,type WeatherWarningState}from'../../shared/weatherWarnings';
export class WeatherWarningSession{
 private state:WeatherWarningState|null=null;private revision=0;private nextSafeAt=0;private signature='';
 update(reply:WeatherWarningReply|null,allowed:boolean,now:number):WeatherWarningState|null{
  if(!allowed||!reply||reply.status==='unavailable'||now-reply.fetchedAt>120000||reply.fetchedAt>now+60000){this.state=null;this.signature='';return null}
  const alive=reply.warnings.filter(row=>Date.parse(row.validFrom)<=now&&Date.parse(row.validUntil)>now),signature=JSON.stringify(alive);
  if(!alive.length){this.state=null;this.signature='';return null}
  const expired=this.state?.items.some(row=>Date.parse(row.validUntil)<=now);
  if(!this.state||expired||(signature!==this.signature&&now>=this.nextSafeAt)){
   this.state={revision:++this.revision,cycleStartedAtMs:now,fetchedAt:reply.fetchedAt,items:structuredClone(alive)};this.signature=signature;this.nextSafeAt=now+warningDurationMs(alive[0]);
  }else if(signature===this.signature&&this.state.fetchedAt!==reply.fetchedAt){this.state={...this.state,revision:++this.revision,fetchedAt:reply.fetchedAt}}
  if(now>=this.nextSafeAt&&this.state){const durations=this.state.items.map(warningDurationMs),total=durations.reduce((a,b)=>a+b,0);let phase=Math.max(0,now-this.state.cycleStartedAtMs)%total;for(const duration of durations){if(phase<duration){this.nextSafeAt=now+duration-phase;break}phase-=duration}}
  return this.state;
 }
}
