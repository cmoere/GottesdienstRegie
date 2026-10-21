import {useState} from 'react';
import {shapeCatalog} from './shapeCatalog';
import {ShapeArtwork} from './ShapeArtwork';
import {useI18n} from './i18n';
import {shapeLabel,shapeCategoryLabel} from './shapeLabels';

export function ShapeGallery({disabled,onSelect}:{disabled?:boolean;onSelect:(kind:string,name:string)=>void}){
 const [open,setOpen]=useState(false),[query,setQuery]=useState('');
 const {t,locale}=useI18n(),needle=query.trim().toLocaleLowerCase(locale);
 const shapes=shapeCatalog.filter(shape=>!needle||`${shape.name} ${shape.category} ${shapeLabel(shape.kind,t)} ${shapeCategoryLabel(shape.category,t)}`.toLocaleLowerCase(locale).includes(needle));
 return <div className="shape-gallery">
  <button type="button" disabled={disabled} onClick={()=>setOpen(value=>!value)}><span className="material-symbols-outlined" aria-hidden="true">category</span> {t('shapeGalleryButton')}</button>
  {open&&<div className="shape-gallery-popover" role="dialog" aria-label={t('shapeGalleryTitle')}>
   <input autoFocus value={query} onChange={event=>setQuery(event.target.value)} placeholder={t('shapeGallerySearch')}/>
   <div>{shapes.map(shape=><button type="button" key={shape.kind} title={shapeCategoryLabel(shape.category,t)} onClick={()=>{
    // Document metadata stays canonical; only the operator labels are regional.
    onSelect(shape.kind,shape.name);setOpen(false);
   }}><span><ShapeArtwork kind={shape.kind}/></span><small>{shapeLabel(shape.kind,t)}</small></button>)}</div>
  </div>}
 </div>;
}
