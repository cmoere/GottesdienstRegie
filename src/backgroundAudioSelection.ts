import type {BackgroundAudioTrack} from './store';

/** Keep ordinary tracks and their order; a station owns the first radio slot. */
export function replaceRadioTrack(tracks:readonly BackgroundAudioTrack[],selected:BackgroundAudioTrack):BackgroundAudioTrack[]{
 const next:BackgroundAudioTrack[]=[];let inserted=false;
 for(const track of tracks){
  if(track.assetId.startsWith('radio:')){if(!inserted){next.push(selected);inserted=true}}
  else next.push(track);
 }
 if(!inserted)next.push(selected);
 return next;
}
