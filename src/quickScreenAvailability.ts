type ElementLike={type?:string;visible?:boolean};
export function canHideSlideContent(slide:{elements?:ElementLike[]}|null|undefined){
  return Boolean(slide?.elements?.some(element=>element.visible!==false&&element.type==='text'));
}
