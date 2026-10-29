import {useI18n} from "../i18n";
export function SpotifySettings(){
 const {tx}=useI18n();return <section className="settings-group spotify-settings"><h4>SPOTIFY</h4><p>{tx("Spotify-Titel werden im Audiobrowser über ihren Link hinzugefügt und anschließend manuell in Spotify geöffnet.")}</p></section>}
