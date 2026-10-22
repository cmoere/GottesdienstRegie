#pragma once
#include "slot-pool.h"
#include <deque>
#include <mutex>
#include <string_view>

namespace gpu_probe {
struct SourceOwner {
  std::uint64_t window = 0, createdAt = 0;
  std::uint32_t pid = 0, x = 0, y = 0, width = 0, height = 0, outerWidth = 0, outerHeight = 0;
};
struct StartConfig {
  std::string nonce, sessionId, generation;
  SourceOwner owner;
  std::uint32_t parentPid = 0;
  std::uint64_t parentCreated = 0;
};
enum class CommandKind { Start, Claim, Release, Notice, Clock, Stop };
struct Command {
  CommandKind kind = CommandKind::Stop;
  std::uint64_t requestId = 0;
  FrameKey key{};
  StartConfig start;
};
Command parseCommand(std::string_view line);
bool verifyBootstrap(const StartConfig& config, std::uint32_t actualParent, std::uint64_t actualCreated, const std::string& actualNonce);

// Reader/worker boundary. No graphics or process handles enter this queue.
class CommandInbox {
public:
  bool feed(std::string_view bytes);
  bool finish();
  std::optional<Command> take();
  bool failed() const;
private:
  mutable std::mutex mutex_;
  std::deque<Command> queue_;
  std::string partial_;
  bool failed_ = false, ended_ = false;
};
// Writer/worker boundary. Never wait for a pipe while holding the GPU worker.
class ResponseQueue {
public:
  bool push(std::string line);
  std::optional<std::string> take();
  bool failed() const;
private:
  mutable std::mutex mutex_;
  std::deque<std::string> queue_;
  bool failed_ = false;
};
// Capture worker only. A dirty bit is not a FIFO of obsolete frame notices.
class NoticeGate {
public:
  std::optional<std::uint64_t> publish();
  std::optional<std::uint64_t> acknowledge(std::uint64_t id);
private:
  std::uint64_t next_ = 0, outstanding_ = 0;
  bool dirty_ = false;
};
}
