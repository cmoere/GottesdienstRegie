import type {DeviceSettingsRepository} from '../DeviceSettingsRepository';
import {validateAnnouncementSettings} from '../../src/announcements/settings';

/** Only a separately installed, explicitly chosen non-neural engine may be enabled. */
export function createAnnouncementSettingsAccess<Event>(
  repository: Pick<DeviceSettingsRepository, 'readAnnouncements' | 'writeAnnouncements'>,
  isControl: (event: Event) => boolean,
  engineReady:()=>Promise<boolean>=async()=>false,
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
      if (settings.enabled&&(settings.voiceId!=='espeak-ng:de'||!await engineReady())) throw new Error('Die Sprachausgabe ist noch nicht freigegeben. Bitte eSpeak NG auswählen.');
      return repository.writeAnnouncements(settings);
    },
  };
}
