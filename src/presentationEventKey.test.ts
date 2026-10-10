import {it,expect} from 'vitest';
import {usePresentation,presentationDocument} from './store';
it('restores and persists the canonical linkedEventKey instead of a title snapshot',()=>{
 usePresentation.getState().loadDocument({presentationId:'test',title:'Test',linkedEventKey:'-stable',eventLink:{eventKey:'-old',titleSnapshot:'Old title'},items:[]});
 expect(usePresentation.getState().eventLink?.eventKey).toBe('-stable');
 expect(presentationDocument(usePresentation.getState()).linkedEventKey).toBe('-stable');
});
it('keeps a legacy dialog edit linked immediately, not only after reopening',()=>{
 usePresentation.getState().newDocument('Test');
 usePresentation.getState().updatePresentation({eventId:'  -linked  '});
 expect(usePresentation.getState().eventLink?.eventKey).toBe('-linked');
 expect(presentationDocument(usePresentation.getState()).linkedEventKey).toBe('-linked');
 usePresentation.getState().updatePresentation({eventLink:undefined});
 expect(usePresentation.getState().eventId).toBe('');
 usePresentation.getState().loadDocument(presentationDocument(usePresentation.getState()));
 expect(usePresentation.getState().eventLink).toBeUndefined();
});
it('keeps the legacy information dialog synchronized after loading a canonical-only document',()=>{
 usePresentation.getState().loadDocument({presentationId:'canonical',linkedEventKey:'-canonical',items:[]});
 expect(usePresentation.getState().eventId).toBe('-canonical');
 usePresentation.getState().updatePresentation({eventId:usePresentation.getState().eventId});
 expect(usePresentation.getState().eventLink?.eventKey).toBe('-canonical');
});
it('falls back to a valid legacy link when imported canonical data is malformed',()=>{
 expect(()=>usePresentation.getState().loadDocument({presentationId:'import',linkedEventKey:123,eventLink:{eventKey:'-valid'},items:[]})).not.toThrow();
 expect(usePresentation.getState().eventId).toBe('-valid');
});
