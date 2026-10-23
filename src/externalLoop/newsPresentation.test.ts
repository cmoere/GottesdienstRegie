import {it,expect} from 'vitest';
import {prepareNewsPresentation,newsFrameAt} from './newsPresentation';
const entries=[{id:'a',title:'Erste Nachricht',source:'wdr-owl' as const,publishedAt:null,url:'https://www1.wdr.de/a',description:'Kurze Beschreibung.'},{id:'b',title:'Zweite Nachricht',source:'westfalen-blatt' as const,publishedAt:null,url:'https://www.westfalen-blatt.de/b'}];
it('shows exactly one story for at least twenty seconds and switches at the same boundary on late mirrors',()=>{
 const plan=prepareNewsPresentation(entries,1);expect(plan.minDurationMs).toBe(40000);
 expect(newsFrameAt(plan,19999)?.entry.id).toBe('a');expect(newsFrameAt(plan,20000)?.entry.id).toBe('b');expect(newsFrameAt(plan,999999)?.entry.id).toBe('b');expect(newsFrameAt(plan,-100)?.entry.id).toBe('a');
 expect(prepareNewsPresentation(entries,35).minDurationMs).toBe(70000);expect(newsFrameAt(prepareNewsPresentation([],20),0)).toBeNull();expect(entries[0].title).toBe('Erste Nachricht');
});
it('preserves all long title and description characters across static continuation pages and extends reading time',()=>{
 const title='Langer Titel '.repeat(100),description='Ausführliche Beschreibung. '.repeat(150),plan=prepareNewsPresentation([{...entries[0],title,description}],20),story=plan.stories[0];
 expect(story.pages.flat().filter(line=>line.kind==='title').map(line=>line.text).join('')).toBe(title);
 expect(story.pages.flat().filter(line=>line.kind==='body').map(line=>line.text).join('')).toBe(description);
 expect(story.durationMs).toBeGreaterThanOrEqual(story.pages.length*10000);expect(story.durationMs).toBeGreaterThan(20000);
});
