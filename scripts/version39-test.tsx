import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {SlideRenderer} from '../src/SlideRenderer';
import {SongEditor} from '../src/ProductionWorkspace';
import {usePresentation,createServiceItem,presentationDocument} from '../src/store';
import {usePreferences} from '../src/preferences';
import {readSong,songPatch} from '../src/songStructure';
import {liveEngine} from '../src/LiveEngine';
import {checkLyricLayouts} from '../src/lyricPreflight';
import {translationModes} from '../src/songTranslation';
import {LyricScrollRenderer} from '../src/LyricScrollRenderer';
import {lyricPacket} from '../src/lyricScrolling';
import '../src/styles.css';
import '../src/v010.css';
import '../src/song-editor.css';
import '../src/version39.css';
const assert=(value:unknown,message:string)=>{if(!value)throw Error(message)};
const item=createServiceItem('song',{title:'Welcome',body:'Good morning\nWelcome to our service'});
item.slides[0].elements[0]={...item.slides[0].elements[0],x:100,y:100,width:1720,height:840,properties:{...item.slides[0].elements[0].properties,fontSize:68,align:'left',verticalAlign:'top',text:item.slides[0].body}};
usePresentation.getState().newDocument('Version 39 – Test');
usePresentation.setState({items:[item],selectedItemId:item.id,selectedSlideId:item.slides[0].id});
function Test(){
 const state=usePresentation(),prefs=usePreferences(),song=state.items[0],slide=song.slides[0];
 const [status,setStatus]=useState('Test startet …'),[scroll,setScroll]=useState(false);
 useEffect(()=>{void(async()=>{
  try{
   const source=usePresentation.getState().items[0],structure=readSong(source);
   structure.sections[0].slides[0].translation={language:'Deutsch',text:'Guten Morgen\nWillkommen zum Gottesdienst'};
   structure.order.push(structure.order[0]);
   usePresentation.getState().updateItem(source.id,songPatch(source,structure));
   usePresentation.getState().undo();assert(!usePresentation.getState().items[0].slides[0].translation,'Undo');
   usePresentation.getState().redo();assert(usePresentation.getState().items[0].slides.length===2,'Redo and repeated section');
   const doc=JSON.parse(JSON.stringify(presentationDocument(usePresentation.getState())));
   usePresentation.getState().loadDocument(doc);assert(usePresentation.getState().items[0].slides[1].translation?.text.includes('Guten Morgen'),'Saved translation');
   let snapshot:any;const originalDesktop=window.desktop;
   (window as any).desktop={sendLiveSlide:async(value:any)=>{snapshot=value;return true}};
   usePreferences.getState().setSongTranslationMode('columns');
   await liveEngine.show(usePresentation.getState().items[0].slides[0]);
   usePreferences.getState().setSongTranslationMode('off');
   assert(snapshot.songTranslationMode==='columns','Live mode snapshot');
   assert(snapshot.body==='Good morning\nWelcome to our service','Original lyrics preserved');
   (window as any).desktop=originalDesktop;
   const overflow=structuredClone(usePresentation.getState().items[0]);overflow.slides[0].translation!.text='Viel zu viele Zeilen\n'.repeat(40);
   usePreferences.getState().setSongTranslationMode('parentheses');
   assert((await checkLyricLayouts([overflow])).some(warning=>warning.includes('überschreiten')),'Translation overflow preflight');
   setStatus('PASS: Undo/Redo · Speicherung · Refrain-Wiederholung · Live-Snapshot · Überlaufwarnung');
  }catch(error){setStatus('FAIL: '+String(error))}
 })()},[]);
 return <><h1>Version 39 · Songübersetzungen</h1><p role="status">{status}</p><label>Anzeigeart <select value={prefs.songTranslationMode} onChange={e=>prefs.setSongTranslationMode(e.target.value as any)}>{translationModes.map(mode=><option key={mode.value} value={mode.value}>{mode.label}</option>)}</select></label><label><input type="checkbox" checked={scroll} onChange={e=>setScroll(e.target.checked)}/> Lyric Scrolling</label><div style={{display:'grid',gridTemplateColumns:'minmax(300px,38%) 1fr',gap:16,height:650}}><SongEditor item={song} canEdit={true}/><div style={{position:'relative',width:'100%',aspectRatio:'16/9',alignSelf:'start'}}>{scroll?<LyricScrollRenderer packet={lyricPacket(song,slide,{enabled:true})!}/>:<SlideRenderer slide={slide}/>}</div></div><img src="../help/song-translations.svg" alt="Schematische Anleitung" style={{width:700}}/></>;
}
createRoot(document.getElementById('root')!).render(<Test/>);
