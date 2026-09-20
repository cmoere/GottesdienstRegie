export type VideoAsset={id:string;name:string;kind:string;url:string};
export type MediaSelectionRequest={purpose:'service-item';mediaKind:'video';sectionId:string};
export function createVideoItemFromAsset(asset:VideoAsset,sectionId:string){
  if(asset.kind!=='video')throw new Error('VIDEO_ASSET_REQUIRED');
  const now=Date.now().toString(36);
  return {id:`video-${now}`,type:'video' as const,title:asset.name,section:'',sectionId,slides:[{id:`slide-${now}`,title:asset.name,body:'',elements:[{id:`element-${now}`,type:'video' as const,x:0,y:0,width:1920,height:1080,rotation:0,opacity:1,visible:true,locked:false,properties:{src:asset.url,fit:'contain',autoplay:true,volume:100,endBehavior:'nextSlide'}}]}]};
}
