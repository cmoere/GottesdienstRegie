import {create} from 'zustand';
import type {Slide} from './store';
import type {PostProgramRoomNoticeSnapshot} from './community/PostProgramRoomNoticeService';
import type {LyricScrollPacket} from './lyricScrolling';
import type {BannerContext} from './announcementBannerModel';

// Runtime-only mirror of the snapshot sent to MAIN; never persisted in a slide.
export type LiveOutputSlide=Slide&{postProgramRoomNotice?:PostProgramRoomNoticeSnapshot;lyricScroll?:LyricScrollPacket;bannerContext?:Pick<BannerContext,'liveSection'|'countdownActive'>;_countdownStartedAtMs?:number};
export const useLiveOutputPreview=create<{slide:LiveOutputSlide|null}>(()=>({slide:null}));
