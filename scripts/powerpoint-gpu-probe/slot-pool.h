#pragma once
#include <array>
#include <cstdint>
#include <optional>
#include <string>
#include <thread>

namespace gpu_probe {
struct FrameKey {
  std::string sessionId, generation;
  std::uint32_t slotId;
  std::uint64_t sequence;
  bool operator==(const FrameKey& other) const;
};
struct FrameTimes {
  std::optional<std::uint64_t> sourceReportedQpc;
  std::uint64_t acquiredQpc, copyDoneQpc, qpcFrequency;
};
struct FrameRecord {
  FrameKey key;
  FrameTimes times;
  std::uint32_t width = 1920, height = 1080;
  std::string pixelFormat = "bgra";
};

// Owned only by the capture worker. There is no cross-thread mutable slot API.
class SlotPool {
public:
  SlotPool(std::string session, std::string generation);
  SlotPool(const SlotPool&) = delete;
  SlotPool& operator=(const SlotPool&) = delete;
  std::optional<FrameKey> beginWrite();
  bool completeWrite(const FrameKey& key, const FrameTimes& times);
  std::optional<FrameRecord> claimLatest();
  bool release(const FrameKey& key);
  void revoke();
  bool drained() const;
private:
  enum class State { Free, Writing, Ready, Leased };
  struct Slot { State state = State::Free; std::uint64_t sequence = 0; FrameTimes times{}; };
  void requireWorker() const;
  bool matches(const FrameKey& key, State state) const;
  FrameKey keyFor(std::uint32_t slot) const;
  const std::string session_, generation_;
  const std::thread::id worker_;
  std::array<Slot, 3> slots_{};
  std::uint64_t sequence_ = 0, lastClaimed_ = 0;
  bool revoked_ = false;
};
}
