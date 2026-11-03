import {create} from 'zustand';import {persist} from 'zustand/middleware';
import {usePresentation} from './store';import {useI18n} from './i18n';
export const usePreviewOptions=create(persist<{showTitles:boolean;showNext:boolean}>(()=>({showTitles:true,showNext:true}),{name:'gottesdienstregie.preview.options'}));
export function PreviewViewSettings(){
 const {tx}=useI18n(),options=usePreviewOptions(),size=usePresentation(s=>s.gridSize);
 return <section className="settings-group preview-view-settings"><h3>{tx('Ansichtseinstellungen')}</h3><label>{tx('Thumbnailgröße')}<input aria-label={tx('Thumbnailgröße')} type="range" min="160" max="440" step="40" value={size} onChange={e=>usePresentation.getState().setGridSize(Number(e.target.value))}/><output>{size} px</output></label><label><input type="checkbox" checked={options.showTitles} onChange={e=>usePreviewOptions.setState({showTitles:e.target.checked})}/>{tx('Folientitel anzeigen')}</label><label><input type="checkbox" checked={options.showNext} onChange={e=>usePreviewOptions.setState({showNext:e.target.checked})}/>{tx('Nächste Folie anzeigen')}</label></section>;
}
