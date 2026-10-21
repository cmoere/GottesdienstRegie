import {expect,it} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {usePreferences,migratePreferencesForV84} from './preferences';
import {QuickOverlay} from './QuickOverlay';
it('provides a technical-issue MAIN quick screen in fresh and existing settings',()=>{
 const quick=usePreferences.getState().quickScreens.find(quick=>quick.id==='technical-issue');
 expect(quick).toMatchObject({enabled:true,targets:['main'],name:'Technische Störung'});
 render(<QuickOverlay quick={quick!} staticPreview/>);
 expect(screen.getByText(/Wir bitten um etwas Geduld/)).toBeVisible();cleanup();
 const custom={id:'mine',type:'custom',text:'Unverändert',enabled:false};
 const migrated=migratePreferencesForV84({quickScreens:[custom]}) as {quickScreens:unknown[]};
 expect(migrated.quickScreens).toEqual([custom,expect.objectContaining({id:'technical-issue'})]);
 expect(migratePreferencesForV84(migrated)).toEqual(migrated);
});
