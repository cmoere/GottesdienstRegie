import type {Translator} from './i18n';
import {shapeNameKeys,shapeCategoryKeys} from '../shared/regional/shapeControlTemplates';

/** Presentation IDs and saved element names never depend on the operator language. */
export function shapeLabel(kind:string,t:Translator){return t(Object.hasOwn(shapeNameKeys,kind)?shapeNameKeys[kind]:'shapeUnknown')}
export function shapeCategoryLabel(category:string,t:Translator){return t(Object.hasOwn(shapeCategoryKeys,category)?shapeCategoryKeys[category]:'shapeCategorySymbols')}
