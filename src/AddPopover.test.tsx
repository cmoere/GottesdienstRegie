import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {AddPopover} from './App';
import {usePreferences} from './preferences';
import {usePresentation} from './store';

afterEach(cleanup);

it('combines search with category filters and keeps matching labels whole',()=>{
  usePreferences.setState({language:'de',germanRegion:null,aiEnabled:true});
  usePresentation.getState().newDocument('Ablauf','2026-11-05');
  const close=vi.fn();
  render(<AddPopover close={close} targetSectionId="pre"/>);
  const search=screen.getByRole('searchbox',{name:'Elemente suchen'});
  expect(search).toHaveFocus();
  fireEvent.change(search,{target:{value:'folien KI'}});
  expect(screen.getByRole('button',{name:'Folien mit KI erstellen'})).toBeVisible();
  fireEvent.click(screen.getByRole('button',{name:/Loop-Elemente/i}));
  expect(screen.queryByRole('button',{name:'Folien mit KI erstellen'})).toBeNull();
  expect(screen.getByText('Keine passenden Elemente gefunden.')).toBeVisible();
  fireEvent.change(search,{target:{value:'fussball'}});
  expect(screen.getByRole('button',{name:'Fußball'})).toBeVisible();
  fireEvent.keyDown(search,{key:'Escape'});
  expect(close).toHaveBeenCalledOnce();
});
