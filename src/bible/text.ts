const bundled:Record<string,string>={
  'JHN:3:16-16':'Denn also hat Gott die Welt geliebt, dass er seinen eingebornen Sohn gab, auf dass alle, die an ihn glauben, nicht verloren werden, sondern das ewige Leben haben.',
  'JHN:3:16-18':'Denn also hat Gott die Welt geliebt, dass er seinen eingebornen Sohn gab, auf dass alle, die an ihn glauben, nicht verloren werden, sondern das ewige Leben haben.',
  'PSA:23:1-1':'Der HERR ist mein Hirte; mir wird nichts mangeln.',
};

export function resolveBundledBibleText(book:string,chapter:number,fromVerse:number,toVerse:number){
  return bundled[`${book}:${chapter}:${fromVerse}-${toVerse}`]??'';
}
