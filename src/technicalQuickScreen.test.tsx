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
 expect(migrated.quickScreens).toEqual([custom,expect.objectContaining({id:'technical-issue'}),expect.objectContaining({id:'screen-test'})]);
 expect(migratePreferencesForV84(migrated)).toEqual(migrated);
});
it('keeps the output usable if a saved test-pattern selection is invalid',()=>{
 render(<QuickOverlay quick={{id:'screen-test',type:'screenTest',name:'Bildschirmtest',targets:['main'],order:0,enabled:true,testPattern:'invalid-saved-value'} as any} staticPreview/>);
 expect(screen.getByRole('img',{name:'Bildschirmtest: Farbbalken'})).toBeVisible();cleanup();
});
it('preserves a previously customized technical quick screen using the logo renderer',()=>{
 render(<QuickOverlay quick={{id:'technical-issue',type:'logo',name:'Eigener Hinweis',text:'Unsere Ausgabe',imageUrl:'data:image/svg+xml,<svg/>',enabled:true,targets:['main'],order:0}} staticPreview/>);
 expect(screen.getByRole('img')).toBeVisible();expect(screen.queryByRole('heading')).not.toBeInTheDocument();cleanup();
});
it('adds Bildschirmtest to existing profiles without changing saved custom messages',()=>{
 const saved={id:'technical-issue',type:'custom',text:'Eigene Überschrift\nEigene Mitteilung',background:'#699f3e',enabled:false};
 const migrated=migratePreferencesForV84({quickScreens:[saved]}) as any;
 expect(migrated.quickScreens[0]).toEqual(saved);
 expect(migrated.quickScreens[1]).toMatchObject({id:'screen-test',name:'Bildschirmtest',type:'screenTest',enabled:true,targets:['main']});
 expect(migratePreferencesForV84(migrated)).toEqual(migrated);
 render(<QuickOverlay quick={{...saved,name:'Technische Störung',targets:['main'],order:0} as any} staticPreview/>);
 expect(screen.getByRole('heading',{name:'Eigene Überschrift'})).toBeVisible();
 expect(screen.getByText('Eigene Mitteilung')).toBeVisible();cleanup();
});
