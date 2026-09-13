import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {LyricScrollRenderer} from '../src/LyricScrollRenderer';
import {lyricPacket} from '../src/lyricScrolling';
import '../src/styles.css';
import '../src/preview-workspace.css';
import {usePresentation,presentationDocument} from '../src/store';
import '../src/cera-pro.css';
const slides=['Aktuelle Liedzeilen\nGemeinsam singen','Der nächste Refrain\nSchon vorher sichtbar','Bridge\nNeue Zeilen','Abschluss'].map((body,index)=>({id:String(index),itemId:'test',order:index,enabled:true,title:'Vers',body,background:'#254853',elements:[{id:'text'+index,type:'text',name:'Lyrics',visible:true,locked:false,x:80,y:80,width:1760,height:920,rotation:0,opacity:1,zIndex:1,properties:{text:body,fontFamily:'Cera Pro',fontSize:72,fontWeight:600,color:'#fff',align:'left',lineHeight:1.15}}],transition:'cut',transitionDuration:0,notes:''}));
const item={id:'test',type:'song',metadata:{},slides} as any;
function Test(){const [index,setIndex]=useState(0),[long,setLong]=useState(false);(window as any).advanceTest=setIndex;(window as any).longTest=()=>setLong(true);const pages=long?slides.map(page=>({...page,body:Array.from({length:18},(_,n)=>`Lange Liedzeile ${n+1}`).join('\n')})):slides;return <div style={{position:'fixed',inset:0}}><LyricScrollRenderer packet={lyricPacket({...item,slides:pages},pages[index] as any,{enabled:true})!}/></div>}
(window as any).persistenceTest=()=>{const state=usePresentation.getState();state.newDocument('Lyric Test');state.updatePresentation({lyricScrolling:{enabled:true,durationMs:500,upcomingBlocks:2,upcomingOpacity:.42}});state.undo();if(usePresentation.getState().lyricScrolling!==undefined)throw Error('Undo failed');state.redo();const doc=JSON.parse(JSON.stringify(presentationDocument(usePresentation.getState())));state.newDocument('Other');state.loadDocument(doc);if(!usePresentation.getState().lyricScrolling?.enabled)throw Error('Persistence failed');return true};
createRoot(document.getElementById('root')!).render(<Test/>);
