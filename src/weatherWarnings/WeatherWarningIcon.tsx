import type {PublicWeatherWarning} from '../../shared/weatherWarnings';

/** Local illustrative symbols; not official DWD warning-level branding. */
export function WeatherWarningIcon({warning}:{warning:PublicWeatherWarning}){
 const text=`${warning.event} ${warning.headline}`.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('de-DE').replace(/ß/g,'ss');
 let name='Wetterwarnung',drawing=<><path d="M12 3 2 21h20Z"/><path d="M12 9v5m0 3v.1"/></>;
 if(/gewitter|thunder|blitz/.test(text)){
  name='Gewitter';drawing=<><path d="M6 15a4 4 0 0 1 0-8 6 6 0 0 1 11-1 4 4 0 0 1 1 8"/><path d="m13 11-5 7h5l-2 5 7-9h-5l2-3"/></>;
 }else if(/glatt|glaze|frost|eisregen|eisbildung|vereis|freez|\b(?:ice|eis)\b/.test(text)){
  name='Glätte und Frost';drawing=<><path d="M12 2v16M5 6l14 8M5 14l14-8M9 3l3 3 3-3M9 17l3-3 3 3M3 21h18"/></>;
 }else if(/schnee|snow|blizzard/.test(text)){
  name='Schnee';drawing=<><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 3l3 3 3-3M9 21l3-3 3 3M3 10l4-1-1-4m12 14-1-4 4-1M3 14l4 1-1 4M18 5l-1 4 4 1"/></>;
 }else if(/sturm|wind|boen|orkan|gust/.test(text)){
  name='Sturm und Wind';drawing=<><path d="M2 8h12a3 3 0 1 0-3-3M2 12h17a3 3 0 1 0-3-3M2 16h10a3 3 0 1 1-3 3"/></>;
 }else if(/regen|rain|hochwasser|flut|flood/.test(text)){
  name='Regen';drawing=<><path d="M6 15a4 4 0 0 1 0-8 6 6 0 0 1 11-1 4 4 0 0 1 1 9Z"/><path d="m7 18-1 3m6-3-1 3m6-3-1 3"/></>;
 }else if(/hitze|heat|heiss/.test(text)){
  name='Hitze';drawing=<><circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/></>;
 }else if(/nebel|\b(?:fog|mist)\b/.test(text)){
  name='Nebel';drawing=<><path d="M6 10a4 4 0 0 1 0-7 6 6 0 0 1 11 0 4 4 0 0 1 1 7M2 14h20M4 18h16M6 22h12"/></>;
 }
 return <svg className="weather-warning-icon" viewBox="0 0 24 24" role="img" aria-label={name} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{drawing}</svg>;
}
