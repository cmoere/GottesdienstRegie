export type UpdatePromptAction='install-now'|'later'|'install-on-exit'|'cancel';

export function updatePromptAction(response:number):UpdatePromptAction{
  return(['install-now','later','install-on-exit','cancel'] as const)[response]??'cancel';
}
