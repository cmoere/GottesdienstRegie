import type { AiModelProfile } from './modelProfiles';

export interface AiModelAsset { path: string; bytes: number; sha256: string }
export interface AiModelPackage { repository: string; revision: string; dtype: 'q4' | 'fp16'; license: 'Apache-2.0'; minimumMemoryGb: number; minimumStorageBytes: number; requiresAcceleration: boolean; assets: AiModelAsset[] }
export interface AiModelManifest { version: number; profiles: Record<AiModelProfile, AiModelPackage> }

const shared05: AiModelAsset[] = [
  { path: 'config.json', bytes: 678, sha256: '777e01f0fbb3346eb229cb6fb278ed6533c1e4dcb9ebf4bed0f6e94ef17fa1b5' },
  { path: 'generation_config.json', bytes: 242, sha256: 'f7e7ce458658b2d40d9eb213b91b77a8bf698845ab89360976722d7ac46928a3' },
  { path: 'tokenizer.json', bytes: 7031673, sha256: 'a8506e7111b80c6d8635951a02eab0f4e1a8e4e5772da83846579e97b16f61bf' },
  { path: 'tokenizer_config.json', bytes: 7306, sha256: '7e88129d9769a0b14b1587a7d5e829fe93ac0e1511636471fdfc0811951418e6' },
];
const shared15: AiModelAsset[] = [
  { path: 'config.json', bytes: 809, sha256: '215eb99c4955b0c42ea9f6e0980d922c228950c5dbc09bde6dc451fbba4d21f3' },
  ...shared05.slice(1),
];

export const AI_MODEL_MANIFEST: AiModelManifest = { version: 1, profiles: {
  eco: { repository: 'onnx-community/Qwen2.5-0.5B-Instruct', revision: 'cc5cc01a65cc3ff17bdb73a7de33d879f62599b0', dtype: 'q4', license: 'Apache-2.0', minimumMemoryGb: 4, minimumStorageBytes: 800_000_000, requiresAcceleration: false, assets: [...shared05, { path: 'onnx/model_q4.onnx', bytes: 786156820, sha256: '09235a3b1c135cd04ef570e5053b5c079e028078a2cc5f76ba6a251e91bf3296' }] },
  balanced: { repository: 'onnx-community/Qwen2.5-1.5B-Instruct', revision: '6287331f475a3e20e8c879be8fd4bf3551ad9d34', dtype: 'q4', license: 'Apache-2.0', minimumMemoryGb: 8, minimumStorageBytes: 1_800_000_000, requiresAcceleration: false, assets: [...shared15, { path: 'onnx/model_q4.onnx', bytes: 1787566590, sha256: '70c24509f760fed9a8f50391165c46a87660197028a42c4547763f1c173ddea6' }] },
  quality: { repository: 'onnx-community/Qwen2.5-1.5B-Instruct', revision: '6287331f475a3e20e8c879be8fd4bf3551ad9d34', dtype: 'fp16', license: 'Apache-2.0', minimumMemoryGb: 16, minimumStorageBytes: 3_120_000_000, requiresAcceleration: true, assets: [...shared15, { path: 'onnx/model_fp16.onnx', bytes: 1098300, sha256: '5b8e920affc39b892c54cb2109f9357405f45aa1a055136fcf2f598cae14b659' }, { path: 'onnx/model_fp16.onnx_data', bytes: 3104177152, sha256: '59e25350a4cbce424b42400b779735699aff5d3c7018fa1bca77a7c7274733c9' }] },
} };
