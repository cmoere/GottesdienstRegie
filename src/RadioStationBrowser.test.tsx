import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {RadioStationBrowser} from './RadioStationBrowser';
import {usePreferences} from './preferences';
import {searchRadioStations,suggestRadioStations,type RadioStation} from './radioStations';
vi.mock('./radioStations',()=>({searchRadioStations:vi.fn(),suggestRadioStations:vi.fn()}));
const preferences=usePreferences.getState();
beforeEach(()=>{usePreferences.setState({language:'de',germanRegion:null});vi.resetAllMocks();vi.mocked(suggestRadioStations).mockResolvedValue([])});
afterEach(()=>{cleanup();usePreferences.setState(preferences,true)});

describe('RadioStationBrowser query',()=>{
  it('shows suggestions on open, lets search replace them and restores them when cleared',async()=>{
    const station:RadioStation={id:'popular',name:'Beispielsender',streamUrl:'https://example.test/live',country:'Deutschland',language:'Deutsch',tags:[],codec:'MP3',bitrate:128,artworkUrl:'https://example.test/logo.png',homepage:''};
    vi.mocked(suggestRadioStations).mockResolvedValue([station]);
    vi.mocked(searchRadioStations).mockResolvedValue([{...station,id:'jazz',name:'Jazzsender'}]);
    render(<RadioStationBrowser add={()=>{}}/>);
    expect(await screen.findByText('Beispielsender')).toBeVisible();
    const row=screen.getByRole('article');
    const logo=within(row).getByAltText('');
    expect(logo).toHaveAttribute('src',station.artworkUrl);
    fireEvent.error(logo);
    expect(row.querySelector('[data-icon="radio"] svg')).toBeVisible();
    fireEvent.change(screen.getByPlaceholderText('Sender, Ort oder Musikrichtung'),{target:{value:'Jazz'}});
    fireEvent.click(screen.getByRole('button',{name:'Suchen'}));
    expect(await screen.findByText('Jazzsender')).toBeVisible();
    expect(within(screen.getByRole('article')).getByAltText('')).toHaveAttribute('src',station.artworkUrl);
    expect(screen.queryByText('Beispielsender')).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'Suchtext löschen'}));
    expect(screen.getByText('Beispielsender')).toBeVisible();
    expect(vi.mocked(suggestRadioStations)).toHaveBeenCalledTimes(1);
  });
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
