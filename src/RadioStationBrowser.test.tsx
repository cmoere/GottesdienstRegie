import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {RadioStationBrowser} from './RadioStationBrowser';
import {usePreferences} from './preferences';
const preferences=usePreferences.getState();
beforeEach(()=>usePreferences.setState({language:'de',germanRegion:null}));
afterEach(()=>{cleanup();usePreferences.setState(preferences,true)});

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
