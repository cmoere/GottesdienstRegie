import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {HelpArticleView} from './HelpArticleView';
afterEach(cleanup);
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
