import type {DisplayRole} from './store';
import {createContext,useContext} from 'react';
export const TestModeContext=createContext(false);

export function testWatermarkText(_role:DisplayRole){return 'TESTBETRIEB'}
export function TestModeWatermark({role,visible}:{role:DisplayRole;visible?:boolean}){
  const inherited=useContext(TestModeContext);
  if(!(visible??inherited))return null;
  return <div className={`test-mode-watermark test-mode-watermark-${role}`} data-testid="test-mode-watermark" aria-hidden="true">{testWatermarkText(role)}</div>;
}
