import {cleanup,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {usePreferences,type VideoInputSource} from './preferences';
import {VideoInputSettings} from './VideoInputSettings';

const copy=vi.hoisted(()=>({regional:false}));
vi.mock('./i18n',()=>({useI18n:()=>({tx:(source:string)=>copy.regional?'Regional: '+source:source})}));
const initial=usePreferences.getState();
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();copy.regional=false;usePreferences.setState(initial,true)});

it('updates camera status captions without reconnecting the active media stream',async()=>{
 const source:VideoInputSource={id:'camera-1',deviceId:'physical-camera',name:'Meine Kamera',enabled:true,width:1920,height:1080,frameRate:30,audioEnabled:false,audioDeviceId:'',volume:100,monitoring:'off',fit:'contain',crop:{left:0,right:0,top:0,bottom:0},brightness:100,contrast:100,saturation:100,hue:0};
 usePreferences.setState({videoInputSources:[source]});
 const stop=vi.fn(),track={stop,getSettings:()=>({width:1920,height:1080,frameRate:30})};
 const stream={getTracks:()=>[track],getVideoTracks:()=>[track]};
 const getUserMedia=vi.fn().mockResolvedValue(stream);
 vi.stubGlobal('navigator',{...navigator,mediaDevices:{enumerateDevices:vi.fn().mockResolvedValue([]),getUserMedia,addEventListener:vi.fn(),removeEventListener:vi.fn()}});
 vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();
 const view=render(<VideoInputSettings/>);
 await screen.findByText(/^Signal erkannt ·/);
 const video=view.container.querySelector('video');
 expect(video?.srcObject).toBe(stream);
 copy.regional=true;view.rerender(<VideoInputSettings/>);
 await waitFor(()=>expect(screen.getByText(/^Regional: Signal erkannt ·/)).toBeVisible());
 expect(getUserMedia).toHaveBeenCalledTimes(1);
 expect(video?.srcObject).toBe(stream);
 expect(stop).not.toHaveBeenCalled();
 expect(usePreferences.getState().videoInputSources).toEqual([source]);
});
