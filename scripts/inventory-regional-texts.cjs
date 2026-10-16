/** Read-only AST inventory. It does not rewrite or translate source/user content. */
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const dictionaryNames = new Set(['en','nl','da','no','sv','fi','fr','it','es','uk','ru','tr','ar','pl','ptBR','gsw']);
const technicalAttributes = new Set(['className','id','key','ref','type','name','value','src','href','role','style','target','rel','data-testid']);
const visibleAttributes = new Set(['title','placeholder','aria-label','alt','label']);

function applyReviewedTechnicalFile(rows,filename,source,reviews){
  const review=reviews[filename];
  const digest=createHash('sha256').update(source.replace(/\r\n/g,'\n')).digest('hex');
  if(!review||review.sha256!==digest||typeof review.reason!=='string'||!review.reason.trim())return rows;
  return rows.map(row=>({...row,status:'excluded',exclusionReason:review.reason,technicalReviewHash:review.sha256}));
}

/** A mixed file needs entry-level review: never hide its neighboring operator copy. */
function applyReviewedSourceEntries(rows,reviews={}){
  return rows.map(row=>{
    if(row.status!=='review-required'||!row.key.startsWith('source.')||!Object.hasOwn(reviews,row.key))return row;
    const review=reviews[row.key];
    if(!review||review.source!==row.source||review.context!==row.context||review.text!==row.text
      ||typeof review.reason!=='string'||!review.reason.trim())return row;
    const technicalReviewHash=createHash('sha256').update(JSON.stringify({key:row.key,source:row.source,context:row.context,text:row.text})).digest('hex');
    return {...row,status:'excluded',exclusionReason:review.reason,technicalReviewHash};
  });
}

function scanOperatorSource(filename, source) {
  const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true,
    filename.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const rows = [];
  const duplicates = new Map();
  function add(node, text, context, status = 'review-required', key) {
    text = text.replace(/\r\n/g, '\n').trim();
    if (!text || !/\p{L}/u.test(text)) return;
    const digest = createHash('sha256').update(`${filename}\0${context}\0${text}`).digest('hex').slice(0, 20);
    const ordinal = (duplicates.get(digest) ?? 0) + 1;
    duplicates.set(digest, ordinal);
    rows.push({ key:key ?? `source.${digest}.${ordinal}`, text, source:filename,
      line:file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1, context, status });
  }
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && dictionaryNames.has(node.name.text)) return;
    if(ts.isPropertyAssignment(node)&&ts.isObjectLiteralExpression(node.parent)){
      const propertyName=node.name.getText(file).replace(/^['"]|['"]$/g,'');
      const hasGermanSibling=node.parent.properties.some(property=>ts.isPropertyAssignment(property)&&property.name.getText(file).replace(/^['"]|['"]$/g,'')==='de');
      if(hasGermanSibling&&(dictionaryNames.has(propertyName)||propertyName==='pt-BR'))return;
    }
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node) || ts.isTypeNode(node)) return;
    let initializer = ts.isVariableDeclaration(node) ? node.initializer : undefined;
    while (initializer && (ts.isAsExpression(initializer) || ts.isSatisfiesExpression(initializer) || ts.isParenthesizedExpression(initializer))) initializer = initializer.expression;
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === 'de' && initializer && ts.isObjectLiteralExpression(initializer)) {
      for (const property of initializer.properties) {
        if (ts.isPropertyAssignment(property) && ts.isStringLiteralLike(property.initializer)) {
          add(property.initializer, property.initializer.text, 'base-dictionary', 'app-owned', `ui.${property.name.getText(file).replace(/^['"]|['"]$/g,'')}`);
        }
      }
      return;
    }
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(file);
      if (technicalAttributes.has(name) || name.startsWith('data-')) return;
      if (visibleAttributes.has(name) && node.initializer && ts.isStringLiteralLike(node.initializer)) {
        add(node.initializer, node.initializer.text, `jsx-attribute:${name}`);
        return;
      }
    }
    if (ts.isJsxText(node)) {
      add(node, node.text.replace(/\s+/g, ' '), `jsx-text:${node.parent.openingElement?.tagName?.getText(file) ?? 'fragment'}`);
      return;
    }
    if (ts.isStringLiteralLike(node) || ts.isTemplateExpression(node)) {
      const parent = node.parent;
      if ((ts.isPropertyAssignment(parent) || ts.isPropertySignature(parent)) && parent.name === node) return;
      if (ts.isElementAccessExpression(parent) && parent.argumentExpression === node) return;
      if (ts.isCallExpression(parent) && parent.expression.getText(file) === 't') return;
      const text = ts.isTemplateExpression(node)
        ? node.head.text + node.templateSpans.map((span,index) => `{expression${index + 1}}${span.literal.text}`).join('')
        : node.text;
      if (/\s|[äöüÄÖÜß]/u.test(text) || /^[A-Z][a-z]+$/.test(text) || /^[A-ZÄÖÜ][A-ZÄÖÜ0-9_-]+$/.test(text)) {
        add(node, text, ts.isPropertyAssignment(parent) ? `property:${parent.name.getText(file)}` : ts.SyntaxKind[parent.kind]);
      }
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return rows;
}

function collectGermanResources(value, prefix = '') {
  if (!value || typeof value !== 'object') return [];
  if (typeof value.de === 'string') return [{key:prefix, text:value.de}];
  if (Array.isArray(value)) return value.flatMap((item,index) => {
    const identity = item && typeof item === 'object' ? item.version ?? item.line ?? item.id : null;
    return collectGermanResources(item, identity ? `${prefix}[${identity}]` : `${prefix}.${index}`);
  });
  return Object.entries(value).flatMap(([key,item]) => collectGermanResources(item, prefix ? `${prefix}.${key}` : key));
}

function inventorySourceFingerprint(entries){
  const source=entries.map(({key,text,source,context,technicalReviewHash})=>({key,text,source,context,technicalReviewHash}))
    .sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0);
  return createHash('sha256').update(JSON.stringify(source)).digest('hex');
}


