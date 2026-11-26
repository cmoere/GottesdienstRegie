import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {SlideRenderer} from './SlideRenderer';
import {FormatToolbar} from './ProductionWorkspace';
import {shapeByKind} from './shapeCatalog';
import {framePath,frameThickness} from './frameGeometry';
import {createServiceItem,usePresentation} from './store';
import {usePreferences} from './preferences';

const saved=usePresentation.getState(),preferences=usePreferences.getState();
afterEach(()=>{cleanup();usePresentation.setState(saved,true);usePreferences.setState(preferences,true)});
function frame(){
 const item=createServiceItem('content');
 item.slides[0].elements=[{id:'adjustable',type:'shape',name:'Rahmen',x:80,y:90,width:600,height:300,rotation:10,opacity:1,visible:true,locked:false,zIndex:1,properties:{shapeKind:'frame-rectangle',fill:'#699f3e',stroke:'#608f9a',strokeWidth:1}}];
 return item;
}

it('changes fill, outline and frame thickness through actual operator controls',()=>{
 usePreferences.setState({language:'de',germanRegion:null});const item=frame();
 usePresentation.setState({items:[item],selectedItemId:item.id,selectedSlideId:item.slides[0].id,selectedElementIds:['adjustable']});
 render(<FormatToolbar openBackgroundMedia={()=>{}}/>);
 fireEvent.click(screen.getByRole('button',{name:/^Füllung /}));
 fireEvent.change(screen.getByLabelText('FÜLLFARBE'),{target:{value:'#ff7700'}});
 fireEvent.click(screen.getByRole('button',{name:'Übernehmen'}));
 fireEvent.click(screen.getByRole('button',{name:/^Kontur /}));
 fireEvent.change(screen.getByLabelText('Konturfarbe'),{target:{value:'#334455'}});
 fireEvent.click(screen.getByRole('button',{name:'Übernehmen'}));
 fireEvent.change(screen.getByLabelText('Konturstärke'),{target:{value:'4'}});
 fireEvent.change(screen.getByLabelText('Rahmenbreite (%)'),{target:{value:'16'}});
 fireEvent.click(screen.getByRole('checkbox',{name:'Ohne Füllung'}));
 const element=usePresentation.getState().items[0].slides[0].elements[0];
 expect(element).toMatchObject({x:80,y:90,width:600,height:300,rotation:10,properties:{fill:'#ff7700',stroke:'#334455',strokeWidth:4,frameThickness:16,fillEnabled:false}});
 fireEvent.click(screen.getByRole('checkbox',{name:'Ohne Füllung'}));
 expect(usePresentation.getState().items[0].slides[0].elements[0].properties).toMatchObject({fill:'#ff7700',fillEnabled:true});
});

it('changes actual frame geometry while leaving original stored frames unchanged until edited',()=>{
 const item=frame(),slide=item.slides[0];
 const view=render(<SlideRenderer slide={slide} mode="thumbnail"/>);
 expect(view.container.querySelector('.shape-frame-rectangle path')).toHaveAttribute('d',shapeByKind('frame-rectangle').path);
 const changed=structuredClone(slide);changed.elements[0].properties.frameThickness=20;
 view.rerender(<SlideRenderer slide={changed} mode="thumbnail"/>);
 expect(view.container.querySelector('.shape-frame-rectangle path')?.getAttribute('d')).not.toBe(shapeByKind('frame-rectangle').path);
 expect(slide.elements[0].properties.frameThickness).toBeUndefined();
});

it.each(['frame-oval','banner-ribbon','rectangle'])('keeps the outline visible with no fill on %s',kind=>{
 const slide=frame().slides[0];slide.elements[0].properties={shapeKind:kind,fill:'#699f3e',fillEnabled:false,stroke:'#608f9a',strokeWidth:3};
 const view=render(<SlideRenderer slide={slide} mode="thumbnail"/>),element=view.container.querySelector('.shape-'+kind)!;
 if(element.tagName.toLowerCase()==='svg')expect(element.querySelector('path')).toHaveAttribute('fill','none');
 else expect(element).toHaveStyle({background:'transparent'});
});

it('draws triangle outlines along the actual shape rather than clipping a rectangular border',()=>{
 const slide=frame().slides[0];slide.elements[0].properties={shapeKind:'triangle',fill:'#699f3e',stroke:'#608f9a',strokeWidth:5,fillEnabled:false};
 const view=render(<SlideRenderer slide={slide} mode="thumbnail"/>);
 const polygon=view.container.querySelector('.shape-triangle path');
 expect(polygon).toHaveAttribute('fill','none');expect(polygon).toHaveAttribute('stroke','#608f9a');expect(polygon).toHaveAttribute('stroke-width','5');
});

it('bounds invalid frame thickness and provides geometry for all ten frame types',()=>{
 expect(frameThickness('frame-rectangle',NaN)).toBe(8);expect(frameThickness('frame-rectangle',-100)).toBe(1);expect(frameThickness('frame-rectangle',100)).toBe(24);
 for(const kind of ['frame-rectangle','frame-rounded','frame-oval','frame-double','frame-corners','frame-hexagon','frame-diamond','frame-triangle','frame-octagon','frame-brackets']){
  expect(framePath(kind,1)).not.toBe(framePath(kind,24));expect(framePath(kind,24)).not.toMatch(/NaN|Infinity/);
 }
 expect(framePath('constructor',10)).toBeUndefined();
});
