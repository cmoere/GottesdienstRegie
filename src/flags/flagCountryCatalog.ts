const countries:Record<string,string>={
  de:'de',en:'gb',fr:'fr',es:'es',it:'it',nl:'nl',pl:'pl',pt:'pt',uk:'ua',ru:'ru',tr:'tr',ar:'sa',da:'dk',sv:'se',no:'no',
  af:'za',sq:'al',am:'et',hy:'am',az:'az',eu:'es',bn:'bd',bs:'ba',bg:'bg',ca:'es',zh:'cn',hr:'hr',cs:'cz',et:'ee',fi:'fi',ka:'ge',el:'gr',he:'il',hi:'in',hu:'hu',id:'id',ga:'ie',ja:'jp',ko:'kr',lv:'lv',lt:'lt',ms:'my',fa:'ir',ro:'ro',sr:'rs',sk:'sk',sl:'si',sw:'tz',th:'th',vi:'vn',cy:'gb',yi:'il'
};
export function flagCountryForLanguage(code:string){return countries[code.toLowerCase()]??'un'}
