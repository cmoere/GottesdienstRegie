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
 fireEvent.click(screen.getByRole('button',{name:'Objects'}));
 const dialog=screen.getByRole('dialog',{name:'Objects'});
 const search=within(dialog).getByPlaceholderText('Search objects');
 fireEvent.change(search,{target:{value:'left arrow'}});
 const choices=[...dialog.querySelectorAll<HTMLButtonElement>('.shape-gallery-choice')];
 const choice=choices.find(button=>button.querySelector('small')?.textContent==='Left arrow')!;
 expect(choice).toHaveTextContent('Left arrow');
 expect(choice).toHaveAttribute('title','Arrows');
 expect(within(choice).getByRole('img',{name:'Left arrow'})).toBeInTheDocument();
 fireEvent.click(choice);
 expect(selected).toEqual([['arrow-left','Pfeil links']]);
 expect(screen.queryByRole('dialog')).toBeNull();
});

it('keeps canonical German search aliases while updating an open gallery on language change',()=>{
 const catalog=structuredClone(shapeCatalog),document=usePresentation.getState().items,audio=usePreferences.getState().audioRouting;
 render(<ShapeGallery onSelect={()=>{}}/>);
 fireEvent.click(screen.getByRole('button',{name:'Objects'}));
 const search=screen.getByPlaceholderText('Search objects');
 fireEvent.change(search,{target:{value:'Dreieck'}});
 expect(screen.getByRole('dialog').querySelectorAll('.shape-gallery-choice').length).toBeGreaterThanOrEqual(3);
 expect(screen.getByText('Right triangle')).toBeInTheDocument();
 expect(screen.getByText('Triangle')).toBeInTheDocument();
 act(()=>usePreferences.setState({language:'de'}));
 expect(screen.getByRole('dialog',{name:'Objekte'})).toBeInTheDocument();
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
 fireEvent.click(screen.getByRole('button',{name:'Objects'}));
 const dialog=screen.getByRole('dialog');
 const names=[...dialog.querySelectorAll('.shape-gallery-choice svg[role=img]')].map(node=>node.getAttribute('aria-label'));
 expect(names).toHaveLength(shapeCatalog.length);
 expect(names).not.toContain('Unknown shape');
 for(const name of ['Right arrow','Left arrow','Up arrow','Down arrow','Cross','Fish','Church','Bible','Candle','Dove']){
  expect(names).toContain(name);
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
