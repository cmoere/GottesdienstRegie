import {createRoot} from 'react-dom/client';
import {AnnouncementSettings} from '../../src/announcements/AnnouncementSettings';
import '../../src/cera-pro.css';import '../../src/styles.css';
const bridge={readSettings:async()=>({enabled:false,intervalMinutes:5,musicRemainingPercent:20,voiceId:'marytts:dfki-pavoque-neutral',speakerId:0,voiceAccepted:true}),writeSettings:async(value:unknown)=>{(window as any).savedV92=value;return value},engineStatus:async()=>({ready:true,name:'Fünf mitgelieferte Stimmen verfügbar'})};
createRoot(document.getElementById('root')!).render(<main style={{padding:24,maxWidth:900}}><AnnouncementSettings bridge={bridge as any} rows={[]}/></main>);
