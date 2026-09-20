export type Rect={left:number;right:number;top:number;bottom:number};
export type Size={width:number;height:number};
export type PopoverPlacement={left:number;top:number;side:'top'|'bottom'};
export function placePopover(anchor:Rect,popup:Size,viewport:Size,gap=6):PopoverPlacement{
  const margin=6,below=anchor.bottom+gap;
  const side:PopoverPlacement['side']=below+popup.height<=viewport.height-margin?'bottom':'top';
  return {left:Math.min(viewport.width-margin-popup.width,Math.max(margin,anchor.left)),top:side==='bottom'?below:Math.max(margin,anchor.top-gap-popup.height),side};
}
