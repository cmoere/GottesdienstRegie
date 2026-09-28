export interface SpotifyTrackReference{provider:'spotify';id:string;title:string;artists:string[];album?:string;durationMs?:number;imageUrl?:string;externalUrl:string;uri:string}
export interface SpotifyConnectionStatus{state:'disconnected'|'connecting'|'connected'|'error';displayName?:string;message?:string}
export interface SpotifySearchPage{items:SpotifyTrackReference[];nextOffset?:number;total:number}
