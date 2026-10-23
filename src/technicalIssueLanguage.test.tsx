import {afterEach,expect,it,vi} from 'vitest';
import {act,cleanup,render,screen} from '@testing-library/react';
import {QuickOverlay} from './QuickOverlay';
import type {QuickScreenConfig} from './preferences';
import {technicalIssueLanguage,technicalEnglishText} from './technicalIssueLanguage';
afterEach(()=>{cleanup();vi.useRealTimers()});
const base={id:'technical-issue',type:'custom',name:'Technische Störung',text:'Eigene Überschrift\nEigene Mitteilung',technicalIssueEnglishText:'Custom heading\nCustom message',activatedAtMs:1000,background:'#699f3e',enabled:true,targets:['main'],order:0} as QuickScreenConfig;
it('uses exact shared eight-second boundaries and rejects invalid imported optional fields',()=>{
 expect(technicalIssueLanguage(1000,8999)).toBe('de');expect(technicalIssueLanguage(1000,9000)).toBe('en');expect(technicalIssueLanguage(1000,17000)).toBe('de');
 expect(technicalIssueLanguage(NaN,9000)).toBe('de');expect(technicalIssueLanguage(undefined,9000)).toBe('de');
 expect(technicalEnglishText({text:'bad'})).toMatch(/^Technical difficulties/);expect(technicalEnglishText('x'.repeat(5001))).toMatch(/^Technical difficulties/);
});
it('switches at eight seconds, reopens in the current shared phase and keeps static tiles German',()=>{
 vi.useFakeTimers();vi.setSystemTime(8999);
 const {unmount}=render(<QuickOverlay quick={base}/>);
 expect(screen.getByRole('heading',{name:'Eigene Überschrift'})).toBeVisible();
 act(()=>{vi.setSystemTime(9000);vi.advanceTimersByTime(250)});
 expect(screen.getByRole('heading',{name:'Custom heading'})).toBeVisible();unmount();
 render(<QuickOverlay quick={base}/>);expect(screen.getByText('Custom message')).toBeVisible();cleanup();
 vi.setSystemTime(17000);render(<QuickOverlay quick={base}/>);expect(screen.getByText('Eigene Mitteilung')).toBeVisible();cleanup();
 vi.setSystemTime(10000);const {container}=render(<QuickOverlay quick={base} staticPreview/>);expect(screen.getByText('Eigene Mitteilung')).toBeVisible();expect(container.querySelector('.technical-issue-mark svg')).not.toBeNull();
});
it('defaults English copy without overwriting custom German text or background',()=>{
 vi.useFakeTimers();vi.setSystemTime(10000);
 const {container}=render(<QuickOverlay quick={{...base,technicalIssueEnglishText:undefined} as QuickScreenConfig}/>);
 expect(screen.getByRole('heading',{name:'Technical difficulties'})).toBeVisible();expect(container.querySelector('.quick-overlay')).toHaveStyle({'--quick-bg':'#699f3e'});
});
it('reserves the full output height so different text lengths cannot recenter the heading',()=>{
 const {container}=render(<QuickOverlay quick={base} staticPreview/>);
 expect(container.querySelector('.technical-issue-message')).toHaveStyle({height:'100%'});
});
