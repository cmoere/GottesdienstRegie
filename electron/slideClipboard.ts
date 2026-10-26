type RenderedImage={isEmpty():boolean;toPNG():Buffer};
/** Electron 45 uses an asynchronous, MIME-based clipboard API. */
export async function copySlideImage<Item>(dataUrl:string,createImage:(url:string)=>RenderedImage,createItem:(png:Blob)=>Item,write:(items:Item[])=>Promise<void>){
 const image=createImage(dataUrl);if(image.isEmpty())throw Error('SLIDE_RENDER_FAILED');
 const png=new Blob([Uint8Array.from(image.toPNG())],{type:'image/png'});
 await write([createItem(png)]);return true;
}
