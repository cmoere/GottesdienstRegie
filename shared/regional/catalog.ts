/** Internal UI variant IDs, deliberately not advertised as BCP-47 language codes. */
export const regionalVariants = [
  { id: 'bavarian-upper', name: 'Bayerisch – Oberbayern' },
  { id: 'bavarian-lower', name: 'Niederbayerisch' },
  { id: 'upper-palatinate', name: 'Oberpfälzisch' },
  { id: 'east-franconian', name: 'Ostfränkisch' },
  { id: 'swabian', name: 'Schwäbisch' },
  { id: 'baden-alemannic', name: 'Badisch – alemannisch geprägt' },
  { id: 'south-baden-alemannic', name: 'Südbadisch – hochalemannisch geprägt' },
  { id: 'palatine', name: 'Pfälzisch' },
  { id: 'rhine-hessian', name: 'Rheinhessisch' },
  { id: 'south-hessian', name: 'Südhessisch' },
  { id: 'central-hessian', name: 'Mittelhessisch' },
  { id: 'north-hessian', name: 'Nordhessisch' },
  { id: 'moselle-trier', name: 'Moselfränkisch – Trierer Raum' },
  { id: 'saarbruecken', name: 'Saarländisch – Saarbrücker Raum' },
  { id: 'cologne', name: 'Kölsch' },
  { id: 'aachen', name: 'Öcher Platt – Aachen' },
  { id: 'lower-rhine', name: 'Niederrheinisch' },
  { id: 'ruhr', name: 'Ruhrdeutsch' },
  { id: 'siegerland', name: 'Siegerländer Platt' },
  { id: 'wittgenstein', name: 'Wittgensteiner Platt' },
  { id: 'muensterland', name: 'Münsterländer Platt' },
  { id: 'sauerland', name: 'Sauerländer Platt' },
  { id: 'lippe', name: 'Lippisches Platt' },
  { id: 'east-frisian', name: 'Ostfriesisches Platt' },
  { id: 'hamburg', name: 'Hamburger Platt' },
  { id: 'schleswig-holstein', name: 'Schleswig-Holsteiner Platt' },
  { id: 'mecklenburg', name: 'Mecklenburgisches Platt' },
  { id: 'berlin', name: 'Berlinerisch' },
  { id: 'thuringian', name: 'Thüringisch' },
  { id: 'upper-saxon', name: 'Obersächsisch' },
  { id: 'bielefeld-ravensberg', name: 'Bielefelder Variante – Ravensberger Platt' },
] as const;

export type GermanRegionId = typeof regionalVariants[number]['id'];
/** Older disclosed partial editions exposed15 variants; v95 targets the full31.
 * Actual availability still requires a validated completion manifest. */
const legacyReleaseRegionIds:ReadonlySet<GermanRegionId>=new Set(["bavarian-upper","bavarian-lower","upper-palatinate","east-franconian","swabian","baden-alemannic","south-baden-alemannic","palatine","rhine-hessian","south-hessian","cologne","ruhr","hamburg","berlin","bielefeld-ravensberg"]);
export const legacyReleaseRegionalVariants=regionalVariants.filter(region=>legacyReleaseRegionIds.has(region.id));
const releaseRegionIds:ReadonlySet<GermanRegionId>=new Set(regionalVariants.map(region=>region.id));
export const releaseRegionalVariants=regionalVariants.filter(region=>releaseRegionIds.has(region.id));

/** Normalize stable IDs. The selector's manifest governs which are available. */
export function normalizeReleasedGermanRegion(value:unknown):GermanRegionId|null{
  const id=normalizeGermanRegion(value);
  return id&&releaseRegionIds.has(id)?id:null;
}
export interface RegionalSelection { language: string; germanRegion: GermanRegionId | null }
export interface RegionalPack {
  id: GermanRegionId;
  ui: Record<string, string>;
  native: Record<string, string>;
}

const ids: ReadonlySet<string> = new Set(regionalVariants.map(region => region.id));

/** Invalid persisted values must never turn into object property access or locale tags. */
export function normalizeGermanRegion(value: unknown): GermanRegionId | null {
  return typeof value === 'string' && ids.has(value) ? value as GermanRegionId : null;
}
