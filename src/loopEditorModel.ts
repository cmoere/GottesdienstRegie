import type {ItemType} from './store';

const automaticLoopTypes=new Set<ItemType>([
  'announcement',
  'birthday',
  'event',
  'weather',
  'clock',
  'today',
  'nextEvents',
  'nowPlaying',
]);

export function usesAutomaticLoopEditor(type:ItemType|string):boolean{
  return automaticLoopTypes.has(type as ItemType);
}
