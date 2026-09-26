export function paginateBibleVerses(verses:string[],characterLimit=460){
  const pages:string[][]=[];let page:string[]=[],length=0;
  for(const verse of verses){
    const size=verse.trim().length;
    if(page.length&&length+size>characterLimit){pages.push(page);page=[];length=0}
    page.push(verse);length+=size;
  }
  if(page.length)pages.push(page);
  return pages.length?pages:[[]];
}
