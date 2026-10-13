import {createServiceItem,usePresentation} from '../../src/store';
import {usePreferences} from '../../src/preferences';
import {setRewardSettings,defaultRewardSettings} from '../../src/rewards';
usePreferences.getState().setTheme('light');
setRewardSettings({...defaultRewardSettings,notifications:false});
localStorage.setItem('gottesdienstregie.interface-tour','done');
function seed(announcements=false){
 usePresentation.getState().newDocument('Sonntagsgottesdienst · Demo');
 const item=createServiceItem(announcements?'announcement':'content',{id:'demo-content',title:announcements?'Meldungen':'Willkommen',sectionId:announcements?'pre':'service',body:announcements?'EDITOR PLACEHOLDER':'Schön, dass du da bist.',itemCategory:announcements?'loop':'standard',placementPolicy:announcements?'loopOnly':'any',autoAdvance:announcements});
 usePresentation.setState({items:[item,...usePresentation.getState().items],selectedItemId:item.id,selectedSlideId:item.slides[0].id,previewItemId:item.id,previewSlideId:item.slides[0].id,displayRoles:{'123':'main'},mainDisplayId:123,previewLayout:'single'});
}
seed();
(window as any).seedV77=seed;
(window as any).v77State=()=>usePresentation.getState();
window.confirm=()=>true;
window.alert=message=>{throw Error(message)};
await import('../../src/main');
