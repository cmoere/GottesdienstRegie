import {describe,expect,it} from 'vitest';
import {CLOCK_DESIGNS,normalizeClockSettings,clockSettingsPatch,clockDateText,clockTimeText} from './model';
describe('shared clock settings',()=>{
 it('offers six styles and preserves legacy seconds settings',()=>{
  expect(CLOCK_DESIGNS).toHaveLength(6);
  expect(normalizeClockSettings({format:'HH:mm'}).showSeconds).toBe(false);
  expect(normalizeClockSettings({format:'HH:mm:ss'}).showSeconds).toBe(true);
  for(const design of CLOCK_DESIGNS)expect(normalizeClockSettings(clockSettingsPatch({...normalizeClockSettings({}),design})).design).toBe(design);
 });
 it('normalizes invalid fields independently and roundtrips every scalar choice',()=>{
  const value=normalizeClockSettings({clockDesign:'bad',clockHourCycle:'12',clockShowSeconds:false,clockDateFormat:'iso',clockAlign:'right',clockBackground:'#699f3e',clockColor:'broken'});
  expect(value).toMatchObject({design:'digital-classic',hourCycle:'12',showSeconds:false,dateFormat:'iso',align:'right',background:'#699f3e',color:'#000000'});
  expect(normalizeClockSettings(clockSettingsPatch(value))).toEqual(value);
 });
 it('formats German weekday punctuation, all date formats, 12-hour labels and midnight',()=>{
  const now=new Date(2026,9,23,13,5,7),base=normalizeClockSettings({});
  expect(clockDateText(base,now)).toBe('Fr., 23.10.2026');
  expect(clockDateText({...base,dateFormat:'day-month'},now)).toBe('Fr., 23.10.');
  expect(clockDateText({...base,dateFormat:'long'},now)).toBe('Fr., 23. Oktober 2026');
  expect(clockDateText({...base,dateFormat:'iso',showWeekday:false},now)).toBe('2026-10-23');
  expect(clockTimeText({...base,hourCycle:'12',showSeconds:false},now)).toBe('01:05 PM');
  expect(clockTimeText({...base,hourCycle:'12'},new Date(2026,9,23,0,5,7))).toBe('12:05:07 AM');
 });
});
