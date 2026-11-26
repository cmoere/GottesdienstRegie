import type {ShapeDefinition} from './shapeCatalog';
import {polygonPath,profilePoints,regularPoints,starPoints,type Point} from './objectGeometry';
type Solid={kind:string;name:string;english:string;family:'prism'|'pyramid'|'curved';points?:Point[];sides?:number;curved?:string};
export const solidDefinitions:Solid[]=[];
for(let sides=3;sides<=20;sides++)solidDefinitions.push({kind:'solid-prism-'+sides,name:sides+'-Eck-Prisma',english:sides+'-sided prism',family:'prism',points:regularPoints(sides)});
for(let sides=3;sides<=16;sides++)solidDefinitions.push({kind:'solid-pyramid-'+sides,name:sides+'-Eck-Pyramide',english:sides+'-sided pyramid',family:'pyramid',sides});
for(const [kind,name,english]of [['cone','Kegel','Cone'],['frustum','Kegelstumpf','Truncated cone'],['cylinder','Zylinder','Cylinder'],['tube','Hohlzylinder','Hollow cylinder'],['sphere','Kugel','Sphere'],['hemisphere','Halbkugel','Hemisphere'],['torus','Torus','Torus']])solidDefinitions.push({kind:'solid-'+kind,name,english,family:'curved',curved:kind});
for(let tips=4;tips<=12;tips++)solidDefinitions.push({kind:'solid-star-'+tips,name:tips+'-Zack-Sternkörper',english:tips+'-point star solid',family:'prism',points:starPoints(tips)});
for(const [profile,name,english]of [['heart','Herzkörper','Heart solid'],['cross','Kreuzkörper','Cross solid'],['cloud','Wolkenkörper','Cloud solid'],['arrow','Pfeilkörper','Arrow solid'],['chevron','Chevronkörper','Chevron solid'],['shield','Schildkörper','Shield solid'],['moon','Mondkörper','Crescent solid'],['gear','Zahnradkörper','Gear solid'],['triangle','Dreieckskeil','Triangular wedge'],['plaque','Plakettenkörper','Plaque solid'],['speech','Sprechblasenkörper','Speech bubble solid'],['ticket','Ticketkörper','Ticket solid']])solidDefinitions.push({kind:'solid-'+profile,name,english,family:'prism',points:profilePoints[profile]});
const ellipse=(cx:number,cy:number,rx:number,ry:number)=>`M${cx-rx} ${cy}a${rx} ${ry} 0 1 0 ${rx*2} 0 ${rx} ${ry} 0 1 0 ${-rx*2} 0Z`;
export function spatialGeometry(kind:string,depthValue:unknown=14,angleValue:unknown=-35):Pick<ShapeDefinition,'path'|'layers'>|undefined{
 const solid=solidDefinitions.find(s=>s.kind===kind);if(!solid)return;
 const depth=typeof depthValue==='number'&&Number.isFinite(depthValue)?Math.min(30,Math.max(0,depthValue)):14;
 const angle=(typeof angleValue==='number'&&Number.isFinite(angleValue)?angleValue:-35)*Math.PI/180;
 const layers:NonNullable<ShapeDefinition['layers']>=[];
 if(solid.family==='prism'){
  const dx=Math.cos(angle)*depth,dy=Math.sin(angle)*depth,scale=(88-depth)/100;
  const front=solid.points!.map(([x,y])=>[50+(x-50)*scale-dx/2,50+(y-50)*scale-dy/2] as Point),back=front.map(([x,y])=>[x+dx,y+dy] as Point);
  layers.push({path:polygonPath(back),shade:-.3});
  front.forEach((p,i)=>{const next=(i+1)%front.length,edge=[front[next][0]-p[0],front[next][1]-p[1]],normal=[edge[1],-edge[0]];if(normal[0]*dx+normal[1]*dy>0)layers.push({path:polygonPath([p,front[next],back[next],back[i]]),shade:-.18-.18*Math.abs(Math.sin(i+angle))})});
  layers.push({path:polygonPath(front),shade:0});
 }else if(solid.family==='pyramid'){
  const points=regularPoints(solid.sides!,40,angle*180/Math.PI).map(([x,y])=>[x,72+(y-50)*.45] as Point),apex:Point=[50+Math.cos(angle)*depth*.3,8+(30-depth)*.6];
  layers.push({path:polygonPath(points),shade:-.35});
  points.forEach((p,i)=>{if((p[1]+points[(i+1)%points.length][1])/2>=71)layers.push({path:polygonPath([apex,p,points[(i+1)%points.length]]),shade:-.35+.5*(i/(points.length-1))})});
 }else{
  const lift=depth*.35,light=Math.cos(angle)*.12;
  if(['sphere','hemisphere','torus'].includes(solid.curved!)){
   const ring=solid.curved==='torus';
   for(let i=0;i<8;i++){const r=43-i*2.5,path=solid.curved==='hemisphere'?`M${50-r} 72a${r} ${r} 0 0 1 ${r*2} 0Z`:ellipse(50-i*.45,50-i*.65,r,r*(.84+lift/150));layers.push({path:ring?path+' '+ellipse(50,50,17+i*.55,14+i*.5):path,shade:i===7?0:-.35+i*.09+light})}
  }else{
   const top=18+lift,bottom=80,rx=solid.curved==='cone'?1:solid.curved==='frustum'?22:38;
   layers.push({path:ellipse(50,bottom,38,12),shade:-.32});
   layers.push({path:`M${50-rx} ${top}Q50 ${top+12} ${50+rx} ${top}L88 ${bottom}Q50 ${bottom+22} 12 ${bottom}Z`,shade:0});
   layers.push({path:ellipse(50,top,rx,rx*.28),shade:.22+light});
   if(solid.curved==='tube')layers.push({path:ellipse(50,top,26,6),shade:-.55});
  }
 }
 return{path:layers.map(layer=>layer.path).join(' '),layers};
}
export const spatialShapes:ShapeDefinition[]=solidDefinitions.map(solid=>({kind:solid.kind,name:solid.name,category:'3D',aliases:solid.kind==='solid-prism-4'?['Würfel','Quader','Cube','Cuboid']:undefined,dimension:'3d',viewBox:'0 0 100 100',vector:true,...spatialGeometry(solid.kind)!}));
