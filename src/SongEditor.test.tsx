import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {SongEditor} from './ProductionWorkspace';
import {usePreferences} from './preferences';
import {readSong,songPatch} from './songStructure';
import {createServiceItem,usePresentation} from './store';

afterEach(cleanup);

it('moves and repeats sections, then edits the shared lyric from the running order',()=>{
  usePreferences.setState({language:'de',germanRegion:null});
  const state=usePresentation.getState();
  state.newDocument('Songtest','2026-11-05');
  const item=createServiceItem('song',{title:'Gemeinsam singen',sectionId:'service'});
  const verse={id:'verse',label:'Strophe 1',slides:[{...item.slides[0],id:'verse-page',body:'Erste Zeile'}]};
  const chorus={id:'chorus',label:'Refrain',slides:[{...item.slides[0],id:'chorus-page',body:'Gemeinsam singen'}]};
  const edited={...item,...songPatch(item,{sections:[verse,chorus],order:['verse','chorus']})};
  usePresentation.setState({items:[edited],selectedItemId:item.id,selectedSlideId:edited.slides[0].id});
  function Editor(){
    const song=usePresentation(current=>current.items.find(entry=>entry.id===item.id)!);
    return <SongEditor item={song} canEdit/>;
  }
  render(<Editor/>);
  fireEvent.click(screen.getByRole('button',{name:/ABLAUF BEARBEITEN/}));
  fireEvent.click(screen.getAllByRole('button',{name:'Nach rechts verschieben'})[0]);
  fireEvent.click(screen.getAllByRole('button',{name:/^Wiederholen$/})[0]);
  fireEvent.click(screen.getByRole('button',{name:'2. Refrain'}));
  const field=screen.getAllByRole<HTMLTextAreaElement>('textbox',{name:'Text'})
    .find(textarea=>textarea.value==='Gemeinsam singen')!;
  expect(field).toHaveFocus();
  fireEvent.change(field,{target:{value:'Wir singen gemeinsam'}});
  const song=usePresentation.getState().items.find(entry=>entry.id===item.id)!;
  expect(readSong(song).order).toEqual(['chorus','chorus','verse']);
  expect(song.slides.map(slide=>slide.body)).toEqual(['Wir singen gemeinsam','Wir singen gemeinsam','Erste Zeile']);
});
