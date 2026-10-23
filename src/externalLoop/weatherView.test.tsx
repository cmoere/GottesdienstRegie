import {it,expect,afterEach} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {WeatherView} from './WeatherView';
import {normalizeExternalSettings,requestForExternalItem,externalLoopMinimumDuration} from './model';
import {ExternalLoopController} from './controller';
import {createServiceItem} from '../store';
import type {ExternalSnapshot} from '../../shared/externalLoop';
afterEach(cleanup);
const snapshot:ExternalSnapshot={version:1,key:'weather:52.0302,8.5325:Bielefeld',revision:'r',fetchedAt:1000,stale:false,payload:{kind:'weather',location:{name:'Bielefeld',latitude:52.0302,longitude:8.5325},observedAt:'2026-10-23T12:00:00Z',temperature:12,wind:8,code:3,days:[{date:'2026-10-23T00:00:00Z',minimum:6,maximum:14,code:3,rainProbability:10},{date:'2026-10-24T00:00:00Z',minimum:5,maximum:12,code:61,rainProbability:70},{date:'2026-10-25T00:00:00Z',minimum:4,maximum:13,code:0,rainProbability:0}]}};
it('renders a native Bielefeld forecast with three days and attribution, without an iframe',()=>{
 if(snapshot.payload.kind!=='weather')throw Error();const {container}=render(<WeatherView snapshot={snapshot} payload={snapshot.payload}/>);
 expect(screen.getByText('Bielefeld')).toBeInTheDocument();expect(screen.getByText('12 °C')).toBeInTheDocument();expect(screen.getAllByRole('article')).toHaveLength(3);expect(screen.getByText(/Open-Meteo/)).toBeInTheDocument();expect(container.querySelector('iframe')).toBeNull();expect(screen.getAllByText('Fr., 23.10.2026').length).toBeGreaterThan(0);
});
it('uses the existing frozen take and prepared data for weather rather than an independent output request',async()=>{
 const item=createServiceItem('weather',{sectionId:'pre'}),request=requestForExternalItem(item);expect(request).toEqual({kind:'weather',name:'Bielefeld',latitude:52.0302,longitude:8.5325});
 item.slides[0].elements=[{id:'weather',type:'loop',name:'Wetter',x:0,y:0,width:1920,height:1080,rotation:0,opacity:1,visible:true,locked:true,zIndex:1,properties:{loopType:'weather'}}];
 const controller=new ExternalLoopController(async()=>({snapshot,status:'ready'}),()=>1000);await controller.prepare(request!);const output=controller.outputForTake(item,item.slides[0],1,1000)!;
 expect(output.elements[0].properties.externalSnapshotJson).toContain('Bielefeld');expect(externalLoopMinimumDuration(snapshot,normalizeExternalSettings({externalKind:'weather'}))).toBeGreaterThanOrEqual(20000);
});
