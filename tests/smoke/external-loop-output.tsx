import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ExternalLoopView} from '../../src/externalLoop/View';
import {normalizeExternalSettings} from '../../src/externalLoop/model';
import {TestModeWatermark} from '../../src/TestModeWatermark';
import type {ExternalSnapshot} from '../../shared/externalLoop';
import '../../src/styles.css';
function Fixture(){
 const [mode,setMode]=useState('news');
 useEffect(()=>{(window as any).externalFixture={mode:setMode}},[]);
 const snapshot:ExternalSnapshot={version:1,key:mode==='news'?'news:westfalen-blatt,wdr-owl':'football:bl1:'+mode,revision:'fixture',fetchedAt:Date.now(),stale:false,payload:mode==='news'?{kind:'news',entries:Array.from({length:10},(_,i)=>({id:String(i),title:i===0?'Eine sehr lange vollständige Nachricht aus Bielefeld über das Gemeindeleben und den nächsten Gottesdienst mit zahlreichen weiteren Informationen für alle Besucher':'Nachricht aus Bielefeld '+(i+1),source:i%2?'wdr-owl':'westfalen-blatt',publishedAt:'2026-10-23T12:00:00Z',url:'https://www1.wdr.de/a'}))}:{kind:'football',league:'bl1',season:2026,mode:mode as 'table'|'matchday'|'upcoming',teams:[],table:Array.from({length:24},(_,i)=>({rank:i+1,team:{id:i+1,name:'Verein '+(i+1)},played:8,goalsFor:12,goalsAgainst:10,goalDifference:2,points:15})),matches:Array.from({length:10},(_,i)=>({id:i,home:{id:i*2+1,name:'Heimverein '+(i+1)},away:{id:i*2+2,name:'Gastverein '+(i+1)},startsAt:'2026-10-23T12:00:00Z',status:i%2?'finished':'scheduled',score:i%2?{home:0,away:0}:null}))}};
 return <div style={{position:'relative',width:'100vw',height:'100vh',containerType:'inline-size'}}><ExternalLoopView snapshot={snapshot} settings={normalizeExternalSettings({externalKind:mode==='news'?'news':'football',footballMode:mode,footballTeamId:3})} startedAt={Date.now()}/><TestModeWatermark role="main" visible/></div>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
