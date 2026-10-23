import React,{useCallback,useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {QuickOverlay} from '../../src/QuickOverlay';
import {OutputComposition} from '../../src/OutputComposition';
import {TestModeWatermark} from '../../src/TestModeWatermark';
import {applyQuickScreen} from '../../src/quickScreenUi';
import type {QuickScreenConfig} from '../../src/preferences';
import type {ScreenTestReceipt,ScreenTestPatternId} from '../../src/screenTest';
import '../../src/styles.css';
import '../../src/settings-v08.css';
const reports:ScreenTestReceipt[]=[];let dialogOpened=0;
function Fixture(){
 const [quick,setQuick]=useState<QuickScreenConfig|null>(null);
 const onResult=useCallback((value:ScreenTestReceipt)=>reports.push(value),[]);
 useEffect(()=>{(window as any).screenTestFixture={
  pattern:(pattern:ScreenTestPatternId,runId:string)=>setQuick({id:'screen-test',type:'screenTest',name:'Bildschirmtest',enabled:true,targets:['main'],order:0,testRunId:runId,testPattern:pattern}),
  reports:()=>reports,
  technical:()=>setQuick({id:'technical-issue',type:'custom',name:'Technische Störung',text:'Technische Störung\nWir bitten um etwas Geduld.\nDie Übertragung wird schnellstmöglich fortgesetzt.',background:'#000000',order:0,enabled:true,targets:['main']}),
  bible:async(pageIndex:number)=>{const value:QuickScreenConfig={id:'bible-passage',type:'bible',name:'Johannes 3,16–17',reference:'Johannes 3,16–17',text:'Denn also hat Gott die Welt geliebt.\nDenn Gott hat seinen Sohn gesandt.',pages:[['Denn also hat Gott die Welt geliebt.'],['Denn Gott hat seinen Sohn gesandt.']],pageIndex,order:0,enabled:true,targets:['main']};await applyQuickScreen(value,{onAir:true,openBible:()=>{dialogOpened++},setQuick,sendQuick:async()=>true});return dialogOpened},
 };},[]);
 return <div className="output" style={{position:'relative',width:'100vw',height:'100vh'}}><OutputComposition banner={null} hideCountdown testOverlay={<TestModeWatermark role="main" visible/>}><QuickOverlay quick={quick} onScreenTestResult={onResult}/></OutputComposition></div>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
