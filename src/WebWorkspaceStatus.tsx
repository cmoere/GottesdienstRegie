import {useSyncExternalStore} from 'react';
import {useI18n} from './i18n';
import {CapabilityNotice} from './platform/CapabilityNotice';

function subscribe(listener: () => void) {
  window.addEventListener('online', listener);
  window.addEventListener('offline', listener);
  return () => {
    window.removeEventListener('online', listener);
    window.removeEventListener('offline', listener);
  };
}

export function WebWorkspaceStatus({saveState}: {saveState: string}) {
  const {t} = useI18n();
  const online = useSyncExternalStore(subscribe, () => navigator.onLine);
  const saveLabel = saveState === 'saving' ? t('operatorSaving')
    : saveState === 'error' ? t('operatorSaveError')
    : saveState === 'dirty' ? t('webUnsaved') : t('operatorSaved');
  return <div className="web-workspace-status">
    <div className="web-status-row" role="status">
      <span className="web-status-chip" data-online={online}>
        <span className="material-symbols-outlined" aria-hidden="true">{online ? 'wifi' : 'wifi_off'}</span>
        {online ? t('webOnline') : t('webOffline')}
      </span>
      <span className="web-status-chip" data-saving={saveState === 'saving'}>
        <span className="material-symbols-outlined" aria-hidden="true">{saveState === 'saving' ? 'progress_activity' : 'save'}</span>
        {saveLabel}
      </span>
    </div>
    <CapabilityNotice capability="outputMain"/>
  </div>;
}
