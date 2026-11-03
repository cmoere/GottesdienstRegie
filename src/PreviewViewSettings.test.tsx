import {afterEach,expect,it} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {PreviewViewSettings,usePreviewOptions} from './PreviewOverviewControls';
import {usePresentation} from './store';
import {usePreferences} from './preferences';
afterEach(cleanup);
it('exposes the saved view choices directly as settings fields without a second popup',()=>{
 usePreferences.setState({language:'de',germanRegion:null});usePresentation.setState({gridSize:280});usePreviewOptions.setState({showTitles:false,showNext:true});render(<PreviewViewSettings/>);
 expect(screen.getByRole('heading',{name:'Ansichtseinstellungen'})).toBeTruthy();expect(screen.queryByRole('button',{name:'Einstellungen'})).toBeNull();expect(screen.getByRole('slider')).toHaveValue('280');expect(screen.getByRole('checkbox',{name:'Folientitel anzeigen'})).not.toBeChecked();fireEvent.change(screen.getByRole('slider'),{target:{value:'360'}});fireEvent.click(screen.getByRole('checkbox',{name:'Nächste Folie anzeigen'}));expect(usePresentation.getState().gridSize).toBe(360);expect(usePreviewOptions.getState()).toMatchObject({showTitles:false,showNext:false});
});