function generateInventory(root) {
  const entries = [];
  const classification=JSON.parse(fs.readFileSync(path.join(root,'scripts/regional-source-classification.json'),'utf8'));
  const reviews=classification.reviewedTechnicalFiles;
  function walk(directory) {
    for (const name of fs.readdirSync(directory).sort()) {
      const absolute = path.join(directory,name);
      const relative = path.relative(root,absolute).replaceAll('\\','/');
      if (fs.statSync(absolute).isDirectory()) { walk(absolute); continue; }
      if (!/\.tsx?$/.test(name) || /\.(test|spec|d)\.tsx?$/.test(name) || relative.includes('/test/') || relative.startsWith('src/regional/')) continue;
      // Imported translated help is inventoried separately from application source.
      if (relative.startsWith('src/help/')) continue;
      const source=fs.readFileSync(absolute,'utf8');
      entries.push(...applyReviewedTechnicalFile(scanOperatorSource(relative,source),relative,source,reviews));
    }
  }
  walk(path.join(root,'src'));
  walk(path.join(root,'electron'));
  const releases = JSON.parse(fs.readFileSync(path.join(root,'public/releases.json'),'utf8'));
  for (const row of collectGermanResources(releases)) entries.push({ ...row, key:`release.${row.key}`,
    source:'public/releases.json', context:'release-history', status:'app-owned' });
  const {getGermanDocumentationSource,loadLocalDataModule}=require('./export-regional-corpus.cjs');
  const documentation=getGermanDocumentationSource(root);
  const {nativeBaseTemplates}=loadLocalDataModule(root,'shared/regional/nativeBase.ts');
  const {regionalControlBaseTemplates}=loadLocalDataModule(root,'shared/regional/interfaceBaseExtras.ts');
  for(const [key,text] of Object.entries(regionalControlBaseTemplates))entries.push({key:`ui.${key}`,text,
    source:'shared/regional/interfaceBaseExtras.ts',context:'regional-controls',status:'app-owned'});
  for(const [key,text] of Object.entries(nativeBaseTemplates))entries.push({key:`native.${key}`,text,
    source:'shared/regional/nativeBase.ts',context:'native-canonical',status:'app-owned'});
  const help = documentation.help;
  for (const [id,article] of Object.entries(help ?? {})) {
    for (const field of ['title','body']) if (typeof article[field] === 'string') {
      entries.push({ key:`help.${id}.${field}`, text:article[field], source:'src/help/base.ts',
        context:'help-assembled', status:'app-owned' });
    }
  }
  for(const [key,text] of Object.entries(documentation.helpUI))entries.push({key:`helpUI.${key}`,text,
    source:'src/help/base.ts',context:'help-ui',status:'app-owned'});
  const classifiedEntries=applyReviewedSourceEntries(entries,classification.reviewedSourceEntries);
  return { schemaVersion:1, complete:false,sourceFingerprint:inventorySourceFingerprint(classifiedEntries),
    note:'Candidate inventory: review-required entries and assembled help/native surfaces must be classified before release. No automatic text replacement.',
    preserveLiteral:['TESTBETRIEB','GottesdienstRegie','MAIN','LIVESTREAM','STAGE','ON AIR','OFF AIR'],
    excludedContent:['User-authored presentation content','Firebase raw records and public content','Bible and song text','Speech text','Third-party websites and operating-system-owned dialog chrome'],
    entries:classifiedEntries };
}

module.exports = { scanOperatorSource, collectGermanResources, generateInventory,applyReviewedTechnicalFile,applyReviewedSourceEntries,inventorySourceFingerprint };
if (require.main === module) {
  const root = path.resolve(__dirname,'..');
  const result = generateInventory(root);
  const target = path.join(root,'src/regional/inventory.json');
  fs.writeFileSync(target, JSON.stringify(result,null,2) + '\n');
  console.log(JSON.stringify({ target:path.relative(root,target), entries:result.entries.length,
    reviewRequired:result.entries.filter(entry=>entry.status === 'review-required').length, complete:result.complete }));
}
