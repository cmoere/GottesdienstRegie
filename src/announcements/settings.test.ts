import {describe,expect,it} from 'vitest';
import {normalizeAnnouncementSettings,validateAnnouncementSettings} from './settings';

describe('operator-selected announcement voice settings',()=>{
  it('accepts the explicitly selected bundled female German voice',()=>{
    const value={enabled:true,intervalMinutes:5,musicRemainingPercent:20,voiceId:'marytts:bits1-hsmm',speakerId:0,voiceAccepted:true};
    expect(validateAnnouncementSettings(value)).toEqual(value);
    expect(normalizeAnnouncementSettings(value)).toEqual(value);
    expect(()=>validateAnnouncementSettings({...value,speakerId:1})).toThrow();
  });
  it('accepts the bundled classical voice only with explicit activation metadata',()=>{
    const value={enabled:true,intervalMinutes:5,musicRemainingPercent:20,voiceId:'marytts:dfki-pavoque-neutral',speakerId:0,voiceAccepted:true};
    expect(validateAnnouncementSettings(value)).toEqual(value);
    expect(()=>validateAnnouncementSettings({...value,speakerId:1})).toThrow();
    expect(normalizeAnnouncementSettings({...value,voiceAccepted:false}).enabled).toBe(false);
  });
  it('accepts only explicitly selected non-neural German eSpeak metadata',()=>{
    const value={enabled:true,intervalMinutes:5,musicRemainingPercent:20,voiceId:'espeak-ng:de',speakerId:0,voiceAccepted:true};
    expect(validateAnnouncementSettings(value)).toEqual(value);
    expect(()=>validateAnnouncementSettings({...value,speakerId:1})).toThrow();
    expect(normalizeAnnouncementSettings({...value,voiceAccepted:false}).enabled).toBe(false);
  });
  const selection={enabled:false,intervalMinutes:5,musicRemainingPercent:20,voiceId:'de_DE-mls-medium',speakerId:2,voiceAccepted:true};
  it('never silently selects or enables a voice on first use',()=>{
    expect(normalizeAnnouncementSettings(undefined)).toEqual({enabled:false,intervalMinutes:5,musicRemainingPercent:20,voiceId:'de_DE-mls-medium',speakerId:null,voiceAccepted:false});
    expect(normalizeAnnouncementSettings({enabled:true})).toMatchObject({enabled:false,speakerId:null,voiceAccepted:false});
  });
  it('persists the operator choice instead of fixing a voice at build time',()=>{
    expect(validateAnnouncementSettings({...selection,enabled:true,speakerId:235})).toEqual({...selection,enabled:true,speakerId:235});
    expect(validateAnnouncementSettings({...selection,speakerId:0})).toMatchObject({speakerId:0});
  });
  it.each([-1,236,1.5,'2',NaN,Infinity])('rejects unavailable speaker id %s',speakerId=>{
    expect(()=>validateAnnouncementSettings({...selection,speakerId})).toThrow();
    expect(normalizeAnnouncementSettings({...selection,enabled:true,speakerId})).toMatchObject({enabled:false,speakerId:null,voiceAccepted:false});
  });
  it.each([{speakerId:null},{voiceAccepted:false},{voiceId:'unknown-model'},{voiceId:'../../arbitrary-path'}])('cannot enable automatic playback without explicit valid choice: %j',patch=>{
    expect(()=>validateAnnouncementSettings({...selection,...patch,enabled:true})).toThrow();
    expect(normalizeAnnouncementSettings({...selection,...patch,enabled:true}).enabled).toBe(false);
  });
  it('accepts interval and percent endpoints without treating 0 percent as missing',()=>{
    expect(validateAnnouncementSettings({...selection,intervalMinutes:1,musicRemainingPercent:0})).toMatchObject({intervalMinutes:1,musicRemainingPercent:0});
    expect(validateAnnouncementSettings({...selection,intervalMinutes:120,musicRemainingPercent:100})).toMatchObject({intervalMinutes:120,musicRemainingPercent:100});
  });
  it.each([{intervalMinutes:0},{intervalMinutes:121},{intervalMinutes:NaN},{intervalMinutes:'5'},{musicRemainingPercent:-1},{musicRemainingPercent:101},{musicRemainingPercent:Infinity},{enabled:'true'},{voiceAccepted:'yes'},{foreign:'value'}])('rejects invalid writes without coercion: %j',patch=>{
    expect(()=>validateAnnouncementSettings({...selection,...patch})).toThrow();
  });
  it('ignores unrelated properties when reading without exposing them in operator settings',()=>{
    expect(normalizeAnnouncementSettings({...selection,internalComment:'secret'})).toEqual(selection);
  });
});
