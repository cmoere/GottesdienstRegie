import {expect,it} from 'vitest';import {monitorPath} from './remoteMonitor';
it('uses only the fixed lighting path and retains private personal-monitor links',()=>{expect(monitorPath({profile:'lighting',token:'random-secret'})).toBe('/lichtoperator');expect(monitorPath({profile:'personal',token:'random-secret'})).toBe('/monitor/random-secret')});
