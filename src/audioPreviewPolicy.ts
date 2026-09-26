export function shouldSyncBackgroundAudio({onAir,mode,playInPreview}:{onAir:boolean;mode:'edit'|'preview';playInPreview:boolean}){
  return onAir||(mode==='preview'&&playInPreview);
}
