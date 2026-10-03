import {render,cleanup} from '@testing-library/react';
import {afterEach,it,expect} from 'vitest';
import {PostProgramRoomNoticeView} from './PostProgramRoomNotice';
afterEach(cleanup);
it('renders the exact leave sentence below a blank colored header',()=>{
 const {container,getByText}=render(<PostProgramRoomNoticeView snapshot={{sessionId:1,headerColor:'#608F9A',page:0,pageCount:1,notice:{type:'leave-room',text:'Wir bitten alle Besucher, den Raum zu verlassen.'}}}/>);
 expect(getByText('Wir bitten alle Besucher, den Raum zu verlassen.')).toBeInTheDocument();expect(container.querySelector('header')?.textContent).toBe('');
 expect(container.querySelector('header')).toHaveStyle({background:'#608F9A'});
});
