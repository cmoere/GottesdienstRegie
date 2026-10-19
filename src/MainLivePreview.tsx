import type { ReactNode } from 'react';
import {TestModeWatermark} from './TestModeWatermark';
import {OutputComposition} from './OutputComposition';
import {useAnnouncementBanner} from './AnnouncementBannerController';
import {useI18n} from './i18n';

export function MainLivePreview({ title, children }: { title: string; children: ReactNode }) {
  const banner=useAnnouncementBanner(state=>state.banner);
  const {t}=useI18n();
  return <section className="live-slide-panel">
    <h2>{t('livePreviewHeading')}</h2>
    <div style={{position:'relative',containerType:'size'}}><OutputComposition banner={banner} testOverlay={<TestModeWatermark role="main"/>}>{children}</OutputComposition></div>
    <p>{title}</p>
  </section>;
}
