export type SectionInfoOptions={
 position:'top'|'bottom';
 showTime:boolean;
 showSeconds:boolean;
 showDate:boolean;
 showTitle:boolean;
};
export type SectionInfoSnapshot=SectionInfoOptions&{title:string};

export function readSectionInfo(value:unknown):SectionInfoOptions|undefined{
 if(!value||typeof value!=='object')return;
 const {position,showTime,showSeconds,showDate,showTitle}=value as Partial<SectionInfoOptions>;
 if(position!=='top'&&position!=='bottom')return;
 return {position,showTime:showTime===true,showSeconds:showSeconds===true,showDate:showDate===true,showTitle:showTitle===true};
}
