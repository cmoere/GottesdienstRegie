import type { GermanRegionId } from './catalog';

export interface RegionalBaseTemplates {
  ui: Readonly<Record<string,string>>;
  native: Readonly<Record<string,string>>;
}
export interface RegionalResourceIssue {
  code: 'wrong-id' | 'invalid-object' | 'missing-key' | 'unexpected-key' | 'empty-text' | 'placeholder-mismatch';
  path: string;
}

const record = (value:unknown): value is Record<string,unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (value:object,key:string) => Object.prototype.hasOwnProperty.call(value,key);
const placeholders = (text:string) => [...text.matchAll(/\{([A-Za-z_][\w.-]*)\}/g)]
  .map(match=>match[1]).sort().join('\0');

/** Completeness is a build-time gate; runtime fallback is not proof of a translated pack. */
export function validateRegionalPack(
  candidate:unknown, expectedId:GermanRegionId, base:RegionalBaseTemplates,
):RegionalResourceIssue[] {
  if (!record(candidate)) return [{code:'invalid-object',path:'pack'}];
  const issues:RegionalResourceIssue[] = [];
  if (!own(candidate,'id') || candidate.id !== expectedId) issues.push({code:'wrong-id',path:'id'});
  for (const key of Object.keys(candidate)) {
    if (!['id','ui','native'].includes(key)) issues.push({code:'unexpected-key',path:key});
  }
  for (const section of ['ui','native'] as const) {
    const entries=candidate[section];
    if (!own(candidate,section) || !record(entries)) {
      issues.push({code:'invalid-object',path:section});
      continue;
    }
    for (const [key,source] of Object.entries(base[section])) {
      const path=`${section}.${key}`;
      if (!own(entries,key)) { issues.push({code:'missing-key',path}); continue; }
      const value=entries[key];
      if (typeof value !== 'string' || !value.trim()) { issues.push({code:'empty-text',path}); continue; }
      if (placeholders(value)!==placeholders(source)) issues.push({code:'placeholder-mismatch',path});
    }
    for (const key of Object.keys(entries)) {
      if (!own(base[section],key)) issues.push({code:'unexpected-key',path:`${section}.${key}`});
    }
  }
  return issues;
}

/** Single pass: replacement values cannot introduce new placeholders for later substitution. */
export function formatRegionalTemplate(template:string, values:Record<string,string|number> = {}):string {
  return template.replace(/\{([A-Za-z_][\w.-]*)\}/g,(original,key:string)=>
    own(values,key) ? String(values[key]) : original);
}
