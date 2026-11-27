import type {ItemType} from './store';

const automaticLoopTypes=new Set<ItemType>([
  'announcement',
  'birthday',
  'event',
  'weather',
  'siteMap',
  'clock',
  'today',
  'nextEvents',
  'nowPlaying',
  'news',
  'football',
  'transit',
]);

export function usesAutomaticLoopEditor(type:ItemType|string):boolean{
  return automaticLoopTypes.has(type as ItemType);
}
