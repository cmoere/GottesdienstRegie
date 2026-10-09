import {create} from 'zustand';
import type {Slide} from './store';
import type {PostProgramRoomNoticeSnapshot} from './community/PostProgramRoomNoticeService';

// Runtime-only mirror of the snapshot sent to MAIN; never persisted in a slide.
export type LiveOutputSlide=Slide&{postProgramRoomNotice?:PostProgramRoomNoticeSnapshot};
export const useLiveOutputPreview=create<{slide:LiveOutputSlide|null}>(()=>({slide:null}));
