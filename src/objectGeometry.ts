export type Point=[number,number];
const n=(x:number)=>Math.round(x*1000)/1000;
export function polygonPath(points:Point[]){return points.map(([x,y],i)=>`${i?'L':'M'}${n(x)} ${n(y)}`).join(' ')+'Z'}
export function regularPoints(sides:number,radius=44,rotation=-90):Point[]{return Array.from({length:sides},(_,i)=>{const a=(rotation+i*360/sides)*Math.PI/180;return[50+Math.cos(a)*radius,50+Math.sin(a)*radius]})}
export function starPoints(tips:number,inner=22):Point[]{return Array.from({length:tips*2},(_,i)=>{const a=(-90+i*180/tips)*Math.PI/180,r=i%2?inner:44;return[50+Math.cos(a)*r,50+Math.sin(a)*r]})}
export function rotatedPoints(points:Point[],degrees:number):Point[]{const a=degrees*Math.PI/180,rotated=points.map(([x,y])=>[(x-50)*Math.cos(a)-(y-50)*Math.sin(a),(x-50)*Math.sin(a)+(y-50)*Math.cos(a)] as Point),scale=44/Math.max(1,...rotated.flatMap(p=>p.map(Math.abs)));return rotated.map(([x,y])=>[50+x*scale,50+y*scale])}
export function scaledPath(path:string,scale:number){
 // Profiles registered here are polygonal, so each number is an x/y coordinate.
 return path.replace(/-?\d+(?:\.\d+)?/g,value=>String(n(50+(Number(value)-50)*scale)));
}
export const profilePoints:Record<string,Point[]>={
 heart:[[50,92],[9,51],[6,30],[15,12],[33,8],[50,24],[67,8],[85,12],[94,30],[91,51]],
 shield:[[50,6],[92,20],[86,68],[50,94],[14,68],[8,20]],
 capsule:Array.from({length:40},(_,i)=>{const a=i*Math.PI/20;return[50+Math.cos(a)*44,50+Math.sin(a)*26]}),
 cloud:[[16,80],[6,67],[8,46],[23,36],[30,38],[38,17],[60,9],[79,24],[82,40],[94,49],[94,69],[84,81]],
 arch:[[6,94],[6,50],[9,31],[22,14],[50,6],[78,14],[91,31],[94,50],[94,94]],
 cross:[[38,6],[62,6],[62,38],[94,38],[94,62],[62,62],[62,94],[38,94],[38,62],[6,62],[6,38],[38,38]],
 arrow:[[6,36],[61,36],[61,12],[94,50],[61,88],[61,64],[6,64]],
 chevron:[[6,10],[56,10],[94,50],[56,90],[6,90],[44,50]],
 moon:[[80,6],[52,18],[38,40],[41,65],[60,85],[85,94],[58,94],[32,86],[12,66],[6,42],[18,18],[42,6]],
 gear:starPoints(12,34),
 triangle:[[6,6],[94,94],[6,94]],
 plaque:[[20,10],[80,10],[94,24],[94,76],[80,90],[20,90],[6,76],[6,24]],
 speech:[[6,10],[94,10],[94,74],[36,74],[16,94],[20,74],[6,74]],
 ticket:[[6,20],[94,20],[94,38],[84,44],[84,56],[94,62],[94,80],[6,80],[6,62],[16,56],[16,44],[6,38]],
};
export const extendedFrameProfiles:Record<string,string>={};
for(const sides of [5,7,9,10,12])extendedFrameProfiles['polygon-'+sides]=polygonPath(regularPoints(sides));
for(const tips of [4,5,6,8,12])extendedFrameProfiles['star-'+tips]=polygonPath(starPoints(tips,30));
for(const name of ['heart','shield','capsule','cloud','arch'])extendedFrameProfiles[name]=polygonPath(profilePoints[name]);
export function extendedFramePath(kind:string,width=8){
 const match=/^frame-(single|double)-(.+)$/.exec(kind),profile=match&&Object.hasOwn(extendedFrameProfiles,match[2])?extendedFrameProfiles[match[2]]:undefined;
 if(!match||!profile)return undefined;
 const t=Number.isFinite(width)?Math.min(24,Math.max(1,width)):8,scale=(inset:number)=>(44-inset)/44;
 return match[1]==='single'?profile+' '+scaledPath(profile,scale(t)):[0,t/3,t*2/3,t].map(inset=>scaledPath(profile,scale(inset))).join(' ');
}
