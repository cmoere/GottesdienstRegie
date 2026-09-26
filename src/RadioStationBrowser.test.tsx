import {fireEvent,render,screen} from '@testing-library/react';
import {describe,expect,it} from 'vitest';
import {RadioStationBrowser} from './RadioStationBrowser';

describe('RadioStationBrowser query',()=>{
  it('offers an accessible clear control only while the query has text',()=>{
    render(<RadioStationBrowser add={()=>{}}/>);
    const input=screen.getByPlaceholderText('Sender, Ort oder Musikrichtung');
    expect(screen.queryByRole('button',{name:'Suchtext löschen'})).toBeNull();
    fireEvent.change(input,{target:{value:'Jazz'}});
    fireEvent.click(screen.getByRole('button',{name:'Suchtext löschen'}));
    expect(input).toHaveValue('');
    expect(screen.queryByRole('button',{name:'Suchtext löschen'})).toBeNull();
  });
});
