import type {DeviceSettingsRepository} from '../DeviceSettingsRepository';
import {validateAnnouncementSettings,isBundledAnnouncementVoice} from '../../src/announcements/settings';

/** Only the bundled classical voice may be enabled, explicitly by the operator. */
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
      const value=await repository.readAnnouncements();
      return isBundledAnnouncementVoice(value.voiceId)?value:{...value,enabled:false};
    },
    async write(event: Event, value: unknown) {
      authorize(event);
      const settings = validateAnnouncementSettings(value);
      if (settings.enabled&&(!isBundledAnnouncementVoice(settings.voiceId)||!await engineReady())) throw new Error('Die mitgelieferte Sprachausgabe ist nicht verfügbar. Bitte das vollständige Update installieren.');
      return repository.writeAnnouncements(settings);
    },
  };
}
