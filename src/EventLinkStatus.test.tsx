import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {EventLinkStatus,eventLinkViewModel} from './EventLinkStatus';
import {usePreferences} from './preferences';
import type {ChurchEvent} from './events';
const initial=usePreferences.getState();
afterEach(()=>{cleanup();usePreferences.setState(initial,true)});

it('localizes link controls and unavailable/cancelled warnings without translating the supplied event title',()=>{
  usePreferences.setState({language:'en',germanRegion:null});
  const onClick=vi.fn();
  const view=render(<EventLinkStatus event={null} onClick={onClick}/>);
  expect(screen.getByText('Link an event')).toBeVisible();
  expect(screen.getByText('No event selected yet')).toBeVisible();
  fireEvent.click(screen.getByRole('button'));expect(onClick).toHaveBeenCalledOnce();
  const link={eventKey:'-event',titleSnapshot:'Ökumenisches Gemeindefest'};
  view.rerender(<EventLinkStatus link={link} event={null} onClick={onClick}/>);
  expect(screen.getByText('Ökumenisches Gemeindefest')).toBeVisible();
  expect(screen.getByText('The linked event is currently unavailable.')).toBeVisible();
  expect(screen.getByText('CHANGE')).toBeVisible();
  const event:ChurchEvent={eventKey:'-event',titel:'Ökumenisches Gemeindefest',cancelled:true,start_datum:'2026-10-25',start_uhrzeit:'10:30',ende_datum:'2026-10-25',ende_uhrzeit:'12:00'};
  view.rerender(<EventLinkStatus link={link} event={event} onClick={onClick}/>);
  expect(screen.getByText('This event is cancelled.')).toBeVisible();
  expect(event.titel).toBe('Ökumenisches Gemeindefest');
  expect(event.cancelled).toBe(true);
});

it('updates operator copy on language change while keeping German date/24-hour time and source linking unchanged',()=>{
  usePreferences.setState({language:'de',germanRegion:null});
  const link={eventKey:'-event',dateSnapshot:'2026-10-25',timeSnapshot:'10:30'};
  const event:ChurchEvent={eventKey:'-event',titel:'Gemeindegottesdienst',start_datum:'2026-10-25',start_uhrzeit:'10:30',ende_datum:'2026-10-25',ende_uhrzeit:'12:00'};
  const before=JSON.stringify({link,event});
  const view=render(<EventLinkStatus link={link} event={event} onClick={()=>{}}/>);
  expect(screen.getByText(/25\.10\.2026/)).toHaveTextContent('So., 25.10.2026 · 10:30 Uhr');
  act(()=>usePreferences.setState({language:'en'}));
  expect(screen.getByText(/25\.10\.2026/)).toHaveTextContent('So., 25.10.2026 · 10:30');
  expect(screen.getByText('CHANGE')).toBeVisible();
  view.rerender(<EventLinkStatus link={{eventKey:'-missing'}} event={null} onClick={()=>{}}/>);
  expect(screen.getByText('Linked event')).toBeVisible();
  expect(JSON.stringify({link,event})).toBe(before);
});

it('retains the German pure view-model defaults for existing non-React callers',()=>{
  expect(eventLinkViewModel(undefined,[])).toMatchObject({state:'unlinked',title:'Veranstaltung verknüpfen',detail:'Noch keine Veranstaltung ausgewählt'});
  expect(eventLinkViewModel({eventKey:'-missing'},[])).toMatchObject({state:'missing',title:'Verknüpfte Veranstaltung',detail:'Gespeicherte Verknüpfung'});
});
