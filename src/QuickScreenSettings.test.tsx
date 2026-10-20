import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {QuickScreenSettings} from './QuickScreenSettings';
import {usePreferences,type QuickScreenConfig} from './preferences';
const initial=usePreferences.getState();
afterEach(()=>{cleanup();usePreferences.setState(initial,true);vi.restoreAllMocks()});

it('uses existing localized labels while retaining custom output copy and only applying the requested color edit',()=>{
  const item:QuickScreenConfig={id:'custom-example',type:'custom',name:'Gebetsabend',text:'Bitte den Seiteneingang benutzen.',background:'#000000',targets:['main'],order:0,enabled:true};
  usePreferences.setState({language:'en',germanRegion:null,quickScreens:[item]});
  render(<QuickScreenSettings/>);
  expect(screen.getByRole('heading',{level:3,name:'Quick Screens'})).toBeVisible();
  expect(screen.getByLabelText('Text')).toHaveValue(item.text);
  const background=screen.getByLabelText('Background');
  fireEvent.change(background,{target:{value:'#608f9a'}});
  expect(usePreferences.getState().quickScreens).toEqual([{...item,background:'#608f9a'}]);
  act(()=>usePreferences.setState({language:'de'}));
  expect(screen.getByRole('heading',{level:3,name:'Schnellanzeigen'})).toBeVisible();
  expect(screen.getByLabelText('Hintergrund')).toHaveValue('#608f9a');
  expect(screen.getByLabelText('Text')).toHaveValue(item.text);
});

it('localizes adding a Quick Screen without translating the entered screen name or output text',()=>{
  usePreferences.setState({language:'en',germanRegion:null,quickScreens:[]});
  const prompt=vi.spyOn(window,'prompt').mockReturnValue('Ökumenischer Abend');
  render(<QuickScreenSettings/>);
  expect(screen.getByText('Quick Screens do not change the order of service. They temporarily overlay the current live state, and LAST SHOWN restores it.')).toBeVisible();
  fireEvent.click(screen.getByRole('button',{name:'+ QUICK SCREEN'}));
  expect(prompt).toHaveBeenCalledWith('Name of the Quick Screen');
  expect(screen.getByText('Active')).toBeVisible();
  expect(screen.getByLabelText('Type')).toHaveValue('custom');
  expect(screen.getByRole('option',{name:'Image / Logo'})).toHaveValue('logo');
  expect(screen.getByRole('group',{name:'Display on'})).toBeVisible();
  const added=usePreferences.getState().quickScreens;
  expect(added).toHaveLength(1);
  expect(added[0]).toMatchObject({name:'Ökumenischer Abend',text:'Ökumenischer Abend',targets:['main'],enabled:true,type:'custom'});
});

it('localizes countdown and logo controls while applying only the requested saved changes',()=>{
  const countdown:QuickScreenConfig={id:'countdown',type:'countdown',name:'Unsere Startzeit',text:'Wir beginnen gleich.',duration:300,endText:'Willkommen!',targets:['main','stage'],order:0,enabled:false};
  usePreferences.setState({language:'en',germanRegion:null,quickScreens:[countdown]});
  render(<QuickScreenSettings/>);
  expect(screen.getByText('Off')).toBeVisible();
  expect(screen.getByLabelText('End text')).toHaveValue('Willkommen!');
  fireEvent.change(screen.getByLabelText('Duration (seconds)'),{target:{value:'120'}});
  expect(usePreferences.getState().quickScreens).toEqual([{...countdown,duration:120}]);
  const logo:QuickScreenConfig={id:'logo',type:'logo',name:'Unser Logo',text:'Eigener Gemeindename',imageUrl:'data:image/png;base64,abc',targets:['main'],order:0,enabled:true};
  act(()=>usePreferences.setState({quickScreens:[logo]}));
  expect(screen.getByLabelText('Church logo')).toHaveAttribute('type','file');
  fireEvent.click(screen.getByRole('button',{name:'REMOVE CUSTOM LOGO'}));
  expect(usePreferences.getState().quickScreens).toEqual([{...logo,imageUrl:undefined}]);
});
