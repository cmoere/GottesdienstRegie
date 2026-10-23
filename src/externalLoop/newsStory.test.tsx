import {it,expect,afterEach,vi} from 'vitest';
import {render,screen,cleanup,act,fireEvent} from '@testing-library/react';
import {ExternalLoopView} from './View';
import {normalizeExternalSettings} from './model';
import type {ExternalSnapshot} from '../../shared/externalLoop';
afterEach(()=>{cleanup();vi.useRealTimers()});
const snapshot:ExternalSnapshot={version:1,key:'news:westfalen-blatt',revision:'r',fetchedAt:1000,stale:false,payload:{kind:'news',entries:[{id:'a',title:'Erste Nachricht',description:'Beschreibung mit <script>keinem HTML</script>.',source:'westfalen-blatt',publishedAt:null,url:'https://www.westfalen-blatt.de/a',imageDataUrl:'data:image/jpeg;base64,/9j/AA=='},{id:'b',title:'Zweite Nachricht',description:'WDR-Beschreibung',source:'westfalen-blatt',publishedAt:null,url:'https://www.westfalen-blatt.de/b'}]}};
it('renders one large complete story, then switches only after its twenty-second interval',()=>{
 vi.useFakeTimers();vi.setSystemTime(1000);
 const {container}=render(<ExternalLoopView snapshot={snapshot} settings={normalizeExternalSettings({durationSeconds:1})} startedAt={1000}/>);
 expect(screen.getAllByRole('article')).toHaveLength(1);expect(screen.getByRole('article',{name:'Erste Nachricht'})).toHaveTextContent('Erste Nachricht');expect(screen.queryByRole('article',{name:'Zweite Nachricht'})).toBeNull();
 expect(screen.getByAltText('Westfalen-Blatt')).toBeInTheDocument();expect(screen.getByAltText('Nachrichtenbild')).toBeInTheDocument();expect(container.querySelector('script')).toBeNull();
 fireEvent.error(screen.getByAltText('Nachrichtenbild'));expect(container.querySelector('[data-has-image="false"]')).not.toBeNull();
 act(()=>vi.advanceTimersByTime(20001));expect(screen.getByRole('article',{name:'Zweite Nachricht'})).toBeInTheDocument();expect(screen.queryByRole('article',{name:'Erste Nachricht'})).toBeNull();expect(screen.getByAltText('Westfalen-Blatt')).toBeInTheDocument();
});
it('switches a late-opened mirror on the same story boundary rather than one second after MAIN',()=>{
 vi.useFakeTimers();vi.setSystemTime(1000);
 render(<ExternalLoopView snapshot={snapshot} settings={normalizeExternalSettings({durationSeconds:1})} startedAt={1000}/>);
 act(()=>vi.advanceTimersByTime(700));render(<ExternalLoopView snapshot={snapshot} settings={normalizeExternalSettings({durationSeconds:1})} startedAt={1000}/>);
 act(()=>vi.advanceTimersByTime(19301));expect(screen.queryByRole('article',{name:'Erste Nachricht'})).toBeNull();expect(screen.getAllByRole('article',{name:'Zweite Nachricht'})).toHaveLength(2);
});
