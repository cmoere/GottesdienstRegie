export type ShortcutAction='save'|'undo'|'redo'|'nextLive'|'previousLive'|'toggleMode'|'toggleFullscreen'|'toggleOnAir';
export type KeyboardShortcuts=Record<ShortcutAction,string>;

export const defaultKeyboardShortcuts:KeyboardShortcuts={
  save:'Ctrl+S',
  undo:'Ctrl+Z',
  redo:'Ctrl+Shift+Z',
  nextLive:'ArrowRight',
  previousLive:'ArrowLeft',
  toggleMode:'Ctrl+Shift+P',
  toggleFullscreen:'F11',
  toggleOnAir:'Ctrl+Shift+Enter'
};

const keyNames:Record<string,string>={' ':'Space',Control:'Ctrl',Meta:'Meta',Alt:'Alt',Shift:'Shift',Esc:'Escape'};

export function shortcutFromEvent(event:Pick<KeyboardEvent,'key'|'ctrlKey'|'metaKey'|'altKey'|'shiftKey'>):string{
  const key=keyNames[event.key]??(event.key.length===1?event.key.toUpperCase():event.key);
  if(['Ctrl','Meta','Alt','Shift'].includes(key))return '';
  const parts:string[]=[];
  if(event.ctrlKey||event.metaKey)parts.push('Ctrl');
  if(event.altKey)parts.push('Alt');
  if(event.shiftKey)parts.push('Shift');
  parts.push(key);
  return parts.join('+');
}

export function matchesShortcut(event:KeyboardEvent,shortcut:string){
  return shortcutFromEvent(event).toLowerCase()===shortcut.toLowerCase();
}
