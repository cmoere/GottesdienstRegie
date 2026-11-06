import {ScreenSharingMirror} from './ScreenSharing';
import type { ReactNode } from 'react';
import {TestModeWatermark} from './TestModeWatermark';
import {OutputComposition} from './OutputComposition';
import {useAnnouncementBanner} from './AnnouncementBannerController';
import {useI18n} from './i18n';
import {useLiveOutputPreview} from './liveOutputPreview';
import{useWeatherWarnings}from'./weatherWarnings/controller';
import {PowerPointPlaybackStatus} from './PowerPointPlaybackPanel';
import {OutputTimingPanel} from './OutputTimingPanel';

export function MainLivePreview({ title, children,hideCountdown=false,suppressWeatherWarnings=false,suppressSectionInfo=false }: { title: string; children: ReactNode;hideCountdown?:boolean;suppressWeatherWarnings?:boolean;suppressSectionInfo?:boolean }) {
  const banner=useAnnouncementBanner(state=>state.banner);
  const warnings=useWeatherWarnings(state=>state.state);
  const serviceCountdownAtMs=useLiveOutputPreview(state=>state.slide?._serviceCountdownAtMs);
  const info=useLiveOutputPreview(state=>state.slide?.sectionInfo);
  const {t}=useI18n();
  return <section className="live-slide-panel">
    <h2>{t('livePreviewHeading')}</h2>
    <div style={{position:'relative',containerType:'size'}}><OutputComposition sectionInfo={suppressSectionInfo?undefined:info} weatherWarnings={suppressWeatherWarnings?null:warnings} hideCountdown={hideCountdown} serviceCountdownAtMs={serviceCountdownAtMs} banner={banner} testOverlay={<TestModeWatermark role="main"/>}>{children}<ScreenSharingMirror hidden={hideCountdown}/></OutputComposition></div>
    <p>{title}</p>
    <PowerPointPlaybackStatus/>
    <OutputTimingPanel/>
  </section>;
}
