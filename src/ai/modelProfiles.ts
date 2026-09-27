export type AiModelProfile = 'eco' | 'balanced' | 'quality';
export type AiModelPreference = 'auto' | AiModelProfile;
export type AiExecutionMode = 'confirm' | 'direct';

export interface AiDeviceProfile {
  memoryGb: number;
  logicalCores: number;
  freeStorageGb: number;
  acceleration: 'none' | 'webgpu' | 'gpu';
}

export function selectAiModelProfile(device: AiDeviceProfile, preference: AiModelPreference): AiModelProfile {
  if (preference !== 'auto') return preference;
  const accelerated = device.acceleration !== 'none';
  if (device.memoryGb >= 16 && device.logicalCores >= 8 && device.freeStorageGb >= 6 && accelerated) return 'quality';
  if (device.memoryGb >= 8 && device.logicalCores >= 4 && device.freeStorageGb >= 3) return 'balanced';
  return 'eco';
}
