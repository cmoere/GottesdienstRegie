/** The caller supplies its shared app clock. Rendering never accumulates ticks. */
export function remainingCountdownMs(durationMs:number,startedAtMs:number,nowMs:number):number{
  const duration=Number.isFinite(durationMs)?Math.max(0,durationMs):0;
  if(!Number.isFinite(startedAtMs)||!Number.isFinite(nowMs))return duration;
  return Math.max(0,duration-Math.max(0,nowMs-startedAtMs));
}
