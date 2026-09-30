export type RadioPreviewMedia={src:string;load:()=>void;play:()=>Promise<void>};
export async function startRadioPreview(media:RadioPreviewMedia,streamUrl:string){
  media.src=streamUrl;
  media.load();
  await media.play();
}
