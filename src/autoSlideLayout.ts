/** Shared 1920 × 1080 design coordinates for generated slides only. */
export const AUTO_SLIDE_EDGE=32;
export const AUTO_SLIDE_WIDTH=1920-AUTO_SLIDE_EDGE*2;
export const AUTO_SLIDE_QR={x:1608,y:410,width:280,height:280};
export const AUTO_SLIDE_QR_TEXT_RIGHT=AUTO_SLIDE_QR.x-32;
export const EVENT_TABLE_TITLE_WIDTH=AUTO_SLIDE_WIDTH*.42-20;
export function eventOverviewTitleWidth(design:string){
 if(design==='cards')return (AUTO_SLIDE_WIDTH-57.6)/2-61.44-25.92;
 if(design==='poster')return (AUTO_SLIDE_WIDTH-23.04)/2-42.24-2-105.6-25.92;
 if(design==='timeline')return AUTO_SLIDE_WIDTH-9.6-4.8-38.4;
 return AUTO_SLIDE_WIDTH;
}
