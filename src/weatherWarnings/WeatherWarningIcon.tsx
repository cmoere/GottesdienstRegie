import type {PublicWeatherWarning} from '../../shared/weatherWarnings';
import {UiIcon} from '../icons/UiIcon';

/** Uses the same bundled Lucide icon set as the application controls. */
export function WeatherWarningIcon({warning}:{warning:PublicWeatherWarning}){
 const text=`${warning.event} ${warning.headline}`.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('de-DE').replace(/ß/g,'ss');
 let name='Wetterwarnung',icon='warning';
 if(/gewitter|thunder|blitz/.test(text)){name='Gewitter';icon='weather_thunderstorm'}
 else if(/glatt|glaze|frost|eisregen|eisbildung|vereis|freez|\b(?:ice|eis)\b/.test(text)){name='Glätte und Frost';icon='weather_snow'}
 else if(/schnee|snow|blizzard/.test(text)){name='Schnee';icon='weather_snow'}
 else if(/sturm|wind|boen|orkan|gust/.test(text)){name='Sturm und Wind';icon='weather_wind'}
 else if(/regen|rain|hochwasser|flut|flood/.test(text)){name='Regen';icon='weather_rain'}
 else if(/hitze|heat|heiss/.test(text)){name='Hitze';icon='weather_heat'}
 else if(/nebel|\b(?:fog|mist)\b/.test(text)){name='Nebel';icon='weather_fog'}
 return <UiIcon className="weather-warning-icon" name={icon} aria-label={name}/>;
}
