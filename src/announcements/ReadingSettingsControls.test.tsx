import {render,screen,fireEvent} from '@testing-library/react';import {expect,it,vi} from 'vitest';
import {ReadingSettingsControls} from './ReadingSettingsControls';
import {defaultReadingSettings} from './readingSettings';
it('exposes actual bounded reading controls and leaves the gong and route separate',()=>{
 const change=vi.fn();render(<ReadingSettingsControls value={defaultReadingSettings} onChange={change} disabled={false} german/>);
 fireEvent.change(screen.getByLabelText('Sprechtempo'),{target:{value:'0.85'}});expect(change).toHaveBeenLastCalledWith({...defaultReadingSettings,speed:.85});
 fireEvent.change(screen.getByLabelText('Absatzpause (ms)'),{target:{value:'900'}});expect(change).toHaveBeenLastCalledWith({...defaultReadingSettings,paragraphPauseMs:900});
 expect(screen.getByText(/Gong und Audioausgang/)).toBeInTheDocument();
});
