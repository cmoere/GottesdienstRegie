import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {NowPlayingDesigner} from './NowPlayingDesigner';

const updateItem=vi.fn(),updateElement=vi.fn();
vi.mock('./store',async()=>{const actual=await vi.importActual<any>('./store');return{...actual,usePresentation:()=>({updateItem,updateElement})}});
const item={id:'now',type:'nowPlaying',metadata:{},plannedDuration:15000,slides:[{elements:[{id:'loop',type:'loop',properties:{}}]}]} as any;
afterEach(cleanup);

describe('NowPlayingDesigner',()=>{
  it('shows ten visual cards and no design combobox',()=>{
    render(<NowPlayingDesigner item={item} canEdit/>);
    expect(screen.getAllByRole('button',{name:/Design:/})).toHaveLength(10);
    expect(screen.queryByRole('combobox',{name:/Design/})).toBeNull();
  });
  it('updates selection and exposes colors, casing, visualizer and duration >= 1',()=>{
    render(<NowPlayingDesigner item={item} canEdit/>);
    fireEvent.click(screen.getByRole('button',{name:'Design: Neon'}));
    expect(updateItem).toHaveBeenCalled();
    expect(screen.getByLabelText('Hintergrundfarbe')).toBeTruthy();
    expect(screen.getByLabelText('Schreibweise')).toBeTruthy();
    expect(screen.getByLabelText('Visualizer-Position')).toBeTruthy();
    expect(screen.getByLabelText('Anzeigedauer in Sekunden')).toHaveAttribute('min','1');
  });
});
