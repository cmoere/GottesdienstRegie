import {useDroppable,type CollisionDetection,pointerWithin,closestCenter} from '@dnd-kit/core';
import type {ReactNode} from 'react';
export type ServiceDropPosition={sectionId:string;anchorId:string;position:'before'|'after'};
export const serviceDropCollision:CollisionDetection=args=>{
 const targets=args.droppableContainers.filter(container=>container.data.current?.serviceDrop);
 const filtered={...args,droppableContainers:targets};
 return args.pointerCoordinates?pointerWithin(filtered):closestCenter(filtered);
};
export function ServiceDropTarget({sectionId,anchorId='',position='after',children,row=false,disabled=false}:{sectionId:string;anchorId?:string;position?:'before'|'after';children?:ReactNode;row?:boolean;disabled?:boolean}){
 const data:ServiceDropPosition={sectionId,anchorId,position};
 const {setNodeRef,isOver}=useDroppable({id:`service-drop:${sectionId}:${anchorId}:${position}`,data:{serviceDrop:data},disabled});
 return <div ref={setNodeRef} className={`service-drop-target ${row?'row-half':''} ${position} ${isOver?'drop-over':''}`} aria-hidden="true">{children}</div>
}
