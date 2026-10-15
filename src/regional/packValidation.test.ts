import { describe, expect, it } from 'vitest';
import { formatRegionalTemplate, validateRegionalPack } from '../../shared/regional/validation';

const base = { ui:{update:'Version {version} ist bereit.',close:'Schließen'}, native:{error:'Fehler: {detail}'} };
const valid = { id:'ruhr',ui:{update:'Version {version} is bereit.',close:'Zumachen'},native:{error:'Fehler: {detail}'} };

describe('regional resource safety and completeness', () => {
  it('accepts a complete regional pack with the same interpolation contract', () => {
    expect(validateRegionalPack(valid, 'ruhr', base)).toEqual([]);
  });

  it('reports a missing key even when a German fallback could supply it', () => {
    expect(validateRegionalPack({...valid,ui:{close:'Zumachen'}}, 'ruhr', base))
      .toContainEqual({code:'missing-key',path:'ui.update'});
  });

  it('rejects a pack for another region, empty text and unexpected fields', () => {
    const issues = validateRegionalPack({...valid,id:'berlin',extra:true,ui:{update:' ',close:'Zumachen',unknown:'Text'}},'ruhr',base);
    expect(issues).toEqual(expect.arrayContaining([
      {code:'wrong-id',path:'id'}, {code:'unexpected-key',path:'extra'},
      {code:'empty-text',path:'ui.update'}, {code:'unexpected-key',path:'ui.unknown'},
    ]));
  });

  it('detects missing or added placeholders including repetition', () => {
    const expected = {ui:{text:'{name}: {name} ({version})'},native:{}};
    expect(validateRegionalPack({id:'ruhr',ui:{text:'{name} ({other})'},native:{}},'ruhr',expected))
      .toContainEqual({code:'placeholder-mismatch',path:'ui.text'});
  });

  it('does not accept inherited values as translated keys or malformed catalog objects', () => {
    const inherited = Object.create({update:'Version {version} is bereit.'});
    inherited.close='Zumachen';
    expect(validateRegionalPack({...valid,ui:inherited},'ruhr',base))
      .toContainEqual({code:'missing-key',path:'ui.update'});
    for (const pack of [null,[],true,'pack']) {
      expect(validateRegionalPack(pack,'ruhr',base)).toContainEqual({code:'invalid-object',path:'pack'});
    }
    expect(validateRegionalPack({...valid,native:[]},'ruhr',base))
      .toContainEqual({code:'invalid-object',path:'native'});
  });
});

describe('regional template interpolation', () => {
  it('substitutes only original placeholders and treats user content as opaque data', () => {
    expect(formatRegionalTemplate('{name}: {detail} / {name}', {
      name:'{detail}',detail:'https://example.test/?q=$& / -room-id / <Gott>',
    })).toBe('{detail}: https://example.test/?q=$& / -room-id / <Gott> / {detail}');
  });

  it('preserves missing placeholders and formats zero rather than losing it', () => {
    expect(formatRegionalTemplate('{count} · {missing}',{count:0})).toBe('0 · {missing}');
  });

  it('does not consume inherited or object-prototype values', () => {
    expect(formatRegionalTemplate('{constructor} {name}',Object.create({name:'hidden'})))
      .toBe('{constructor} {name}');
  });
});
