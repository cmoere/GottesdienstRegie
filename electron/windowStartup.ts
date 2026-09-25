import type {AppPreferencesData,WindowStartMode} from './AppPreferences';

export type Rectangle={x:number;y:number;width:number;height:number};
export type DisplayGeometry={id:number;workArea:Rectangle;bounds:Rectangle};
export type OperatorWindowStartup={bounds:Rectangle;startMode:Exclude<WindowStartMode,'restore'>;minimumSize:{width:number;height:number};resizable:true;maximizable:true};

const intersects=(a:Rectangle,b:Rectangle)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;

export function resolveOperatorWindowStartup(preferences:Partial<AppPreferencesData>,displays:DisplayGeometry[],primaryId:number):OperatorWindowStartup{
  const primary=displays.find(display=>display.id===primaryId)??displays[0];
  if(!primary)throw new Error('NO_DISPLAY');
  const requested=preferences.operatorDisplayTarget==='last'?displays.find(display=>display.id===preferences.lastDisplayId):undefined;
  const target=requested??primary,stored=preferences.bounds,visible=Boolean(stored&&displays.some(display=>intersects(stored,display.bounds)));
  const bounds=visible?stored!:{x:target.workArea.x+Math.round(target.workArea.width*.05),y:target.workArea.y+Math.round(target.workArea.height*.05),width:Math.max(960,Math.round(target.workArea.width*.9)),height:Math.max(620,Math.round(target.workArea.height*.9))};
  const configured=preferences.windowStartMode??'fullscreen';
  return{bounds,startMode:configured==='restore'?(preferences.lastWindowState??'fullscreen'):configured,minimumSize:{width:960,height:620},resizable:true,maximizable:true};
}
