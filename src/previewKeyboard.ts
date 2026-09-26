export function shouldHandlePreviewArrow(key:string,target:EventTarget|null){
  if(key!=='ArrowLeft'&&key!=='ArrowRight')return false;
  if(document.querySelector('[role="dialog"]'))return false;
  const element=target instanceof Element?target:null;
  return !element?.closest('input,textarea,select,[contenteditable="true"],button,a');
}
