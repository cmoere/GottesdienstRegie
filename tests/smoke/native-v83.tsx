import {createRoot} from 'react-dom/client';
import '../../src/cera-pro.css';
import '../../src/styles.css';
import '../../src/settings-v08.css';
import {AnnouncementSettings} from '../../src/announcements/AnnouncementSettings';
import {startCommunityRuntime} from '../../src/community/communityRuntime';
startCommunityRuntime();
createRoot(document.getElementById('root')!).render(<main className="settings-content" style={{padding:32,maxWidth:1050,margin:'auto'}}><h1>Einstellungen · Präsentation</h1><AnnouncementSettings/></main>);
