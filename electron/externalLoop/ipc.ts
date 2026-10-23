import type {ExternalReply,ExternalRequest} from '../../shared/externalLoop';
import {readExternalRequest} from '../../shared/externalLoopRequest';
type ReadEvent={sender:{id:number;mainFrame:unknown};senderFrame:unknown};
export async function handleExternalLoopRead(event:ReadEvent,value:unknown,operatorId:number|null,service:{read(request:ExternalRequest):Promise<ExternalReply>}):Promise<ExternalReply>{
 const unavailable:ExternalReply={snapshot:null,status:'unavailable'},request=readExternalRequest(value);
 if(operatorId===null||event.sender.id!==operatorId||!event.senderFrame||event.senderFrame!==event.sender.mainFrame||!request)return unavailable;
 try{return await service.read(request)}catch{return unavailable}
}
