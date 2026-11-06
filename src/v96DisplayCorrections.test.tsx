import {afterEach,expect,it} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import {AnnouncementSettings} from './announcements/AnnouncementSettings';
import {usePreferences} from './preferences';
import {ANNOUNCEMENT_DESIGNS,prepareAnnouncementPages} from './announcementDesign';
import {AnnouncementService} from './community/AnnouncementService';
const preferences=usePreferences.getState();
afterEach(()=>{cleanup();usePreferences.setState(preferences,true)});
it('labels actual bundled voice options M/W while preserving persisted model IDs',async()=>{
 usePreferences.setState({language:'de',germanRegion:null});
 render(<AnnouncementSettings rows={[]} bridge={{readSettings:async()=>({enabled:false,intervalMinutes:5,musicRemainingPercent:20,voiceId:'marytts:dfki-pavoque-neutral',speakerId:0,voiceAccepted:true}),writeSettings:async value=>value,engineStatus:async()=>({ready:true,name:'Bereit'})}}/>);
 await waitFor(()=>expect(screen.getByLabelText('Ansagenstimme')).toBeEnabled());
 for(const [name,gender,id]of [['Thorsten','M','marytts:dfki-pavoque-neutral'],['Kerstin','W','marytts:bits1-hsmm'],['Karlsson','M','piper:de_DE-karlsson-low'],['Ramona','W','piper:de_DE-ramona-low'],['Eva K.','W','piper:de_DE-eva_k-x_low']])expect(screen.getByRole('option',{name:name+' ('+gender+') · Deutsch'})).toHaveValue(id);
});
it('anchors every announcement QR at bottom-right at all supported sizes without text overlap',()=>{
 for(const design of ANNOUNCEMENT_DESIGNS)for(const qrSize of [120,160,280,480]){
  const page=prepareAnnouncementPages({title:'Titel',body:'Eine wichtige Information. '.repeat(100),qrCode:true,qrSize,design}),q=page[0].qrElement!,b=page[0].bodyElement;
  expect(q.y+q.height,design).toBe(1080-(design==="frame"?58:design==="footer"?48:24));expect(q.x+q.width,design).toBeGreaterThanOrEqual(1888);
  expect(b.x+b.width<=q.x||b.y+b.height<=q.y,design+' '+qrSize).toBe(true);
 }
});
it('joins fallback banner title and description with one colon without rewriting explicit channel text',()=>{
 const service=new AnnouncementService(),now=new Date('2026-11-02T12:00:00Z');
 const raw={messageId:'-banner',status:'public',showMeldungBanner:true,titel:'Dies ist der Titel',beschreibung:'<p>Dies ist die Beschreibung</p>'},before=structuredClone(raw);
 expect(service.getBanners([raw],now)[0].text).toBe('Dies ist der Titel: Dies ist die Beschreibung');expect(raw).toEqual(before);
 expect(service.getBanners([{...raw,textBanner:'Eigener Lauftext'}],now)[0].text).toBe('Eigener Lauftext');
 expect(service.getBanners([{...raw,textBanner:'',textLaufbanner:'Eigene Kurzfassung'}],now)[0].text).toBe('Eigene Kurzfassung');
 expect(service.getBanners([{...raw,titel:'Titel:',beschreibung:'Text'}],now)[0].text).toBe('Titel: Text');
 expect(service.getBanners([{...raw,beschreibung:''}],now)[0].text).toBe(raw.titel);
});
