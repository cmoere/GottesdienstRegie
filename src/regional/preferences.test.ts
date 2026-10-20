import { afterEach, describe, expect, it } from 'vitest';
import { regionalVariants } from '../../shared/regional/catalog';
import { migratePreferencesForV84, usePreferences } from '../preferences';
import { translate } from '../i18n';

const initial = usePreferences.getState();
afterEach(() => {
  usePreferences.setState(initial, true);
  localStorage.removeItem('gottesdienstregie.preferences');
});

describe('regional interface preference', () => {
  it('defaults old v63 snapshots to Hochdeutsch without dropping other saved fields', () => {
    const previous = {language:'de', theme:'dark', operatorScale:1, audioOutputDevice:'usb-12',
      audioRouting:{background:{deviceId:'usb-12',volume:0.6}}, customLegacySetting:'keep'};
    expect(migratePreferencesForV84(previous)).toMatchObject({...previous, germanRegion:null});
    expect(previous).not.toHaveProperty('germanRegion');
  });

  it('accepts the released15 and falls back safely for deferred or malformed saved selections', () => {
    const released=["bavarian-upper","bavarian-lower","upper-palatinate","east-franconian","swabian","baden-alemannic","south-baden-alemannic","palatine","rhine-hessian","south-hessian","cologne","ruhr","hamburg","berlin","bielefeld-ravensberg"];
    for (const region of regionalVariants) {
      const expected=released.includes(region.id)?region.id:null;
      expect(migratePreferencesForV84({germanRegion:region.id})).toMatchObject({germanRegion:expected});
      usePreferences.getState().setGermanRegion(region.id);
      expect(usePreferences.getState().germanRegion).toBe(expected);
    }
    for (const germanRegion of ['__proto__','constructor','de-DE',42,{},['cologne']]) {
      expect(migratePreferencesForV84({germanRegion})).toMatchObject({germanRegion:null});
    }
  });

  it('stores and rehydrates selection without changing audio or the base language', async () => {
    usePreferences.getState().setLanguage('de');
    const audio = usePreferences.getState().audioRouting;
    usePreferences.getState().setGermanRegion('bielefeld-ravensberg');
    const stored = localStorage.getItem('gottesdienstregie.preferences');
    expect(JSON.parse(stored!).state.germanRegion).toBe('bielefeld-ravensberg');
    usePreferences.setState({germanRegion:null});
    localStorage.setItem('gottesdienstregie.preferences',stored!);
    await usePreferences.persist.rehydrate();
    expect(usePreferences.getState().germanRegion).toBe('bielefeld-ravensberg');
    expect(usePreferences.getState().language).toBe('de');
    expect(usePreferences.getState().audioRouting).toEqual(audio);
  });

  it('validates even current-schema persisted values rather than trusting migration alone', async () => {
    const version = usePreferences.persist.getOptions().version;
    localStorage.setItem('gottesdienstregie.preferences', JSON.stringify({
      version, state:{germanRegion:'not-a-region', language:'de', audioOutputDevice:'saved-usb'},
    }));
    await usePreferences.persist.rehydrate();
    expect(usePreferences.getState().germanRegion).toBeNull();
    expect(usePreferences.getState().audioOutputDevice).toBe('saved-usb');
    expect(typeof usePreferences.getState().setGermanRegion).toBe('function');
  });

  it('does not change English text when a German regional preference is retained', () => {
    const before = translate('en','checkUpdates');
    usePreferences.getState().setGermanRegion('cologne');
    usePreferences.getState().setLanguage('en');
    expect(translate('en','checkUpdates')).toBe(before);
    expect(usePreferences.getState().germanRegion).toBe('cologne');
  });
});
