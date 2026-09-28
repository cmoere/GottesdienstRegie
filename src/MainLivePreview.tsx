import type { ReactNode } from 'react';

export function MainLivePreview({ title, children }: { title: string; children: ReactNode }) {
  return <section className="live-slide-panel">
    <h2>LIVE AUF MAIN</h2>
    <div>{children}</div>
    <p>{title}</p>
  </section>;
}
