import type {ExternalReply,ExternalRequest} from '../../shared/externalLoop';
import {readExternalRequest} from '../../shared/externalLoopRequest';
import type {WeatherLocation} from '../../shared/externalLoop';
type ReadEvent={sender:{id:number;mainFrame:unknown};senderFrame:unknown};
export async function handleExternalLoopRead(event:ReadEvent,value:unknown,operatorId:number|null,service:{read(request:ExternalRequest):Promise<ExternalReply>}):Promise<ExternalReply>{
 const unavailable:ExternalReply={snapshot:null,status:'unavailable'},request=readExternalRequest(value);
 if(operatorId===null||event.sender.id!==operatorId||!event.senderFrame||event.senderFrame!==event.sender.mainFrame||!request)return unavailable;
 try{return await service.read(request)}catch{return unavailable}
}
export async function handleWeatherLocationSearch(event:ReadEvent,value:unknown,operatorId:number|null,service:{searchWeatherLocations(query:string):Promise<WeatherLocation[]>}):Promise<WeatherLocation[]>{
 if(operatorId===null||event.sender.id!==operatorId||!event.senderFrame||event.senderFrame!==event.sender.mainFrame||typeof value!=='string'||value.trim().length<2||value.length>100)return[];
 try{return await service.searchWeatherLocations(value)}catch{return[]}
}
