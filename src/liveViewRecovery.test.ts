import {expect,it} from 'vitest';
import {resetLiveView,getLiveViewRevision} from './liveViewRecovery';
import {usePresentation} from './store';
it('rebuilds only the local preview without changing the live presentation',()=>{const before=usePresentation.getState(),revision=getLiveViewRevision();resetLiveView();expect(getLiveViewRevision()).toBe(revision+1);expect(usePresentation.getState()).toBe(before)});
