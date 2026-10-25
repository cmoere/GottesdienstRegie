import {expect,it} from 'vitest';
import {defaultReadingSettings,normalizeReadingSettings,validateReadingSettings} from './readingSettings';
import {normalizeAnnouncementSettings,validateAnnouncementSettings} from './settings';
it('migrates missing reading preferences without altering activation and persists explicit choices',()=>{
 expect(normalizeReadingSettings(undefined)).toEqual(defaultReadingSettings);
 const old={enabled:false,intervalMinutes:5,musicRemainingPercent:20,voiceId:'marytts:bits1-hsmm',speakerId:0,voiceAccepted:true};
 expect(normalizeAnnouncementSettings(old)).toEqual(old);
 expect(validateAnnouncementSettings({...old,reading:{...defaultReadingSettings,speed:.85,sentencePauseMs:450}}).reading).toMatchObject({speed:.85,sentencePauseMs:450});
});
it('rejects unbounded worker settings and foreign controls while safely reading corrupt preferences',()=>{
 for(const patch of [{speed:0},{speed:1.31},{loudnessPercent:201},{sentencePauseMs:-1},{paragraphPauseMs:2001},{emphasis:'angry'},{emphasis:['calm']},{modelPath:'../x'},{speed:'1'}]){
 expect(()=>validateReadingSettings({...defaultReadingSettings,...patch})).toThrow();
 expect(normalizeReadingSettings({...defaultReadingSettings,...patch})).toEqual(defaultReadingSettings);
 }
});
