export const WEB_EDITOR_URL='https://cmoere.github.io/GottesdienstRegie/editor/';
export const DESKTOP_RELEASE_URL='https://github.com/cmoere/GottesdienstRegie/releases/latest';

export function platformLinkFor(action:'web-editor'|'desktop-download'){
  return action==='web-editor'?WEB_EDITOR_URL:DESKTOP_RELEASE_URL;
}
