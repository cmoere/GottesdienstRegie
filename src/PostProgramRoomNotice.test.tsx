import {render,cleanup} from '@testing-library/react';
import {afterEach,it,expect} from 'vitest';
import {PostProgramRoomNoticeView} from './PostProgramRoomNotice';
afterEach(cleanup);
it('shows column labels and keeps long titles intact without images',()=>{
 const title='Sehr lange Veranstaltung '.repeat(20);
 const {container,getByText}=render(<PostProgramRoomNoticeView snapshot={{sessionId:1,headerColor:'#608F9A',page:0,pageCount:1,notice:{type:'next-events',events:[{id:'a',title,room:'Gemeindesaal',start:'2026-10-10T10:00:00Z'}]}}}/>);
 for(const label of ['Datum','Uhrzeit','Veranstaltung','Raum'])expect(getByText(label)).toBeInTheDocument();
 expect(container.querySelector('.post-program-row .post-program-title')?.textContent).toBe(title);
 expect(container.querySelectorAll('img')).toHaveLength(0);
});
it('renders the exact leave sentence below a blank colored header',()=>{
 const {container,getByText}=render(<PostProgramRoomNoticeView snapshot={{sessionId:1,headerColor:'#608F9A',page:0,pageCount:1,notice:{type:'leave-room',text:'Wir bitten alle Besucher, den Raum zu verlassen.'}}}/>);
 expect(getByText('Wir bitten alle Besucher, den Raum zu verlassen.')).toBeInTheDocument();expect(container.querySelector('header')?.textContent).toBe('');
 expect(container.querySelector('header')).toHaveStyle({background:'#608F9A'});
});
