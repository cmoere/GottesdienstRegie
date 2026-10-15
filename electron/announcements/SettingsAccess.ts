import type {DeviceSettingsRepository} from '../DeviceSettingsRepository';
import {validateAnnouncementSettings} from '../../src/announcements/settings';

/** Settings preparation only. No engine, downloads or audio can be activated here. */
export function createAnnouncementSettingsAccess<Event>(
  repository: Pick<DeviceSettingsRepository, 'readAnnouncements' | 'writeAnnouncements'>,
  isControl: (event: Event) => boolean,
) {
  const authorize = (event: Event) => {
    if (!isControl(event)) throw new Error('Ansageneinstellungen sind nur im Steuerfenster verfügbar.');
  };
  return {
    async read(event: Event) {
      authorize(event);
      return repository.readAnnouncements();
    },
    async write(event: Event, value: unknown) {
      authorize(event);
      const settings = validateAnnouncementSettings(value);
      if (settings.enabled) throw new Error('Die Sprachausgabe ist noch nicht freigegeben.');
      return repository.writeAnnouncements(settings);
    },
  };
}
