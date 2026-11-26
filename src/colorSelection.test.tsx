import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {ColorSelection} from './ColorSelection';
import {usePreferences} from './preferences';
import {useObjectPalette} from './objectPaletteState';
import {normalizeColor,rgbHex,cssPaint} from './colorModel';
const saved=usePreferences.getState(),paletteSaved=useObjectPalette.getState();afterEach(()=>{cleanup();usePreferences.setState(saved,true);useObjectPalette.setState(paletteSaved,true);vi.unstubAllGlobals()});
it('validates HEX, edits opacity and restores the opening values on cancel',()=>{
 usePreferences.setState({language:'de',germanRegion:null});const update=vi.fn();
 render(<ColorSelection label="Füllung" value="#699f3e" opacity={1} onChange={update} allowGradient/>);
 fireEvent.click(screen.getByRole('button',{name:/Füllung/}));
 const hex=screen.getByLabelText('HEX');fireEvent.change(hex,{target:{value:'invalid'}});fireEvent.blur(hex);expect(update).not.toHaveBeenCalled();
 fireEvent.change(hex,{target:{value:'#123abc'}});fireEvent.keyDown(hex,{key:'Enter'});expect(update).toHaveBeenLastCalledWith(expect.objectContaining({color:'#123abc'}));
 fireEvent.change(screen.getByLabelText('Transparenz (%)'),{target:{value:'35'}});expect(update).toHaveBeenLastCalledWith(expect.objectContaining({opacity:.65}));
 fireEvent.click(screen.getByRole('button',{name:'Abbrechen'}));expect(update).toHaveBeenLastCalledWith(expect.objectContaining({color:'#699f3e',opacity:1}));
});
it('uses a supported system pipette only after an explicit click',async()=>{
 usePreferences.setState({language:'de',germanRegion:null});const open=vi.fn().mockResolvedValue({sRGBHex:'#abcdef'}),update=vi.fn();
 vi.stubGlobal('EyeDropper',class{open=open});render(<ColorSelection label="Kontur" value="#000000" onChange={update}/>);
 fireEvent.click(screen.getByRole('button',{name:/Kontur/}));expect(open).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Pipette'}));await vi.waitFor(()=>expect(update).toHaveBeenCalledWith(expect.objectContaining({color:'#abcdef'})));
});
it('normalizes color input and keeps invalid colors out of persistent palettes',()=>{
 const palette=useObjectPalette.getState();useObjectPalette.setState({colors:[],favoriteColors:[]});
 expect(normalizeColor(' ABC ')).toBe('#aabbcc');expect(normalizeColor('javascript:alert(1)')).toBeNull();expect(rgbHex([300,-9,NaN])).toBe('#ff0000');
 palette.rememberColor('#abc');palette.rememberColor('#123456');palette.rememberColor('#abc');palette.rememberColor('broken');palette.toggleColor('#abc');
 expect(useObjectPalette.getState().colors).toEqual(['#aabbcc','#123456']);expect(useObjectPalette.getState().favoriteColors).toContain('#aabbcc');
 const persisted=JSON.parse(localStorage.getItem('gottesdienstregie.object-palette')!);expect(persisted.state.favoriteColors).toContain('#aabbcc');
 expect(cssPaint({fill:'#608f9a',fillEnabled:false,fillMode:'linear'})).toBe('transparent');
 expect(cssPaint({fill:'rgba(20,30,40,0.5)',fillOpacity:1})).toBe('rgba(20,30,40,0.5)');
});
it('cancels without converting an existing imported CSS color into white',()=>{
 usePreferences.setState({language:'de',germanRegion:null});const update=vi.fn();render(<ColorSelection label="Füllung" value="rgba(20,30,40,0.5)" onChange={update}/>);
 fireEvent.click(screen.getByRole('button',{name:/^Füllung /}));fireEvent.click(screen.getByRole('button',{name:'Abbrechen'}));expect(update).toHaveBeenLastCalledWith(expect.objectContaining({color:'rgba(20,30,40,0.5)'}));
});
