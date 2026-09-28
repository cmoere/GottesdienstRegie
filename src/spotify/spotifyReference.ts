import type {SpotifyTrackReference} from './types';

const text=(value:unknown)=>typeof value==='string'?value.trim():'';
export function sanitizeSpotifyReference(input:unknown):SpotifyTrackReference{
  const value=input&&typeof input==='object'?input as Record<string,unknown>:{};
  const id=text(value.id),title=text(value.title),externalUrl=text(value.externalUrl),uri=text(value.uri);
  let parsed:URL;try{parsed=new URL(externalUrl)}catch{throw new Error('INVALID_SPOTIFY_REFERENCE')}
  if(!id||!title||parsed.protocol!=='https:'||parsed.hostname!=='open.spotify.com'||parsed.pathname!==`/track/${id}`||uri!==`spotify:track:${id}`)throw new Error('INVALID_SPOTIFY_REFERENCE');
  const artists=Array.isArray(value.artists)?value.artists.map(text).filter(Boolean).slice(0,20):[];
  const result:SpotifyTrackReference={provider:'spotify',id,title,artists,externalUrl,uri};
  const album=text(value.album),imageUrl=text(value.imageUrl),durationMs=Number(value.durationMs);
  if(album)result.album=album;if(imageUrl&&/^https:\/\//.test(imageUrl))result.imageUrl=imageUrl;if(Number.isFinite(durationMs)&&durationMs>=0)result.durationMs=Math.round(durationMs);
  return result;
}
