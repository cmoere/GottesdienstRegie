/** Radio-browser operator controls; never station, stream or audience metadata. */
export const radioControlGermanTemplates={
 radioBrowserHeading:'Radiosender',radioBrowserIntro:'Sender suchen, anhören und als Hintergrundaudio hinzufügen.',
 radioBrowserQuery:'Sender, Ort oder Musikrichtung',radioBrowserClear:'Suchtext löschen',radioBrowserSearch:'Suchen',radioBrowserSearching:'Suchen …',
 radioBrowserEmpty:'Keine passenden, erreichbaren HTTPS-Radiosender gefunden.',
 radioBrowserSearchFailed:'Radiosuche fehlgeschlagen: {detail}. Bitte erneut versuchen.',radioBrowserPlay:'{station} abspielen',
 radioBrowserAdd:'Hinzufügen',radioBrowserMore:'Mehr laden',radioBrowserLess:'Weniger anzeigen',radioBrowserLoading:'Wird geladen',
 radioBrowserPlaybackFailed:'Wiedergabe nicht möglich',radioBrowserNowLive:'Jetzt live',
} as const;
export const radioControlEnglishTemplates:Record<keyof typeof radioControlGermanTemplates,string>={
 radioBrowserHeading:'Radio stations',radioBrowserIntro:'Find stations, listen and add them as background audio.',
 radioBrowserQuery:'Station, location or genre',radioBrowserClear:'Clear search text',radioBrowserSearch:'Search',radioBrowserSearching:'Searching …',
 radioBrowserEmpty:'No matching, reachable HTTPS radio stations found.',
 radioBrowserSearchFailed:'Radio search failed: {detail}. Please try again.',radioBrowserPlay:'Play {station}',
 radioBrowserAdd:'Add',radioBrowserMore:'Load more',radioBrowserLess:'Show less',radioBrowserLoading:'Loading',
 radioBrowserPlaybackFailed:'Playback unavailable',radioBrowserNowLive:'Live now',
};
