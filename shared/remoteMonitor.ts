export type MonitorProfile = 'personal' | 'lighting';
export type MonitorLayout = 'mirror' | 'current-next' | 'lighting' | 'lighting-grid';

export function monitorPath(monitor:{profile?:MonitorProfile;token:string}){
  return monitor.profile==='lighting'?'/lichtoperator':'/monitor/'+encodeURIComponent(monitor.token);
}

export function normalizeMonitorLayout(value: unknown, profile: MonitorProfile): MonitorLayout {
  if (value === 'mirror' || value === 'current-next') return value;
  if (profile === 'lighting') return value === 'lighting-grid' ? value : 'lighting';
  return 'current-next';
}
