import {act,cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterEach,beforeEach,expect,it} from 'vitest';
import {ShapeGallery} from './ShapeGallery';
import {ShapeArtwork} from './ShapeArtwork';
import {shapeCatalog} from './shapeCatalog';
import {usePreferences} from './preferences';
import {usePresentation} from './store';

const preferences=usePreferences.getState();
beforeEach(()=>usePreferences.setState({language:'en',germanRegion:null}));
afterEach(()=>{cleanup();usePreferences.setState(preferences,true)});

it('localizes the real gallery, search and accessible artwork without changing saved shape names',()=>{
 const selected:Array<[string,string]>=[];
 render(<ShapeGallery onSelect={(kind,name)=>selected.push([kind,name])}/>);
 fireEvent.click(screen.getByRole('button',{name:'2D OBJECT'}));
 const dialog=screen.getByRole('dialog',{name:'2D objects'});
 const search=within(dialog).getByPlaceholderText('Search 2D objects …');
 fireEvent.change(search,{target:{value:'left arrow'}});
 const choices=within(dialog).getAllByRole('button');
 expect(choices).toHaveLength(1);
 expect(choices[0]).toHaveTextContent('Left arrow');
 expect(choices[0]).toHaveAttribute('title','Arrows');
 expect(within(choices[0]).getByRole('img',{name:'Left arrow'})).toBeInTheDocument();
 fireEvent.click(choices[0]);
 expect(selected).toEqual([['arrow-left','Pfeil links']]);
 expect(screen.queryByRole('dialog')).toBeNull();
});

it('keeps canonical German search aliases while updating an open gallery on language change',()=>{
 const catalog=structuredClone(shapeCatalog),document=usePresentation.getState().items,audio=usePreferences.getState().audioRouting;
 render(<ShapeGallery onSelect={()=>{}}/>);
 fireEvent.click(screen.getByRole('button',{name:'2D OBJECT'}));
 const search=screen.getByPlaceholderText('Search 2D objects …');
 fireEvent.change(search,{target:{value:'Dreieck'}});
 expect(within(screen.getByRole('dialog')).getAllByRole('button')).toHaveLength(1);
 expect(screen.getByText('Triangle')).toBeInTheDocument();
 act(()=>usePreferences.setState({language:'de'}));
 expect(screen.getByRole('dialog',{name:'2D-Objekte'})).toBeInTheDocument();
 expect(screen.getByText('Dreieck')).toBeInTheDocument();
 expect(shapeCatalog).toEqual(catalog);
 expect(usePresentation.getState().items).toBe(document);
 expect(usePreferences.getState().audioRouting).toBe(audio);
});

it('localizes unknown-shape accessibility without modifying the safe fallback geometry',()=>{
 const view=render(<ShapeArtwork kind="not-a-known-shape"/>);
 expect(screen.getByRole('img',{name:'Unknown shape'})).toHaveAttribute('viewBox','0 0 100 100');
 expect(view.container.querySelector('path')).toHaveAttribute('d','M10 10h80v80H10z');
});

it('labels every gallery item and keeps arrow directions and church symbols distinct',()=>{
 render(<ShapeGallery onSelect={()=>{}}/>);
 fireEvent.click(screen.getByRole('button',{name:'2D OBJECT'}));
 const dialog=screen.getByRole('dialog');
 expect(within(dialog).getAllByRole('img')).toHaveLength(35);
 expect(within(dialog).queryByRole('img',{name:'Unknown shape'})).toBeNull();
 for(const name of ['Right arrow','Left arrow','Up arrow','Down arrow','Cross','Fish','Church','Bible','Candle','Dove']){
  expect(within(dialog).getByRole('img',{name})).toBeInTheDocument();
 }
});

it('treats inherited object properties as unknown kinds rather than translation keys',()=>{
 render(<ShapeArtwork kind="constructor"/>);
 expect(screen.getByRole('img',{name:'Unknown shape'})).toBeInTheDocument();
});

it('keeps the gallery inaccessible to changes while disabled',()=>{
 render(<ShapeGallery disabled onSelect={()=>{throw Error('Disabled selection must not fire')}}/>);
 const button=screen.getByRole('button');expect(button).toBeDisabled();
 fireEvent.click(button);expect(screen.queryByRole('dialog')).toBeNull();
});
