import {act,cleanup,render} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {LiveAnnotationsController,annotationTakeId,useLiveAnnotations} from './LiveAnnotations';
import {usePresentation} from './store';
afterEach(()=>{cleanup();usePresentation.setState({onAir:false,liveItemId:'',liveSlideId:''})});
it('clears marks at take changes and refuses a delayed command from the old take',()=>{
 const send=vi.fn();let receive:(payload:unknown)=>void=()=>{};Object.defineProperty(window,'desktop',{configurable:true,value:{sendAnnotations:send,remote:{onCommand:(callback:any)=>{receive=callback;return()=>{}}}}});
 usePresentation.setState({onAir:true,liveSlideId:'one',liveTakenAtMs:1});render(<LiveAnnotationsController/>);
 const payload={action:'annotate',takeId:annotationTakeId(usePresentation.getState()),stroke:{id:'stroke',color:'#ff3b30',width:.004,points:[{x:0,y:0},{x:1,y:1}]}};
 act(()=>receive(payload));expect(useLiveAnnotations.getState().state?.strokes).toHaveLength(1);
 act(()=>usePresentation.setState({liveSlideId:'two',liveTakenAtMs:2}));expect(useLiveAnnotations.getState().state).toBeNull();act(()=>receive(payload));expect(useLiveAnnotations.getState().state).toBeNull();expect(send).toHaveBeenLastCalledWith(null);
});
