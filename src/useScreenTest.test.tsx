import {useState} from 'react';
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {useScreenTest} from './useScreenTest';
import type {QuickScreenConfig} from './preferences';
const previous:QuickScreenConfig={id:'previous',type:'custom',name:'Vorher',text:'Eigene Ausgabe',order:0,enabled:true,targets:['main']};
let listener:(value:unknown)=>void=()=>{};const send=vi.fn().mockResolvedValue(true),off=vi.fn();
function Fixture({onAir=true}:{onAir?:boolean}){
 const [quick,setQuick]=useState<QuickScreenConfig|null>(previous);
 const test=useScreenTest({current:quick,onAir,setQuick,bridge:{sendQuick:send,restore:async(_runId,value)=>{await send(['main'],value);return true},onResult:cb=>{listener=cb;return off}}});
 return <><button onClick={test.request}>Test öffnen</button><button onClick={()=>{test.interrupt();setQuick({...previous,id:'black',type:'black'})}}>Schwarz</button><output data-testid="current">{quick?.id}:{quick?.testPattern}:{quick?.testRunId}</output>{test.dialog}</>;
}
afterEach(()=>{cleanup();send.mockClear();off.mockClear();delete window.desktop});
it('requires confirmation and existing ON AIR, and cancels back to the exact previous quick screen',async()=>{
 render(<Fixture/>);fireEvent.click(screen.getByText('Test öffnen'));
 expect(send).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Bildschirmtest starten'}));
 await waitFor(()=>expect(send).toHaveBeenCalledTimes(1));expect(screen.getByTestId('current').textContent).toContain('screen-test:bars:');
 fireEvent.click(screen.getByRole('button',{name:'Test abbrechen'}));
 await waitFor(()=>expect(send).toHaveBeenLastCalledWith(['main'],previous));
 expect(screen.getByText('Bildschirmtest abgebrochen.')).toBeVisible();
 cleanup();render(<Fixture onAir={false}/>);fireEvent.click(screen.getByText('Test öffnen'));
 expect(screen.getByRole('button',{name:'Bildschirmtest starten'})).toBeDisabled();
});
it('does not restore over an emergency quick screen and reports technical vs visual limits',async()=>{
 render(<Fixture/>);fireEvent.click(screen.getByText('Test öffnen'));fireEvent.click(screen.getByRole('button',{name:'Bildschirmtest starten'}));
 await waitFor(()=>expect(send).toHaveBeenCalledTimes(1));
 const quick=send.mock.calls[0][1];
 act(()=>listener({runId:quick.testRunId,pattern:'bars',ok:true,width:1920,height:1080,frames:300,elapsedMs:5100}));
 await waitFor(()=>expect(send).toHaveBeenCalledTimes(2));fireEvent.click(screen.getByRole('button',{name:'Schwarz'}));
 await waitFor(()=>expect(screen.getByText('Bildschirmtest abgebrochen.')).toBeVisible());
 expect(send).toHaveBeenCalledTimes(2);expect(screen.getByTestId('current').textContent).toContain('black:');
 expect(screen.getByText(/Keine automatische Prüfung von Kabel/)).toBeVisible();
});
it('exports a completed report in both supported formats through the desktop save bridge',async()=>{
 const exportReport=vi.fn().mockResolvedValue(true);window.desktop={screenTest:{exportReport}} as any;
 render(<Fixture/>);fireEvent.click(screen.getByText('Test öffnen'));fireEvent.click(screen.getByRole('button',{name:'Bildschirmtest starten'}));
 for(let index=0;index<8;index++){
  await waitFor(()=>expect(send.mock.calls.length).toBeGreaterThan(index));const quick=send.mock.calls[index][1];
  act(()=>listener({runId:quick.testRunId,pattern:quick.testPattern,ok:true,width:1920,height:1080,frames:300,elapsedMs:5100}));
 }
 await screen.findByText('Bildschirmtest – Auswertung');
 fireEvent.click(screen.getByRole('button',{name:'Bericht herunterladen'}));
 await waitFor(()=>expect(exportReport).toHaveBeenCalledWith(expect.objectContaining({status:'complete',steps:expect.any(Array)}),'html'));
 expect(exportReport.mock.calls[0][0].steps).toHaveLength(8);
 fireEvent.click(screen.getByRole('button',{name:'JSON herunterladen'}));
 await waitFor(()=>expect(exportReport).toHaveBeenLastCalledWith(expect.objectContaining({status:'complete'}),'json'));
 expect(await screen.findByText('Bericht gespeichert.')).toBeVisible();
});
