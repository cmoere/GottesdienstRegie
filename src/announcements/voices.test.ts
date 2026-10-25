import {expect,it} from 'vitest';import {bundledVoices} from './voices';
import {isBundledAnnouncementVoice,validateAnnouncementSettings} from './settings';
it('preserves the existing choices and whitelists three genuine additional model identities',()=>{
 expect(bundledVoices.map(v=>v.modelKey)).toEqual(['male','female','karlsson','ramona','eva_k']);
 for(const voice of bundledVoices){expect(isBundledAnnouncementVoice(voice.id)).toBe(true);expect(validateAnnouncementSettings({enabled:true,voiceId:voice.id,speakerId:0,voiceAccepted:true,intervalMinutes:5,musicRemainingPercent:20}).voiceId).toBe(voice.id)}
 expect(isBundledAnnouncementVoice('../../model')).toBe(false);
});
