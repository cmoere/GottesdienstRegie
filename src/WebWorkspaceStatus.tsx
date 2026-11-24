import {UiIcon} from './icons/UiIcon';
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
        <UiIcon name={online ? 'wifi' : 'wifi_off'} aria-hidden="true" />
        {online ? t('webOnline') : t('webOffline')}
      </span>
      <span className="web-status-chip" data-saving={saveState === 'saving'}>
        <UiIcon name={saveState === 'saving' ? 'progress_activity' : 'save'} aria-hidden="true" />
        {saveLabel}
      </span>
    </div>
    <CapabilityNotice capability="outputMain"/>
  </div>;
}
