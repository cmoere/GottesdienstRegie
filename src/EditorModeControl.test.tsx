import {afterEach,expect,it} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {EditorModeControl} from './EditorModeControl';
import {usePresentation} from './store';
import {usePreferences} from './preferences';
afterEach(cleanup);
it('has two clear selected buttons and changes only editor mode, including keyboard navigation',()=>{
 usePreferences.setState({language:'de',germanRegion:null});usePresentation.setState({mode:'edit',onAir:true,liveItemId:'live-item',liveSlideId:'live-slide'});render(<EditorModeControl/>);
 const buttons=screen.getAllByRole('button');expect(buttons).toHaveLength(2);expect(buttons[0]).toHaveAttribute('aria-pressed','true');expect(screen.queryByRole('switch')).toBeNull();fireEvent.click(buttons[1]);expect(usePresentation.getState()).toMatchObject({mode:'preview',onAir:true,liveItemId:'live-item',liveSlideId:'live-slide'});expect(buttons[1]).toHaveAttribute('aria-pressed','true');fireEvent.keyDown(buttons[1],{key:'ArrowLeft'});expect(buttons[0]).toHaveFocus();expect(usePresentation.getState().mode).toBe('edit');
});
