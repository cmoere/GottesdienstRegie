import path from 'node:path';
import type {AppPreferencesData,WindowStartMode} from './AppPreferences';

export type Rectangle={x:number;y:number;width:number;height:number};
export type DisplayGeometry={id:number;workArea:Rectangle;bounds:Rectangle};
export type OperatorWindowStartup={bounds:Rectangle;startMode:Exclude<WindowStartMode,'restore'>;minimumSize:{width:number;height:number};resizable:true;maximizable:true};

const intersects=(a:Rectangle,b:Rectangle)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;

export function resolveRendererEntry(_compiledDirectory:string,appRoot:string):string{
  return path.join(appRoot,'dist','index.html');
}

export function rendererFailureHtml(retryUrl:string):string{
  return `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>GottesdienstRegie</title><style>html,body{height:100%;margin:0}body{display:grid;place-items:center;background:#282832;color:#fff;font:16px Inter,system-ui,sans-serif}.panel{max-width:34rem;padding:2rem;text-align:center}h1{font-size:1.45rem}p{color:#cbd2d6;line-height:1.5}a{display:inline-block;margin-top:.7rem;padding:.75rem 1rem;border:1px solid #71bdca;color:#fff;text-decoration:none}a:focus,a:hover{background:#71bdca;color:#14252c}</style><body><main class="panel"><h1>Arbeitsbereich konnte nicht geladen werden</h1><p>Bitte versuche es erneut. Falls der Fehler bestehen bleibt, installiere die aktuelle Version erneut.</p><a href="${retryUrl}">Erneut versuchen</a></main></body></html>`;
}

export function resolveSplashWindowBounds(workArea:Rectangle):Rectangle{
  const width=Math.min(410,Math.max(360,workArea.width-40)),height=Math.min(700,Math.max(520,workArea.height-40));
  return{x:workArea.x+Math.round((workArea.width-width)/2),y:workArea.y+Math.round((workArea.height-height)/2),width,height};
}

export function resolveOperatorWindowStartup(preferences:Partial<AppPreferencesData>,displays:DisplayGeometry[],primaryId:number):OperatorWindowStartup{
  const primary=displays.find(display=>display.id===primaryId)??displays[0];
  if(!primary)throw new Error('NO_DISPLAY');
  const requested=preferences.operatorDisplayTarget==='last'?displays.find(display=>display.id===preferences.lastDisplayId):undefined;
  const target=requested??primary,stored=preferences.bounds,visible=Boolean(stored&&displays.some(display=>intersects(stored,display.bounds)));
  const bounds=visible?stored!:{x:target.workArea.x+Math.round(target.workArea.width*.05),y:target.workArea.y+Math.round(target.workArea.height*.05),width:Math.max(960,Math.round(target.workArea.width*.9)),height:Math.max(620,Math.round(target.workArea.height*.9))};
  const configured=preferences.windowStartMode??'fullscreen';
  return{bounds,startMode:configured==='restore'?(preferences.lastWindowState??'fullscreen'):configured,minimumSize:{width:960,height:620},resizable:true,maximizable:true};
}
