#pragma once
#include <array>
#include <cstdint>
#include <memory>
#include <optional>
#include <string>
#include <vector>

namespace regie {
using Token = std::array<uint8_t, 16>;
Token tokenFromHex(const std::wstring& value);
std::wstring tokenToHex(const Token& value);
struct RingConfig {
  std::wstring name;
  Token session;
  Token generation;
  static RingConfig random();
};
struct FrameDescriptor {
  Token session, generation;
  uint64_t sequence, capturedQpc, qpcFrequency;
  uint32_t width, height, stride, byteLength;
};
struct FrameSnapshot {FrameDescriptor descriptor; std::vector<uint8_t> pixels;};
class FrameRing {
public:
  static FrameRing create(const RingConfig& config);
  static FrameRing openReadOnly(const RingConfig& config);
  FrameRing(FrameRing&&) noexcept;
  FrameRing& operator=(FrameRing&&) noexcept;
  FrameRing(const FrameRing&) = delete;
  FrameRing& operator=(const FrameRing&) = delete;
  ~FrameRing();
  void publish(const FrameDescriptor& descriptor, const std::vector<uint8_t>& pixels);
  std::optional<FrameSnapshot> readLatest(uint64_t afterSequence) const;
  void close() noexcept;
private:
  struct Impl;
  std::unique_ptr<Impl> impl;
  explicit FrameRing(std::unique_ptr<Impl> value);
};
}
