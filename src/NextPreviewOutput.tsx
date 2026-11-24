import {useEffect, useState} from 'react';
import type {NextPreviewState} from '../shared/nextPreview';
import type {Slide} from './store';
import {SlideRenderer} from './SlideRenderer';
import {PowerPointStaticPreview} from './PowerPointPlaybackPanel';

export function NextPreviewOutput() {
 const [value, setValue] = useState<NextPreviewState<Slide> | null>(null);
 useEffect(() => {
  const api = (window.desktop as any)?.remote;
  if (!api) return;
  const off = api.onNextPreview(setValue);
  void api.getNextPreview().then(setValue);
  return off;
 }, []);

 useEffect(() => {
  if (!value) return;
  let disposed = false;
  async function prepare() {
   await document.fonts.ready;
   const originalCount = value!.packets.filter(packet => packet.sourceHash).length;
   for (let attempt = 0; originalCount && attempt < 100 && !disposed; attempt++) {
    if (document.querySelectorAll('.powerpoint-static-preview img').length >= originalCount) break;
    await new Promise(resolve => setTimeout(resolve, 30));
   }
   await Promise.all([...document.images].map(async image => {
    image.loading = 'eager';
    await image.decode().catch(() => {});
   }));
   await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
   if (!disposed) void (window.desktop as any)?.remote.nextPreviewReady(value!.revision);
  }
  void prepare();
  return () => {disposed = true;};
 }, [value]);

 const columns = (value?.packets.length ?? 0) > 1 ? 2 : 1;
 return <div style={{width: '100vw', height: '100vh', overflow: 'hidden', background: '#000',
  display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${columns}, minmax(0, 1fr))`}}>
  {value?.packets.map((packet, index) => <div key={index} style={{position: 'relative', overflow: 'hidden', minWidth: 0, minHeight: 0}}>
   {packet.sourceHash
    ? <PowerPointStaticPreview sourceHash={packet.sourceHash} slideId={packet.slide.sourceSlideId}/>
    : <SlideRenderer slide={packet.slide} mode="thumbnail"/>}
  </div>)}
 </div>;
}
