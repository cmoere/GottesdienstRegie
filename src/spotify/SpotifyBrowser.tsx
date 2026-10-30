import {useI18n} from "../i18n";
import {useState} from 'react';
import type {SpotifyTrackReference} from './types';

type Bridge={resolve:(url:string)=>Promise<SpotifyTrackReference>;open:(url:string)=>Promise<boolean>};
const getBridge=()=> (window.desktop as unknown as {spotify?:Bridge}|undefined)?.spotify;
const savedKey='gottesdienstregie.spotify.references';
export function SpotifyBrowser(){
 const {tx}=useI18n();
  const[url,setUrl]=useState(''),[track,setTrack]=useState<SpotifyTrackReference|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const resolve=async()=>{if(!url.trim()||!getBridge())return;setBusy(true);setError('');setTrack(null);try{setTrack(await getBridge()!.resolve(url.trim()))}catch{setError('Spotify-Titel konnte nicht geladen werden.')}finally{setBusy(false)}};
  const save=()=>{if(!track)return;let stored:SpotifyTrackReference[]=[];try{stored=JSON.parse(localStorage.getItem(savedKey)??'[]')}catch{stored=[]}localStorage.setItem(savedKey,JSON.stringify([track,...stored.filter(item=>item.id!==track.id)].slice(0,100)))};
  return <section className="spotify-browser"><header><div><b>Spotify</b><small>{tx("Füge einen Spotify-Titellink ein und speichere ihn als Verknüpfung.")}</small></div><label><span>{tx("Spotify-Titellink")}</span><input aria-label={tx("Spotify-Titellink")} value={url} placeholder="https://open.spotify.com/track/…" onChange={event=>setUrl(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();void resolve()}}}/><button disabled={busy||!url.trim()} onClick={()=>void resolve()}>{busy?tx("WIRD GELADEN …"):tx("Titel laden")}</button></label></header>{error&&<div className="notice">{tx(error)} <button onClick={()=>void resolve()}>{tx("Erneut versuchen")}</button></div>}{track&&<div className="spotify-results"><article>{track.imageUrl?<img src={track.imageUrl} alt=""/>:<span/>}<div><b>{track.title}</b><small>{tx("Spotify-Verknüpfung")}</small></div><button onClick={save}>{tx("Verknüpfung speichern")}</button><button onClick={()=>void getBridge()?.open(track.externalUrl)}>{tx("In Spotify öffnen")}</button></article></div>}</section>;
}
