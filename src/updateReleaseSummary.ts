function plainText(value:string){
  if(!/<[a-z][\s\S]*>/i.test(value))return value;
  const document=new DOMParser().parseFromString(value,'text/html');
  document.querySelectorAll('br').forEach(node=>node.replaceWith('\n'));
  document.querySelectorAll('li').forEach(node=>node.prepend('• '));
  document.querySelectorAll('h1,h2,h3,h4,p,li').forEach(node=>node.append('\n'));
  return (document.body.textContent??value).replace(/\n\s*\n\s*\n/g,'\n\n').trim();
}

export function conciseRemoteSummary(value:string){
  const lines=plainText(value).split(/\r?\n/).map(line=>line.replace(/^\s*[-*•#>]+\s*/,'').replace(/[*_`]/g,'').trim()).filter(line=>line&&!/^GottesdienstRegie\s+\d/i.test(line)&&!/^Veröffentlicht|^Released/i.test(line));
  return lines.slice(0,2).join(' · ');
}
