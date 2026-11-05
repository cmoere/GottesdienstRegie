import {useEffect,useMemo,useRef,useState} from 'react';
import {useI18n} from '../i18n';
import {usePresentation} from '../store';
import {SlideRenderer} from '../SlideRenderer';
import {buildDraftItem,insertDraftItem,type DraftLayout} from './draftInsertion';
import type {SlideDraft} from '../../shared/localSlideDraft';
import type {SlidePackStatus} from '../../electron/localSlides/SlideModelPack';
import './localSlides.css';
export function LocalSlideDraftDialog({sectionId,close}:{sectionId:string;close:()=>void}){
 const {tx}=useI18n(),api=window.desktop?.localSlides,imageApi=window.desktop?.localImages,onAir=usePresentation(state=>state.onAir);
 const presentationId=useRef(usePresentation.getState().presentationId),anchorId=useRef(usePresentation.getState().selectedItemId),generation=useRef(0),dialog=useRef<HTMLDivElement>(null);
 const [topic,setTopic]=useState(''),[notes,setNotes]=useState(''),[count,setCount]=useState(3),[layout,setLayout]=useState<DraftLayout>('ai');
 const [withImages,setWithImages]=useState(Boolean(imageApi)&&!onAir),[images,setImages]=useState<Record<number,{id:string;preview:string}>>({}),[creatingImages,setCreatingImages]=useState(false);
 const [pack,setPack]=useState<SlidePackStatus|null>(null),[busy,setBusy]=useState(false),[drafts,setDrafts]=useState<SlideDraft[]>([]),[error,setError]=useState('');
 const [imagePack,setImagePack]=useState<SlidePackStatus|null>(null);
 const [elapsed,setElapsed]=useState(0);
 useEffect(()=>{if(!busy){setElapsed(0);return}const started=Date.now(),timer=setInterval(()=>setElapsed(Math.floor((Date.now()-started)/1000)),1000);return()=>clearInterval(timer)},[busy]);
 useEffect(()=>{
  let active=true,polling=false;const previous=document.activeElement as HTMLElement|null;
  const refresh=async()=>{if(!api||polling)return;polling=true;try{const [status,pictures]=await Promise.all([api.status(),imageApi?.status().catch(()=>null)]);if(active){setPack(status);setImagePack(pictures??null)}}catch{if(active)setError('Das lokale Modell ist derzeit nicht verfügbar.')}finally{polling=false}};
  void refresh();const timer=setInterval(()=>void refresh(),1000);dialog.current?.querySelector<HTMLInputElement>('input')?.focus();
  return()=>{active=false;clearInterval(timer);generation.current++;void api?.cancel().catch(()=>{});void imageApi?.discard().catch(()=>{});previous?.focus()};
 },[api,imageApi]);
 useEffect(()=>{if(onAir){setWithImages(false);setImages({});void imageApi?.discard().catch(()=>{})}},[onAir,imageApi]);
 const item=useMemo(()=>drafts.length?buildDraftItem(topic,drafts,sectionId,layout,Object.fromEntries(Object.entries(images).map(([key,value])=>[key,value.preview]))):null,[topic,drafts,sectionId,layout,images]);
 const generate=async()=>{
  const generateImages=withImages&&layout==='ai'&&Boolean(imageApi);
  if(!api||busy||pack?.state!=='ready'||(generateImages&&imagePack?.state!=='ready')||!topic.trim())return;
  const revision=++generation.current;setBusy(true);setError('');setImages({});
  try{
   await imageApi?.discard();
   if(generation.current!==revision)return;
   const result=await api.generate({topic,notes,count,design:!onAir});
   if(generation.current!==revision)return;
   setDrafts(result);
   const livePrompt=`A calm illustrative nature or church motif without lettering for this theme: ${topic.replace(/[<>\u0000-\u001f]/g,' ')}`;
   const prompts=onAir?[livePrompt]:result.map(draft=>draft.design?.imagePrompt);
   if(generateImages&&onAir===usePresentation.getState().onAir&&imageApi&&prompts.some(Boolean)){
    setCreatingImages(true);
    try{
     if((await imageApi.status()).state!=='ready')throw Error('MODEL_MISSING');
     for(let index=0;index<prompts.length;index++){
      const prompt=prompts[index];if(!prompt)continue;
      if(generation.current!==revision||onAir!==usePresentation.getState().onAir)return;
      const image=await imageApi.generate(prompt);
      if(generation.current!==revision||onAir!==usePresentation.getState().onAir)return;
      setImages(current=>({...current,[index]:image}));
     }
    }catch(error){
     if(generation.current===revision&&onAir===usePresentation.getState().onAir){
      setError(error instanceof Error&&error.message.includes('LOCAL_IMAGE_LOW_MEMORY')
       ?'Zu wenig freier Arbeitsspeicher für das Bild. Der Textentwurf bleibt erhalten.'
       :'Bilder konnten nicht erstellt werden. Der Textentwurf bleibt erhalten.');
     }
    }
   }
  }
  catch{if(generation.current===revision&&(onAir||!usePresentation.getState().onAir))setError('Es konnte kein gültiger Folienentwurf erstellt werden. Bitte kürzere Stichpunkte verwenden und erneut versuchen.')}
  finally{if(generation.current===revision){setBusy(false);setCreatingImages(false)}}
 };
 const accept=async()=>{
  if(!item||busy)return;
  const revision=++generation.current;let accepted=item;const entries=layout==='ai'?Object.entries(images):[];setBusy(true);
  try{
   if(entries.length&&imageApi){const urls=await imageApi.accept(entries.map(([,image])=>image.id));accepted=buildDraftItem(topic,drafts,sectionId,layout,Object.fromEntries(entries.map(([index],order)=>[index,urls[order]])))}
   if(generation.current!==revision)return;
   if(!insertDraftItem(accepted,presentationId.current,sectionId,anchorId.current)){setError('Die Präsentation oder der Betriebszustand wurde geändert. Bitte den Entwurf erneut öffnen.');return}close();
  }catch{if(generation.current===revision)setError('Das lokale Modell ist derzeit nicht verfügbar.')}finally{if(generation.current===revision)setBusy(false)}
 };
 const update=(index:number,key:'title'|'body',value:string)=>setDrafts(current=>current.map((draft,i)=>i===index?{...draft,[key]:value}:draft));
 return <div className="local-slide-backdrop" onPointerDown={event=>{if(event.target===event.currentTarget)close()}}>
  <div ref={dialog} className="local-slide-dialog" role="dialog" aria-modal="true" aria-labelledby="local-slide-title" onKeyDown={event=>{
   if(event.key==='Escape'){event.stopPropagation();close()}
   if(event.key==='Tab'){
    const controls=[...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled)')],first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
   }
  }}>
   <header><h2 id="local-slide-title">{tx('Folien mit KI erstellen')}</h2><button type="button" onClick={close}>{tx('Schließen')}</button></header>
   <p>{tx('Thema und Stichpunkte bleiben auf diesem Rechner. Das Modell wird einmalig heruntergeladen und arbeitet danach offline.')}</p>
   {onAir&&<p role="status">{tx('ON AIR wird bei Bedarf ein Bild für die erste Folie erzeugt.')}</p>}
   {onAir&&pack&&pack.state!=='ready'&&<p role="status">{tx('Das Textmodell für ON AIR muss vorher bei OFF AIR heruntergeladen werden.')}</p>}
   {onAir&&withImages&&imagePack?.state!=='ready'&&<p role="status">{tx('Das Bildmodell für ON AIR muss vorher bei OFF AIR heruntergeladen werden.')}</p>}
   {!api&&<p role="alert">{tx('Die lokale Folien-KI ist nur in der Desktop-Anwendung verfügbar.')}</p>}
   <section className="local-slide-model"><p>{tx('Modelle werden automatisch vorbereitet. Status und Entfernen: Einstellungen → Präsentation → Lokale KI-Modelle.')}</p>{[pack,imagePack].map((model,index)=>model?.state==='downloading'&&<div key={index}><span>{index===0?tx('Text und Gestaltung'):tx('Bilder und Motive')}</span><progress max={model.totalBytes} value={model.downloadedBytes}/><span>{Math.floor(model.downloadedBytes/1000000)} / {Math.ceil(model.totalBytes/1000000)} MB</span></div>)}</section>
   <div className="local-slide-inputs">
    <label>{tx('Thema')}<input maxLength={400} value={topic} onChange={event=>setTopic(event.target.value)} disabled={busy}/></label>
    <label>{tx('Stichpunkte und vorhandener Text')}<textarea maxLength={8000} value={notes} onChange={event=>setNotes(event.target.value)} disabled={busy} rows={4}/></label>
    <label>{tx('Anzahl Folien')}<input type="number" min={1} max={8} value={count} onChange={event=>setCount(Number(event.target.value))} disabled={busy}/></label>
    <label>{tx('Layout')}<select disabled={busy} value={layout} onChange={event=>setLayout(event.target.value as DraftLayout)}><option value="ai">{onAir?tx('Standard'):tx('KI-Gestaltung')}</option><option value="light">{tx('Hell')}</option><option value="dark">{tx('Dunkel')}</option><option value="accent">{tx('Mit Kopfbereich')}</option></select></label>
    <label><input type="checkbox" checked={withImages&&layout==='ai'} disabled={busy||!imageApi||layout!=='ai'} onChange={event=>setWithImages(event.target.checked)}/>{tx('Bilder lokal erzeugen')}</label>
   </div>
   <div className="local-slide-actions"><button disabled={busy||!api||pack?.state!=='ready'||Boolean(withImages&&layout==='ai'&&imageApi&&imagePack?.state!=='ready')||!topic.trim()||!Number.isInteger(count)||count<1||count>8} onClick={()=>void generate()}>{busy?tx('Folien werden lokal erstellt …'):tx('Folien erstellen')}</button>
    {busy&&<><progress aria-label={tx('Folien werden lokal erstellt …')}/><output>{elapsed} s</output><button onClick={()=>{generation.current++;setBusy(false);setCreatingImages(false);setImages({});void api?.cancel();void imageApi?.discard()}}>{tx('Erstellung abbrechen')}</button><p>{creatingImages?tx('Bilder werden lokal erstellt …'):tx('Die lokale Erstellung kann mehrere Minuten dauern. Du kannst sie jederzeit abbrechen.')}</p>{creatingImages&&<p>{tx('Ein Bild kann mehrere Minuten dauern.')}</p>}</>}
   </div>
   {error&&<p role="alert">{tx(error)}</p>}
   {item&&<><p>{tx('KI-Entwurf: Bitte Inhalt, Bibelstellen und Formulierungen vor der Übernahme prüfen. Alle Folien bleiben bearbeitbar.')}</p>
    <div className="local-slide-drafts">{item.slides.map((slide,index)=><article key={index}>
     <div className="local-slide-preview"><SlideRenderer slide={slide} mode="thumbnail"/></div>
     <label>{tx('Titel')}<input value={drafts[index].title} maxLength={180} onChange={event=>update(index,'title',event.target.value)}/></label>
     <label>{tx('Text')}<textarea value={drafts[index].body} maxLength={1400} rows={4} onChange={event=>update(index,'body',event.target.value)}/></label>
    </article>)}</div>
    <footer><button disabled={busy||!topic.trim()||drafts.some(draft=>!draft.title.trim()||!draft.body.trim())} onClick={accept}>{tx('In den Ablauf übernehmen')}</button></footer>
   </>}
  </div>
 </div>;
}
