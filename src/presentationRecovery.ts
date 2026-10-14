// Recovery contains editable document data only. Runtime output/audio state is
// deliberately excluded even when a caller passes the entire store by mistake.
const documentKeys=['linkedEventKey','lyricScrolling','presentationId','title','date','createdAt','updatedAt','archived','trashed','eventId','eventLink','templateId','serviceTime','serviceTimes','createdBy','editHistory','restorePoints','transitionDefault','sections','items','selectedItemId','selectedSlideId','previewItemId','previewSlideId'] as const;

export function sanitizeRecoveryDocument(input:unknown):Record<string,any>|null{
  if(!input||typeof input!=='object')return null;
  const value=input as Record<string,any>;
  if(typeof value.presentationId!=='string'||!value.presentationId.trim()||!Array.isArray(value.items)||!Array.isArray(value.sections))return null;
  if(!value.sections.every((section:any)=>section&&typeof section.id==='string'))return null;
  const validElement=(element:any)=>element&&typeof element.id==='string'&&typeof element.type==='string'&&element.properties&&typeof element.properties==='object';
  const validSlide=(slide:any)=>slide&&typeof slide.id==='string'&&Array.isArray(slide.elements)&&slide.elements.every(validElement);
  if(!value.items.every((item:any)=>item&&typeof item.id==='string'&&Array.isArray(item.slides)&&item.slides.every(validSlide)))return null;
  return Object.fromEntries(documentKeys.filter(key=>Object.hasOwn(value,key)).map(key=>[key,value[key]]));
}
