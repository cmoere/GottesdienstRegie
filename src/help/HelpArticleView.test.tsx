import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {HelpArticleView} from './HelpArticleView';
import {readFileSync} from 'node:fs';
import {loadRegionalDocumentation} from '../regional/documentationRuntime';
import {loadRegionalInterfacePack} from '../regional/resources';
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
it('uses the requested region for help chrome and related titles while preserving topic IDs',async()=>{
  vi.stubGlobal('fetch',async(url:string)=>{expect(url).toBe('./releases.json');return {json:async()=>JSON.parse(readFileSync('public/releases.json','utf8'))}});
  expect(await loadRegionalDocumentation('ruhr')).toBe(true);
  expect(await loadRegionalInterfacePack('ruhr')).toBe(true);
  const opened:string[]=[];
  render(<HelpArticleView article={{id:'Probe',title:'Probe',body:'## Prüfen\n\nText',related:['Erste Schritte']}} locale="de" germanRegion="ruhr" onOpenTopic={id=>opened.push(id)}/>);
  expect(screen.getByRole('navigation',{name:'Auf der Seite hier'})).toBeVisible();
  expect(screen.getByRole('navigation',{name:'Passende Themen dazu'})).toBeVisible();
  fireEvent.click(screen.getByRole('button',{name:'Die ersten Schritte'}));
  expect(opened).toEqual(['Erste Schritte']);
  expect(screen.getByRole('link',{name:'Prüfen'})).toHaveAttribute('href','#help-Probe-0');
});
it('offers local section navigation and readable steps without interpreting markup',()=>{
  render(<HelpArticleView article={{id:'Probe',title:'Gottesdienst vorbereiten',body:'## Vorbereiten\n\nDie Veranstaltung verknüpfen.\n\n## Prüfen\n\n1. MAIN identifizieren.\n2. Preflight durchführen.\n\n<script>bad()</script>'}} locale="de"/>);
  const link=screen.getByRole('link',{name:'Prüfen'});expect(link.getAttribute('href')).toBe('#help-Probe-1');
  expect(screen.getAllByRole('listitem')).toHaveLength(2);expect(screen.getByText('<script>bad()</script>')).toBeInTheDocument();
});
it('uses Arabic direction and localized related topics',()=>{
  const opened:string[]=[];
  const view=render(<HelpArticleView article={{id:'Probe',title:'التحضير',body:'نص الدليل',related:['Preflight'] } as any} locale="ar" onOpenTopic={id=>opened.push(id)}/>);
  expect(view.container.querySelector('.help-article-view')).toHaveAttribute('dir','rtl');
  fireEvent.click(screen.getByRole('button'));expect(opened).toEqual(['Preflight']);
});
