import {cleanup,render,fireEvent,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {SlideRenderer} from './SlideRenderer';import {createServiceItem,usePresentation} from './store';import {shapeByKind} from './shapeCatalog';
import {LiveViewResetSettings} from './LiveViewResetSettings';import {usePreferences} from './preferences';import {getLiveViewRevision} from './liveViewRecovery';
afterEach(cleanup);
it('renders seasonal vector geometry and editable fill in the actual slide renderer',()=>{
 const slide=createServiceItem('content').slides[0];slide.elements=['christmas-tree','easter-egg','latin-cross'].map((kind,index)=>({id:kind,type:'shape',name:kind,x:100+index*300,y:200,width:200,height:300,rotation:0,opacity:1,locked:false,visible:true,zIndex:index,properties:{shapeKind:kind,fill:'#699f3e'}}));const view=render(<SlideRenderer slide={slide} mode="thumbnail"/>);
 for(const kind of ['christmas-tree','easter-egg','latin-cross']){const path=view.container.querySelector('.shape-'+kind+' path');expect(path).toHaveAttribute('d',shapeByKind(kind).path);expect(path).toHaveAttribute('fill','#699f3e');expect(path).toHaveAttribute('fill-rule','evenodd')}
});
it('exposes the safe local view reset in application settings',()=>{usePreferences.setState({language:'de',germanRegion:null});const state=usePresentation.getState(),revision=getLiveViewRevision();render(<LiveViewResetSettings/>);fireEvent.click(screen.getByRole('button',{name:'Liveansicht zurücksetzen'}));expect(getLiveViewRevision()).toBe(revision+1);expect(usePresentation.getState()).toBe(state);expect(screen.getByRole('status')).toHaveTextContent('Die lokale Liveansicht wurde zurückgesetzt.')});
