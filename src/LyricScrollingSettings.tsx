import {useI18n} from "./i18n";
import {usePresentation} from './store';
import {defaultLyricScrolling,lyricSettings} from './lyricScrolling';
export function LyricScrollingSettings(){
 const {tx}=useI18n();
 const state=usePresentation(),settings=lyricSettings({...state.items[0],type:'song',metadata:{}},state.lyricScrolling);
 const update=(patch:Partial<typeof defaultLyricScrolling>)=>state.updatePresentation({lyricScrolling:{...settings,...patch}});
 return <section className="lyric-settings"><h4>{tx("SONGS · LYRIC SCROLLING")}</h4>
 <label><input type="checkbox" checked={settings.enabled} onChange={event=>update({enabled:event.target.checked})}/>{tx("Lyric Scrolling für Song-Items verwenden")}</label>
 <p>{tx("Zeigt bei Songs bereits kommende Liedzeilen an und scrollt beim Weitergehen weich zum nächsten Lyrics-Bereich.")}</p>
 <label>{tx("Animationsdauer (Sekunden)")}<input type="number" min="0.2" max="2" step="0.1" value={settings.durationMs/1000} onChange={event=>update({durationMs:Math.max(200,Math.min(2000,Number(event.target.value)*1000))})}/></label>
 <label>{tx("Kommende Bereiche")}<select value={settings.upcomingBlocks} onChange={event=>update({upcomingBlocks:Number(event.target.value)})}><option value="1">{tx("1 Bereich")}</option><option value="2">{tx("2 Bereiche")}</option></select></label>
 <label>{tx("Deckkraft kommender Lyrics (%)")}<input type="number" min="25" max="75" value={Math.round(settings.upcomingOpacity*100)} onChange={event=>update({upcomingOpacity:Math.max(.25,Math.min(.75,Number(event.target.value)/100))})}/></label>
 </section>;
}
