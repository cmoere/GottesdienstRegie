import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {shapeByKind,searchShapes,shapeCatalog} from './shapeCatalog';
import {ShapeGallery} from './ShapeGallery';
import {SlideRenderer} from './SlideRenderer';
import {createServiceItem,usePresentation} from './store';
import {FormatToolbar} from './ProductionWorkspace';
import {usePreferences} from './preferences';

const kinds=['semicircle','quarter-circle','ring','arc','plus','right-triangle','capsule','teardrop','frame-rectangle','frame-rounded','frame-oval','frame-double','frame-corners','frame-hexagon','banner-ribbon','banner-pennant','banner-bookmark','banner-notched','banner-chevron','banner-wave','heptagon','decagon','kite','rounded-diamond','frame-diamond','frame-triangle','frame-octagon','frame-brackets','banner-flag','banner-tab','banner-ticket','banner-folded'];
const preferences=usePreferences.getState();
const presentation=usePresentation.getState();
afterEach(()=>{cleanup();usePreferences.setState(preferences,true);usePresentation.setState(presentation,true)});

it('offers distinct real vectors for all additional shapes, frames and banners',()=>{
 expect(searchShapes('Rahmen')).toHaveLength(40);
 expect(searchShapes('Banner')).toHaveLength(40);
 for(const kind of kinds){expect(shapeByKind(kind)).toMatchObject({kind,vector:true,viewBox:'0 0 100 100'})}
 expect(new Set(kinds.map(kind=>shapeByKind(kind).path)).size).toBe(kinds.length);
});

it('selects a translated banner using its stable ID and canonical saved name',()=>{
 usePreferences.setState({language:'en',germanRegion:null});
 const selected:string[][]=[];
 render(<ShapeGallery onSelect={(kind,name)=>selected.push([kind,name])}/>);
 fireEvent.click(screen.getByRole('button',{name:'Objects'}));
 fireEvent.change(screen.getByPlaceholderText('Search objects'),{target:{value:'Ribbon banner'}});
 const choices=[...screen.getByRole('dialog').querySelectorAll('.shape-gallery-choice')];
 expect(choices.length).toBeGreaterThan(0);
 fireEvent.click(choices.find(button=>button.querySelector('small')?.textContent==='Ribbon banner')!);
 expect(selected).toEqual([['banner-ribbon','Banderole']]);
 expect(screen.queryByRole('dialog')).toBeNull();
});

it.each(['thumbnail','live'] as const)('renders new objects with editable fill and outline in %s output',mode=>{
 const slide=createServiceItem('content').slides[0];
 slide.elements=kinds.map((kind,index)=>({id:kind,name:kind,type:'shape',x:index*20,y:10,width:300,height:150,rotation:0,opacity:1,visible:true,locked:false,zIndex:index,properties:{shapeKind:kind,fill:'#699f3e',stroke:'#608f9a',strokeWidth:2}}));
 const view=render(<SlideRenderer slide={slide} mode={mode}/>);
 for(const kind of kinds){
  const path=view.container.querySelector('.shape-'+kind+' path');
  expect(path).toHaveAttribute('d',shapeByKind(kind).path);
  expect(path).toHaveAttribute('fill','#699f3e');
  expect(path).toHaveAttribute('stroke','#608f9a');
  expect(path).toHaveAttribute('stroke-width','2');
  expect(path).toHaveAttribute('fill-rule','evenodd');
 }
});

it('edits every catalog kind through the toolbar without losing object styling or geometry',()=>{
 usePreferences.setState({language:'de',germanRegion:null});
 const item=createServiceItem('content');
 item.slides[0].elements=[{id:'frame',name:'Rahmen',type:'shape',x:20,y:30,width:600,height:300,rotation:12,opacity:.8,visible:true,locked:false,zIndex:2,properties:{shapeKind:'frame-oval',fill:'#699f3e',stroke:'#608f9a',strokeWidth:2}}];
 usePresentation.setState({items:[item],selectedItemId:item.id,selectedSlideId:item.slides[0].id,selectedElementIds:['frame']});
 render(<FormatToolbar openBackgroundMedia={()=>{}}/>);
 const select=screen.getByRole('combobox',{name:'Form'});
 expect(within(select).getAllByRole('option')).toHaveLength(shapeCatalog.length);
 expect(select).toHaveValue('frame-oval');
 fireEvent.change(select,{target:{value:'banner-ribbon'}});
 const element=usePresentation.getState().items[0].slides[0].elements[0];
 expect(element).toMatchObject({id:'frame',x:20,y:30,width:600,height:300,rotation:12,opacity:.8,properties:{shapeKind:'banner-ribbon',fill:'#699f3e',stroke:'#608f9a',strokeWidth:2}});
});
