import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {shapeCatalog,shapeGeometry} from './shapeCatalog';
import {ShapeGallery} from './ShapeGallery';
import {usePreferences} from './preferences';
import {createServiceItem} from './store';
import {SlideRenderer} from './SlideRenderer';
const preferences=usePreferences.getState();afterEach(()=>{cleanup();usePreferences.setState(preferences,true)});
it('offers exactly 300 unique identified objects with 60 projected solids',()=>{
 expect(shapeCatalog).toHaveLength(300);expect(new Set(shapeCatalog.map(s=>s.kind)).size).toBe(300);
 expect(new Set(shapeCatalog.map(s=>s.path)).size).toBe(300);
 expect(shapeCatalog.filter(s=>s.dimension==='3d')).toHaveLength(60);
 for(const [category,count]of Object.entries({Grundformen:60,Pfeile:50,Rahmen:40,Banner:40}))expect(shapeCatalog.filter(s=>s.category===category)).toHaveLength(count);
 expect(shapeCatalog.filter(s=>['Symbole','Kirche','Weihnachten','Ostern'].includes(s.category))).toHaveLength(50);
});
it('changes projected depth and direction without invalid or shared geometry',()=>{
 for(const shape of shapeCatalog.filter(s=>s.dimension==='3d')){
  const a=shapeGeometry(shape.kind,undefined,{depth:8,angle:-35}),b=shapeGeometry(shape.kind,undefined,{depth:28,angle:130});
  expect(a.layers?.length).toBeGreaterThan(1);expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));expect(JSON.stringify(b)).not.toMatch(/NaN|Infinity/);
 }
});
it('filters the library to 3D objects and selects a canonical object',()=>{
 usePreferences.setState({language:'de',germanRegion:null});const selected:string[]=[];
 render(<ShapeGallery onSelect={kind=>selected.push(kind)}/>);fireEvent.click(screen.getByRole('button',{name:'Objekte'}));
 const dialog=screen.getByRole('dialog');fireEvent.change(within(dialog).getByLabelText('Darstellung'),{target:{value:'3d'}});
 expect(dialog.querySelectorAll('.shape-gallery-choice')).toHaveLength(60);
 fireEvent.click(dialog.querySelector('.shape-gallery-choice')!);expect(selected).toHaveLength(1);expect(screen.queryByRole('dialog')).toBeNull();
});
it('renders isolated gradient definitions with transparent fill and contour controls',()=>{
 const slide=createServiceItem('content').slides[0];slide.elements=['ring','banner-ribbon'].map((kind,index)=>({id:kind,name:kind,type:'shape',x:index*500,y:50,width:400,height:250,rotation:0,opacity:1,visible:true,locked:false,zIndex:index,properties:{shapeKind:kind,fill:'#699f3e',fillMode:'linear',fillGradientEnd:'#608f9a',fillGradientAngle:45,fillOpacity:.4,stroke:'#b6bec3',strokeOpacity:.6,strokeWidth:2}}));
 const view=render(<SlideRenderer slide={slide} mode="thumbnail"/>),gradients=[...view.container.querySelectorAll('linearGradient')];
 expect(gradients).toHaveLength(2);expect(gradients[0].id).not.toBe(gradients[1].id);
 for(const path of view.container.querySelectorAll('.shape path')){expect(path).toHaveAttribute('fill-opacity','0.4');expect(path).toHaveAttribute('stroke-opacity','0.6');expect(path.getAttribute('fill')).toMatch(/^url\(#/)}
});
it('keeps projected solids proportional inside a freely resized object box',()=>{
 const slide=createServiceItem('content').slides[0];slide.elements=[{id:'sphere',name:'Kugel',type:'shape',x:50,y:50,width:620,height:360,rotation:0,opacity:1,visible:true,locked:false,zIndex:1,properties:{shapeKind:'solid-sphere',fill:'#608f9a'}}];
 const view=render(<SlideRenderer slide={slide} mode="thumbnail"/>);
 expect(view.container.querySelector('.shape-solid-sphere')).toHaveAttribute('preserveAspectRatio','xMidYMid meet');
});
