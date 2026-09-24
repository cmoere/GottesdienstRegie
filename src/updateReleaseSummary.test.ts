import {describe,expect,it} from 'vitest';
import {conciseRemoteSummary} from './updateReleaseSummary';

describe('conciseRemoteSummary',()=>{
  it('schneidet einen langen vollständigen Absatz nicht nach 220 Zeichen ab',()=>{
    const ending='Dieser letzte Satz muss vollständig sichtbar bleiben.';
    const notes=`# GottesdienstRegie 0.47.0\n\n${'Ausführliche Versionsinformation '.repeat(10)}${ending}`;
    const summary=conciseRemoteSummary(notes);
    expect(summary.length).toBeGreaterThan(220);
    expect(summary).toContain(ending);
  });

  it('bereitet auch HTML-Versionshinweise vollständig als lesbaren Text auf',()=>{
    const ending='Auch der Abschluss des zweiten Absatzes bleibt sichtbar.';
    const notes=`<h1>GottesdienstRegie 0.47.0</h1><p>${'Ausführliche Verbesserung '.repeat(12)}</p><p>${ending}</p>`;
    const summary=conciseRemoteSummary(notes);
    expect(summary).toContain(ending);
    expect(summary).not.toContain('<p>');
  });
});
