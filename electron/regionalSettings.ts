import type {DeviceSettingsRepository} from './DeviceSettingsRepository';
import {validateRegionalSelection} from '../shared/regional/selection';

/** Native localization metadata only; callers cannot supply executable or rendered text. */
export function createRegionalSettingsAccess<Event>(
  repository:Pick<DeviceSettingsRepository,'readRegionalSelection'|'writeRegionalSelection'>,
  isControl:(event:Event)=>boolean,
){
  function authorize(event:Event){
    if(!isControl(event))throw new Error('Sprachauswahl ist nur im Steuerfenster verfügbar.');
  }
  return {
    async read(event:Event){authorize(event);return repository.readRegionalSelection()},
    async write(event:Event,value:unknown){authorize(event);return repository.writeRegionalSelection(validateRegionalSelection(value))},
  };
}
