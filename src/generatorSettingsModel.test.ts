import { describe, expect, it } from "vitest";
import { generatorDimensions, videoMotionTransform } from "./generatorSettingsModel";

describe("generator settings", () => {
  it("returns presentation and social aspect-ratio dimensions", () => {
    expect(generatorDimensions("16:9", "image")).toEqual({ width: 1920, height: 1080 });
    expect(generatorDimensions("9:16", "video")).toEqual({ width: 720, height: 1280 });
    expect(generatorDimensions("1:1", "image")).toEqual({ width: 1080, height: 1080 });
  });

  it("creates distinct pan, zoom and parallax motion", () => {
    expect(videoMotionTransform("zoom", 0.5, 7)).not.toEqual(videoMotionTransform("pan", 0.5, 7));
    expect(videoMotionTransform("parallax", 0.2, 7)).not.toEqual(videoMotionTransform("parallax", 0.8, 7));
  });

  it("returns every video motion to its start for seamless loops", () => {
    for (const motion of ["zoom", "pan", "parallax"] as const)
      expect(videoMotionTransform(motion, 1, 9)).toEqual(videoMotionTransform(motion, 0, 9));
  });
});
