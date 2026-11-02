/** Device-persisted IDs are stable; model paths can never come from IPC. */
export const bundledVoices=[
 {id:'marytts:dfki-pavoque-neutral',name:'Thorsten',modelKey:'male',gender:'male',modelFile:'de_DE-thorsten-high.onnx'},
 {id:'marytts:bits1-hsmm',name:'Kerstin',modelKey:'female',gender:'female',modelFile:'de_DE-kerstin-low.onnx'},
 {id:'piper:de_DE-karlsson-low',name:'Karlsson',modelKey:'karlsson',gender:'male',modelFile:'de_DE-karlsson-low.onnx'},
 {id:'piper:de_DE-ramona-low',name:'Ramona',modelKey:'ramona',gender:'female',modelFile:'de_DE-ramona-low.onnx'},
 {id:'piper:de_DE-eva_k-x_low',name:'Eva K.',modelKey:'eva_k',gender:'female',modelFile:'de_DE-eva_k-x_low.onnx'},
] as const;
export type BundledVoiceId=typeof bundledVoices[number]['id'];
