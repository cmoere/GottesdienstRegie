export type AiQuickActionId = 'service-plan'|'rewrite'|'announcements'|'bible-song'|'audit'|'translate'|'media'|'headings'|'moderation'|'prayers'|'unify-style';

export const AI_QUICK_ACTIONS: ReadonlyArray<{ id: AiQuickActionId; label: string; purpose: string }> = [
  { id:'service-plan', label:'Ablauf entwerfen', purpose:'Entwirf einen vollständigen, zeitlich plausiblen Gottesdienstablauf.' },
  { id:'rewrite', label:'Folie kürzen', purpose:'Kürze und verbessere den Text, ohne seine Aussage zu verändern.' },
  { id:'announcements', label:'Ankündigungen', purpose:'Erstelle klare, gut lesbare Ankündigungsfolien.' },
  { id:'bible-song', label:'Bibel & Songs', purpose:'Schlage thematisch passende Bibelstellen und Songs vor. Zitiere keinen erfundenen Bibeltext.' },
  { id:'audit', label:'Präsentation prüfen', purpose:'Prüfe Ablauf, Lesbarkeit, Rechtschreibung, Kontrast und Zeitplanung.' },
  { id:'translate', label:'Übersetzen', purpose:'Bereite eine sinngenaue Übersetzung vor.' },
  { id:'media', label:'Medien finden', purpose:'Schlage ausschließlich passende Medien aus der vorhandenen Bibliothek vor.' },
  { id:'headings', label:'Überschriften', purpose:'Formuliere kurze, einheitliche Überschriften.' },
  { id:'moderation', label:'Moderation', purpose:'Formuliere verbindende Moderationstexte für den Ablauf.' },
  { id:'prayers', label:'Gebete', purpose:'Entwirf respektvolle, zum Thema passende Gebetstexte.' },
  { id:'unify-style', label:'Stil vereinheitlichen', purpose:'Vereinheitliche Tonalität und Schreibstil der Präsentation.' },
] as const;

const languageNames: Record<string,string> = { de:'Deutsch', en:'Englisch', fr:'Französisch', es:'Spanisch', it:'Italienisch' };
export function buildAssistantPrompt(id: AiQuickActionId, options: { scope:'selected-slide'|'presentation'; language:string; allowMediaSuggestions:boolean; allowTranslations:boolean }) {
  const action = AI_QUICK_ACTIONS.find(item => item.id === id);
  if (!action) throw new Error('UNKNOWN_AI_QUICK_ACTION');
  const scope = options.scope === 'selected-slide' ? 'die ausgewählte Folie' : 'die gesamte Präsentation';
  return [
    action.purpose,
    `Arbeitsbereich: ${scope}.`,
    `Antwortsprache: ${languageNames[options.language] ?? options.language}.`,
    'Antworte ausschließlich als JSON gemäß dem freigegebenen GottesdienstRegie-Antwortschema.',
    options.allowMediaSuggestions ? 'Medienvorschläge sind erlaubt, aber nur mit vorhandenen Medien-IDs.' : 'Medienvorschläge sind deaktiviert.',
    options.allowTranslations ? 'Übersetzungsvorschläge sind erlaubt.' : 'Übersetzungen sind deaktiviert.',
    'Ändere nichts außerhalb des genannten Arbeitsbereichs und führe keine externen Aktionen aus.'
  ].join('\n');
}
