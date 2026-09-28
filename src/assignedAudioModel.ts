import type {BackgroundAudioConfig} from './store';
export function removeAssignedTrack(config:BackgroundAudioConfig,assetId:string):BackgroundAudioConfig|undefined{const tracks=config.tracks.filter(track=>track.assetId!==assetId);return tracks.length?{...config,tracks}:undefined}
