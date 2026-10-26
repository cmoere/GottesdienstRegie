export type UpdatePromptAction='install-now'|'later'|'install-on-exit'|'cancel'|'open-settings';

export function updatePromptAction(response:number):UpdatePromptAction{
  return(['install-now','later','install-on-exit','cancel','open-settings'] as const)[response]??'cancel';
}
