/** Operator chrome only. These labels never replace presentation/output text. */
export const operatorShellGermanTemplates={
  operatorAddElement:'Element hinzufügen',
  operatorSongLibrary:'Songbibliothek',
  operatorTestStart:'Testbetrieb starten',
  operatorTestEnd:'Testbetrieb beenden',
  operatorTestHint:'MAIN und STAGE ohne Veranstaltung testen. Echte Bild- und Tonausgabe nach Bestätigung.',
  operatorLinkEventFirst:'Bitte zuerst eine Veranstaltung verknüpfen',
  operatorSaving:'Wird gespeichert …',
  operatorSaveError:'Speicherfehler',
  operatorSaved:'Gespeichert ✓',
} as const;
export const operatorShellEnglishTemplates:Record<keyof typeof operatorShellGermanTemplates,string>={
  operatorAddElement:'Add element',operatorSongLibrary:'Song library',operatorTestStart:'Start test mode',operatorTestEnd:'End test mode',
  operatorTestHint:'Test MAIN and STAGE without linking an event. Real picture and sound output starts after confirmation.',
  operatorLinkEventFirst:'Please link an event first',operatorSaving:'Saving …',operatorSaveError:'Save error',operatorSaved:'Saved ✓',
};
