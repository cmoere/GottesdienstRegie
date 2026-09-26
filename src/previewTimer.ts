export function timerProgress(remainingSeconds:number,totalSeconds:number){
  if(!Number.isFinite(totalSeconds)||totalSeconds<=0)return 0;
  return Math.max(0,Math.min(1,remainingSeconds/totalSeconds));
}

export function nextTimerHold(currentSlideId:string,slideId:string){
  return currentSlideId===slideId?'':slideId;
}
