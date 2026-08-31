import { screen, type Display } from 'electron';

export type OutputRole='operator'|'main'|'stage'|'notes'|'livestream'|'lobby';
export type DisplayAssignments=Record<string,string>;

export class DisplayManager{
  list(){const primary=screen.getPrimaryDisplay().id;return screen.getAllDisplays().map((display,index)=>({id:display.id,label:display.label||`Anzeige ${index+1}`,bounds:display.bounds,workArea:display.workArea,scaleFactor:display.scaleFactor,rotation:display.rotation,touchSupport:display.touchSupport,primary:display.id===primary}))}
  displayForRole(assignments:DisplayAssignments,role:OutputRole):Display|undefined{const id=Number(Object.entries(assignments).find(([,value])=>value===role)?.[0]);return screen.getAllDisplays().find(display=>display.id===id)}
  preflight(assignments:DisplayAssignments,presentation:{hasPresentation?:boolean;activeSlideCount?:number;media?:string[]}){
    const errors:string[]=[],warnings:string[]=[],main=this.displayForRole(assignments,'main');
    if(!presentation?.hasPresentation||!presentation.activeSlideCount)errors.push('Keine geöffnete Präsentation mit aktiven Folien gefunden.');
    if(!main)errors.push('MAIN ist keinem aktuell vorhandenen Bildschirm zugeordnet.');
    else if(main.id===screen.getPrimaryDisplay().id)errors.push('MAIN darf nicht auf dem primären Bedienbildschirm ausgegeben werden.');
    const invalid=(presentation.media??[]).filter(source=>!source.trim());if(invalid.length)warnings.push(`${invalid.length} Medienquelle ist nicht verfügbar.`);
    return{ok:errors.length===0,errors,warnings,displays:this.list()};
  }
}
