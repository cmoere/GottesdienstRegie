import type { ReactNode } from 'react';
import {TestModeWatermark} from './TestModeWatermark';

export function MainLivePreview({ title, children }: { title: string; children: ReactNode }) {
  return <section className="live-slide-panel">
    <h2>LIVE AUF MAIN</h2>
    <div style={{position:'relative',containerType:'size'}}>{children}<TestModeWatermark role="main"/></div>
    <p>{title}</p>
  </section>;
}
