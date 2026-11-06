import {useEffect,useState} from 'react';
import {useI18n} from './i18n';
import type {OnlineMediaAsset} from './platform/types';
import {usePresentation,type ServiceItem,type SlideElement} from './store';
import {qrImage} from './qrImage';

export function publicSiteMapUrl(value:string):string{
 try{
  if(value.length>1000)return '';
  const url=new URL(value.trim());
  return url.protocol==='https:'&&!url.username&&!url.password?url.href:'';
 }catch{return ''}
}

function mapElements(item:ServiceItem,src:string,url:string):SlideElement[]{
 const common={rotation:0,opacity:1,visible:true,locked:true};
 const image:SlideElement={...common,id:item.id+'-map-image',type:'image',name:item.title,x:32,y:24,width:url?1500:1856,height:1032,zIndex:1,properties:{src,fit:'contain'}};
 if(!src)return [];
 if(!url)return [image];
 return [image,{...common,id:item.id+'-map-qr',type:'qr',name:item.title,x:1568,y:704,width:320,height:320,zIndex:2,properties:{src:qrImage(url),text:url}}];
}

export function SiteMapDesigner({item,canEdit}:{item:ServiceItem;canEdit:boolean}){
 const {t}=useI18n();
 const [images,setImages]=useState<OnlineMediaAsset[]|null>(null);
 const [url,setUrl]=useState(String(item.metadata.siteMapUrl??''));
 const src=String(item.metadata.siteMapImage??'');
 useEffect(()=>{
  let active=true;
  const pending=window.desktop?.media.onlineList()??Promise.resolve([]);
  void pending.then(list=>{if(active)setImages(list.filter(asset=>asset.kind==='image'))}).catch(()=>{if(active)setImages([])});
  return()=>{active=false};
 },[]);
 const save=(image:string,link:string)=>{
  const state=usePresentation.getState(),current=state.items.find(entry=>entry.id===item.id);
  if(!current||!canEdit)return;
  const slides=current.slides.map(slide=>({...slide,body:'',background:'#fff',elements:mapElements(current,image,link)}));
  state.updateItem(item.id,{metadata:{...current.metadata,siteMapImage:image,siteMapUrl:link},slides});
 };
 const validUrl=publicSiteMapUrl(url);
 return <fieldset disabled={!canEdit}>
  <legend>{t('siteMapTitle')}</legend>
  <label>{t('siteMapImage')}<select value={src} onChange={event=>save(event.target.value,String(item.metadata.siteMapUrl??''))}>
   <option value="">{t('siteMapChooseImage')}</option>
   {src&&!images?.some(image=>image.downloadUrl===src)&&<option value={src}>{t('siteMapCurrentImage')}</option>}
   {images?.map(image=><option key={image.id} value={image.downloadUrl}>{image.name}</option>)}
  </select></label>
  <label>{t('siteMapPublicUrl')}<input type="url" maxLength={1000} value={url} onChange={event=>setUrl(event.target.value)}/></label>
  <button type="button" disabled={Boolean(url.trim()&&!validUrl)||validUrl===String(item.metadata.siteMapUrl??'')} onClick={()=>save(src,validUrl)}>{t('siteMapSaveLink')}</button>
  {url.trim()&&!validUrl&&<p role="alert">{t('siteMapHttpsRequired')}</p>}
 </fieldset>;
}
