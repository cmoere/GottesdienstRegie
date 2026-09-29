import type {BackgroundAudioState} from './BackgroundAudioEngine';
import type {ServiceItem} from './store';

export const NOW_PLAYING_DESIGNS=['cover-left','cover-hero','minimal','vinyl','radio','gradient','typography','stage','split-card','neon'] as const;
export type NowPlayingDesign=typeof NOW_PLAYING_DESIGNS[number];
export const NOW_PLAYING_DESIGN_LABELS:Record<NowPlayingDesign,string>={'cover-left':'Cover links','cover-hero':'Cover groß',minimal:'Minimal',vinyl:'Vinyl',radio:'Radio',gradient:'Verlauf',typography:'Typografie',stage:'Bühne','split-card':'Split Card',neon:'Neon'};
export type NowPlayingTextCase='normal'|'uppercase'|'lowercase';
export type NowPlayingVisualizerPosition='top-left'|'top-right'|'bottom-left'|'bottom-right';
export type NowPlayingVisualizerStyle='bars'|'wave'|'dots'|'ring';
export interface NowPlayingPresentationSettings{design:NowPlayingDesign;showArtwork:boolean;showAlbum:boolean;showTitle:boolean;showArtist:boolean;skipWhenIdle:boolean;textCase:NowPlayingTextCase;backgroundColor:string;accentColor:string;textColor:string;visualizerPosition:NowPlayingVisualizerPosition;visualizerStyle:NowPlayingVisualizerStyle;durationSeconds:number}
const defaults:NowPlayingPresentationSettings={design:'cover-left',showArtwork:true,showAlbum:true,showTitle:true,showArtist:true,skipWhenIdle:true,textCase:'normal',backgroundColor:'#0d2a33',accentColor:'#73d6e0',textColor:'#ffffff',visualizerPosition:'bottom-right',visualizerStyle:'bars',durationSeconds:15};
const hex=(value:unknown,fallback:string)=>/^#[0-9a-f]{6}$/i.test(String(value??''))?String(value).toLowerCase():fallback;
export function normalizeNowPlayingSettings(value:Record<string,unknown>):NowPlayingPresentationSettings{
  const design=NOW_PLAYING_DESIGNS.includes(value.design as NowPlayingDesign)?value.design as NowPlayingDesign:defaults.design;
  const textCase=['normal','uppercase','lowercase'].includes(String(value.textCase))?value.textCase as NowPlayingTextCase:defaults.textCase;
  const visualizerPosition=['top-left','top-right','bottom-left','bottom-right'].includes(String(value.visualizerPosition))?value.visualizerPosition as NowPlayingVisualizerPosition:defaults.visualizerPosition;
  const visualizerStyle=['bars','wave','dots','ring'].includes(String(value.visualizerStyle))?value.visualizerStyle as NowPlayingVisualizerStyle:defaults.visualizerStyle;
  const duration=Number(value.durationSeconds??(Number(value.durationMs)>0?Number(value.durationMs)/1000:defaults.durationSeconds));
  return{design,showArtwork:value.showArtwork!==false,showAlbum:value.showAlbum!==false,showTitle:value.showTitle!==false,showArtist:value.showArtist!==false,skipWhenIdle:value.skipWhenIdle!==false,textCase,backgroundColor:hex(value.backgroundColor,defaults.backgroundColor),accentColor:hex(value.accentColor,defaults.accentColor),textColor:hex(value.textColor,defaults.textColor),visualizerPosition,visualizerStyle,durationSeconds:Math.max(1,Math.round(Number.isFinite(duration)?duration:defaults.durationSeconds))};
}
export function nowPlayingSettingsPatch(settings:NowPlayingPresentationSettings):Record<string,string|number|boolean>{return{...settings}}
export type NowPlayingDisplay={active:boolean;title:string;artist:string;album:string;artworkUrl:string;source:string};
let latest:Partial<BackgroundAudioState>={active:false};
export function setNowPlayingState(state:Partial<BackgroundAudioState>){latest=state}
export function getNowPlayingState(){return latest}
export function nowPlayingDisplay(state:Partial<BackgroundAudioState>=latest):NowPlayingDisplay{const track=state.track;return{active:Boolean(state.active&&track),title:track?.name??'',artist:track?.artist??'',album:track?.album??'',artworkUrl:String((track as any)?.imageUrl??''),source:track?.format??''}}
export function shouldSkipNowPlaying(item:Pick<ServiceItem,'type'|'metadata'>,state:Partial<BackgroundAudioState>=latest){return item.type==='nowPlaying'&&normalizeNowPlayingSettings(item.metadata).skipWhenIdle&&!nowPlayingDisplay(state).active}
export function isLoopCandidateAvailable(item:Pick<ServiceItem,'type'|'metadata'|'enabled'|'disabled'>|null|undefined,state:Partial<BackgroundAudioState>=latest){return Boolean(item&&item.enabled!==false&&item.disabled!==true&&!shouldSkipNowPlaying(item,state))}
