import {createRoot} from 'react-dom/client';
import {ShapeGallery} from '../../src/ShapeGallery';
import {RadioStationBrowser} from '../../src/RadioStationBrowser';
import {usePreferences,type Language} from '../../src/preferences';
import {usePresentation} from '../../src/store';
import {loadRegionalInterfacePack} from '../../src/regional/resources';
import {normalizeGermanRegion} from '../../shared/regional/catalog';
import '../../src/cera-pro.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import 'material-symbols/outlined.css';
import '../../src/styles.css';
import '../../src/version41.css';
import '../../src/version42.css';
import '../../src/version57.css';
import '../../src/version58.css';

const root=createRoot(document.getElementById('root')!);
let selection:unknown;
// In-memory sentinels in this isolated fixture; no display bridge is mounted.
usePresentation.setState({mainDisplayId:917,displayRoles:{'917':'main'}});
usePreferences.setState({audioOutputDevice:'regional-shape-fixture-usb'});
const originalItems=usePresentation.getState().items;
const originalAudio=usePreferences.getState().audioRouting;
const originalDisplay=usePresentation.getState().displayRoles;
async function setup(language:Language,region:unknown,view:'shape'|'radio'='shape'){
 const id=normalizeGermanRegion(region);
 if(id&&!await loadRegionalInterfacePack(id))throw Error('REGIONAL_SHAPE_PACK_NOT_LOADED');
 selection=null;usePreferences.setState({language,germanRegion:id});
 document.documentElement.dataset.theme='light';
 document.body.style.background='var(--app)';
 await Promise.all([document.fonts.load('400 14px Inter'),document.fonts.load('24px "Material Symbols Outlined"')]);
 root.render(<main key={`${language}:${id}:${view}`} data-probe-selection={`${language}:${id}:${view}`} style={{padding:32,width:view==='radio'?680:520}}>{view==='radio'?<RadioStationBrowser add={track=>{selection=track}}/>:<ShapeGallery onSelect={(kind,name)=>{selection={kind,name}}}/>}</main>);
}
Object.assign(window,{regionalShapeProbe:{setup,selected:()=>selection,preserved:()=>({
 document:usePresentation.getState().items===originalItems,
 audio:usePreferences.getState().audioRouting===originalAudio&&usePreferences.getState().audioOutputDevice==='regional-shape-fixture-usb',
 display:usePresentation.getState().displayRoles===originalDisplay&&usePresentation.getState().mainDisplayId===917,
})}});
