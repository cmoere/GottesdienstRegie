#pragma once
#include <cstdint>

namespace gpu_probe {
// Capture worker only. attempt returns true only after an actual GPU submission.
template<class Attempt>
bool captureAtDeadline(std::uint64_t now, std::uint64_t origin, std::uint64_t frequency,
                       std::uint64_t& nextFrame, Attempt attempt, unsigned frameRate = 30) {
  if (frameRate != 30 && frameRate != 60) return false;
  if (now < nextFrame) return false;
  if (!attempt()) return false;
  const auto tick = ((now - origin) * frameRate) / frequency + 1;
  nextFrame = origin + (tick * frequency) / frameRate;
  return true;
}
}
