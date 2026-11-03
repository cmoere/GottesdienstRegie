// Only call in the isolated inference worker before importing Transformers/ORT.
// ORT 1.21's native binding expects Uint16Array storage for float16, whereas
// recent Electron V8 exposes Float16Array (a different N-API typed-array id).
export function prepareFloat16Compatibility(scope:object=globalThis){
 Object.defineProperty(scope,'Float16Array',{value:undefined,writable:true,configurable:true});
}
