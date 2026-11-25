export const LOCAL_MONITOR_HOSTNAME='regie.local';
export type LocalMonitorAddressState={status:'starting'|'ready'|'conflict'|'unavailable';hostname?:typeof LOCAL_MONITOR_HOSTNAME};
