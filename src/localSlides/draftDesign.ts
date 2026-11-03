import type {SlideDraft} from '../../shared/localSlideDraft';
import type {SlideElement} from '../store';

// The model chooses from bounded compositions. Geometry and contrast remain
// deterministic, and every generated part stays an ordinary editable element.
export function designDraft(draft:SlideDraft,font:string,image?:string){
 const layout=draft.design?.layout??'statement',accent=draft.design?.accent??'#608f9a';
 const elements:SlideElement[]=[],dark=layout==='quote'||layout==='photo';
 const base=(type:SlideElement['type'],name:string,x:number,y:number,width:number,height:number,properties:SlideElement['properties']):SlideElement=>({id:crypto.randomUUID(),type,name,x,y,width,height,rotation:0,opacity:1,locked:false,visible:true,zIndex:elements.length,properties});
 const shape=(x:number,y:number,w:number,h:number,fill:string)=>elements.push(base('shape','Form',x,y,w,h,{fill,shapeKind:'rectangle'}));
 const picture=(x:number,y:number,w:number,h:number)=>{if(image)elements.push(base('image','Bild',x,y,w,h,{src:image,fit:'cover'}))};
 const text=(value:string,title:boolean,x:number,y:number,w:number,h:number,color=dark?'#ffffff':'#101820')=>elements.push(base('text',title?'Titel':'Text',x,y,w,h,{text:value,contentRole:title?'title':'body',fontFamily:font,fontSize:title?76:48,fontWeight:title?600:400,fontStyle:'normal',color,align:'left',verticalAlign:'top',lineHeight:1.2,letterSpacing:0,padding:12}));
 switch(layout){
  case 'cover':
   picture(1040,0,880,1080);shape(0,0,1040,1080,'#ffffff');shape(88,112,12,160,accent);text(draft.title,true,140,130,800,300);text(draft.body,false,140,490,800,470);break;
  case 'split-left':
   picture(80,100,760,880);shape(900,100,12,880,accent);text(draft.title,true,980,100,850,280);text(draft.body,false,980,420,850,560);break;
  case 'split-right':
   picture(1100,100,740,880);shape(80,100,900,12,accent);text(draft.title,true,80,160,900,260);text(draft.body,false,80,470,900,510);break;
  case 'quote':
   picture(1280,300,560,640);shape(120,160,16,760,accent);text(draft.title,true,200,160,image?1000:1500,260);text(draft.body,false,200,460,image?1000:1500,470);break;
  case 'points':
   picture(1280,380,560,600);shape(0,0,1920,32,accent);text(draft.title,true,100,100,1720,230);shape(100,390,64,64,accent);text(draft.body,false,220,370,image?1000:1580,600);break;
  case 'band':
   picture(1260,430,580,540);shape(0,0,1920,330,accent);text(draft.title,true,110,80,1700,230,'#101820');text(draft.body,false,110,430,image?1070:1700,540);break;
  case 'photo':
   picture(0,0,1920,1080);shape(80,90,1050,900,'#18242a');text(draft.title,true,130,140,950,280);text(draft.body,false,130,460,950,470);break;
  default:
   picture(1150,500,650,450);shape(110,100,180,14,accent);text(draft.title,true,110,180,1640,260);text(draft.body,false,110,500,image?960:1640,450);
 }
 return{background:dark?'#18242a':'#ffffff',elements};
}
