import type {BackgroundAudioState} from './BackgroundAudioEngine';
import type {ServiceItem} from './store';

export const NOW_PLAYING_DESIGNS=['cover-left','cover-hero','minimal','vinyl','radio','gradient','typography','stage','split-card','neon'] as const;
export type NowPlayingDesign=typeof NOW_PLAYING_DESIGNS[number];
export const NOW_PLAYING_DESIGN_LABELS:Record<NowPlayingDesign,string>={'cover-left':'Cover links','cover-hero':'Cover groß',minimal:'Minimal',vinyl:'Vinyl',radio:'Radio',gradient:'Verlauf',typography:'Typografie',stage:'Bühne','split-card':'Split Card',neon:'Neon'};
export type NowPlayingDisplay={active:boolean;title:string;artist:string;album:string;artworkUrl:string;source:string};
let latest:Partial<BackgroundAudioState>={active:false};
export function setNowPlayingState(state:Partial<BackgroundAudioState>){latest=state}
export function getNowPlayingState(){return latest}
export function nowPlayingDisplay(state:Partial<BackgroundAudioState>=latest):NowPlayingDisplay{const track=state.track;return{active:Boolean(state.active&&track),title:track?.name??'',artist:track?.artist??'',album:track?.album??'',artworkUrl:String((track as any)?.imageUrl??''),source:track?.format??''}}
export function shouldSkipNowPlaying(item:Pick<ServiceItem,'type'|'metadata'>,state:Partial<BackgroundAudioState>=latest){return item.type==='nowPlaying'&&item.metadata.skipWhenIdle!==false&&!nowPlayingDisplay(state).active}
