import {it,expect} from 'vitest';
import {usePresentation,presentationDocument} from './store';
it('restores and persists the canonical linkedEventKey instead of a title snapshot',()=>{
 usePresentation.getState().loadDocument({presentationId:'test',title:'Test',linkedEventKey:'-stable',eventLink:{eventKey:'-old',titleSnapshot:'Old title'},items:[]});
 expect(usePresentation.getState().eventLink?.eventKey).toBe('-stable');
 expect(presentationDocument(usePresentation.getState()).linkedEventKey).toBe('-stable');
});
