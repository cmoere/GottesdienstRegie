import { describe, expect, it } from 'vitest';
import { normalizeGermanRegion, regionalVariants } from '../../shared/regional/catalog';

describe('German regional interface variants', () => {
  it('provides the approved 31 identifiable choices, including the Bielefeld variant', () => {
    expect(regionalVariants.map(region => region.name)).toEqual([
      'Bayerisch – Oberbayern', 'Niederbayerisch', 'Oberpfälzisch', 'Ostfränkisch',
      'Schwäbisch', 'Badisch – alemannisch geprägt', 'Südbadisch – hochalemannisch geprägt',
      'Pfälzisch', 'Rheinhessisch', 'Südhessisch', 'Mittelhessisch', 'Nordhessisch',
      'Moselfränkisch – Trierer Raum', 'Saarländisch – Saarbrücker Raum', 'Kölsch',
      'Öcher Platt – Aachen', 'Niederrheinisch', 'Ruhrdeutsch', 'Siegerländer Platt',
      'Wittgensteiner Platt', 'Münsterländer Platt', 'Sauerländer Platt', 'Lippisches Platt',
      'Ostfriesisches Platt', 'Hamburger Platt', 'Schleswig-Holsteiner Platt',
      'Mecklenburgisches Platt', 'Berlinerisch', 'Thüringisch', 'Obersächsisch',
      'Bielefelder Variante – Ravensberger Platt',
    ]);
    expect(new Set(regionalVariants.map(region => region.id)).size).toBe(31);
    for (const region of regionalVariants) {
      expect(region.id).toMatch(/^[a-z]+(?:-[a-z]+)*$/);
      expect(normalizeGermanRegion(region.id)).toBe(region.id);
    }
    expect(normalizeGermanRegion('bielefeld-ravensberg')).toBe('bielefeld-ravensberg');
  });

  it.each([null, undefined, '', 'de', 'gsw', 'de-DE', 'constructor', '__proto__',
    'Bielefeld', 'BIELEFELD-RAVENSBERG', ' bielefeld-ravensberg', 31, {}, [], true])(
    'keeps unknown or malformed stored selection %j on Hochdeutsch', value => {
      expect(normalizeGermanRegion(value)).toBeNull();
    },
  );
});
