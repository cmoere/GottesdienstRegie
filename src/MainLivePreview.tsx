import type { ReactNode } from 'react';
import {TestModeWatermark} from './TestModeWatermark';
import {OutputComposition} from './OutputComposition';
import {useAnnouncementBanner} from './AnnouncementBannerController';
import {useI18n} from './i18n';
import {useLiveOutputPreview} from './liveOutputPreview';

export function MainLivePreview({ title, children,hideCountdown=false }: { title: string; children: ReactNode;hideCountdown?:boolean }) {
  const banner=useAnnouncementBanner(state=>state.banner);
  const serviceCountdownAtMs=useLiveOutputPreview(state=>state.slide?._serviceCountdownAtMs);
  const {t}=useI18n();
  return <section className="live-slide-panel">
    <h2>{t('livePreviewHeading')}</h2>
    <div style={{position:'relative',containerType:'size'}}><OutputComposition hideCountdown={hideCountdown} serviceCountdownAtMs={serviceCountdownAtMs} banner={banner} testOverlay={<TestModeWatermark role="main"/>}>{children}</OutputComposition></div>
    <p>{title}</p>
  </section>;
}
