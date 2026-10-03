import type {DisplayRole} from './store';

export function testWatermarkText(role:DisplayRole){return role==='stage'||role==='notes'?'TEST':'TESTBETRIEB'}
export function TestModeWatermark({role,visible}:{role:DisplayRole;visible:boolean}){
  if(!visible)return null;
  return <div className={`test-mode-watermark test-mode-watermark-${role}`} data-testid="test-mode-watermark" aria-hidden="true">{testWatermarkText(role)}</div>;
}
