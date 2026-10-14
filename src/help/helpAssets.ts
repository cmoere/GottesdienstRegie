const screenshots:Record<string,string>={
  'Preflight':'test-preparation.png','ON AIR':'test-preparation.png',
  'Pre-Service & Post-Service':'postprogram.png',
  'Einstellungen':'banner-settings.png','Audioausgänge':'audio-settings.png','Routing-Probleme':'audio-settings.png',
  'Medien':'media-library.png','Cloud-Medien':'media-library.png','Unsplash':'media-library.png','Videos':'media-library.png','Audio Browser':'media-library.png','Background Audio':'audio-settings.png',
  'Erste Schritte':'operator-workspace.png','Benutzeroberfläche':'operator-workspace.png','Ablauf':'operator-workspace.png','Vorschau':'operator-workspace.png','Veranstaltung verknüpfen':'operator-workspace.png','Inhalte hinzufügen':'operator-workspace.png',
  'Timer':'countdown-library.png','Loop-Elemente':'meldungen.png','Bibel':'osb-settings.png',
};
export function helpScreenshot(id:string):string|undefined{return screenshots[id]}
export const currentHelpImages=[...new Set(Object.values(screenshots))];
