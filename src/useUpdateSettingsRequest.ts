import {useEffect} from 'react';
/** Notification only: updater work stays owned by the native process. */
export function useUpdateSettingsRequest(open:()=>void){
 useEffect(()=>window.desktop?.updates?.onOpenSettings?.(open),[open]);
}
