#include "slot-pool.h"
#include <algorithm>
#include <stdexcept>
#include <utility>

namespace gpu_probe {
namespace {
constexpr std::uint64_t maxSequence = 9007199254740991ULL;
bool validToken(const std::string& token) {
  return token.size() == 32 && std::all_of(token.begin(), token.end(), [](char c) {
    return (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f');
  });
}
}
bool FrameKey::operator==(const FrameKey& other) const {
  return sessionId == other.sessionId && generation == other.generation && slotId == other.slotId && sequence == other.sequence;
}
SlotPool::SlotPool(std::string session, std::string generation)
  : session_(std::move(session)), generation_(std::move(generation)), worker_(std::this_thread::get_id()) {
  if (!validToken(session_) || !validToken(generation_)) throw std::invalid_argument("GPU_SLOT_IDENTITY");
}
void SlotPool::requireWorker() const {
  if (worker_ != std::this_thread::get_id()) throw std::logic_error("GPU_SLOT_WORKER");
}
FrameKey SlotPool::keyFor(std::uint32_t id) const { return {session_, generation_, id, slots_[id].sequence}; }
bool SlotPool::matches(const FrameKey& key, State state) const {
  return key.sessionId == session_ && key.generation == generation_ && key.slotId < slots_.size()
    && key.sequence > 0 && key.sequence <= maxSequence && slots_[key.slotId].state == state
    && slots_[key.slotId].sequence == key.sequence;
}
std::optional<FrameKey> SlotPool::beginWrite() {
  requireWorker();
  if (revoked_ || sequence_ >= maxSequence) return std::nullopt;
  std::optional<std::uint32_t> selected;
  for (std::uint32_t i = 0; i < slots_.size(); ++i) {
    if (slots_[i].state == State::Free) { selected = i; break; }
    if (slots_[i].state == State::Ready && (!selected || slots_[i].sequence < slots_[*selected].sequence)) selected = i;
  }
  if (!selected) return std::nullopt;
  auto& slot = slots_[*selected];
  slot.state = State::Writing; slot.sequence = ++sequence_;
  return keyFor(*selected);
}
bool SlotPool::completeWrite(const FrameKey& key, const FrameTimes& times) {
  requireWorker();
  if (!matches(key, State::Writing) || times.acquiredQpc == 0 || times.copyDoneQpc < times.acquiredQpc
      || times.qpcFrequency == 0 || (times.sourceReportedQpc && *times.sourceReportedQpc == 0)) return false;
  auto& slot = slots_[key.slotId];
  slot.times = times;
  slot.state = revoked_ || key.sequence <= lastClaimed_ ? State::Free : State::Ready;
  return true;
}
std::optional<FrameRecord> SlotPool::claimLatest() {
  requireWorker();
  if (revoked_) return std::nullopt;
  std::optional<std::uint32_t> selected;
  for (std::uint32_t i = 0; i < slots_.size(); ++i) {
    if (slots_[i].state == State::Ready && (!selected || slots_[i].sequence > slots_[*selected].sequence)) selected = i;
  }
  if (!selected) return std::nullopt;
  auto& slot = slots_[*selected];
  slot.state = State::Leased; lastClaimed_ = slot.sequence;
  // Older READY frames are obsolete, never expose them after the newest claim.
  for (auto& older : slots_) if (older.state == State::Ready) older.state = State::Free;
  return FrameRecord{keyFor(*selected), slot.times};
}
bool SlotPool::release(const FrameKey& key) {
  requireWorker();
  if (!matches(key, State::Leased)) return false;
  slots_[key.slotId].state = State::Free;
  return true;
}
void SlotPool::revoke() {
  requireWorker(); revoked_ = true;
  for (auto& slot : slots_) if (slot.state == State::Ready) slot.state = State::Free;
}
bool SlotPool::drained() const {
  requireWorker();
  return std::none_of(slots_.begin(), slots_.end(), [](const Slot& slot) { return slot.state == State::Writing || slot.state == State::Leased; });
}
}
