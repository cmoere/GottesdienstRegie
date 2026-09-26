export type GeneratorAspectRatio = "16:9" | "4:3" | "1:1" | "9:16";
export type GeneratorMotion = "zoom" | "pan" | "parallax";
export type GeneratorQuality = "standard" | "high";

export function generatorDimensions(
  ratio: GeneratorAspectRatio,
  output: "image" | "video",
) {
  const scale = output === "video" ? 2 / 3 : 1;
  const dimensions: Record<GeneratorAspectRatio, { width: number; height: number }> = {
    "16:9": { width: 1920, height: 1080 },
    "4:3": { width: 1440, height: 1080 },
    "1:1": { width: 1080, height: 1080 },
    "9:16": { width: 1080, height: 1920 },
  };
  const selected = dimensions[ratio];
  return output === "video"
    ? { width: Math.round(selected.width * scale), height: Math.round(selected.height * scale) }
    : selected;
}

export function videoMotionTransform(
  motion: GeneratorMotion,
  progress: number,
  seed: number,
) {
  const loopProgress=progress>=1?0:Math.max(0,progress),
    wave = Math.sin(loopProgress * Math.PI * 2 + (seed % 13));
  if (motion === "pan") return { scale: 1.08, x: Math.sin(loopProgress*Math.PI*2)*45, y: wave * 8 };
  if (motion === "parallax") return { scale: 1.1 + wave * 0.015, x: wave * 42, y: Math.cos(loopProgress * Math.PI * 2) * 24 };
  return { scale: 1.02 + Math.sin(loopProgress * Math.PI) * 0.08, x: 0, y: 0 };
}
