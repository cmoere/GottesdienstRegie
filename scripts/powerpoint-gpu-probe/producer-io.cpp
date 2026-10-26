#include "producer-io.h"
#include <algorithm>
#include <charconv>
#include <sstream>
#include <stdexcept>
#include <utility>
#include <vector>

namespace gpu_probe {
namespace {
constexpr std::uint64_t maxSafe = 9007199254740991ULL;
[[noreturn]] void invalid() { throw std::invalid_argument("GPU_PROTOCOL_INVALID"); }
std::uint64_t number(const std::string& text, std::uint64_t limit, bool zero = false) {
  if (text.empty() || text.size() > 20 || text.find_first_not_of("0123456789") != std::string::npos) invalid();
  std::uint64_t value = 0;
  const auto parsed = std::from_chars(text.data(), text.data() + text.size(), value);
  if (parsed.ec != std::errc{} || parsed.ptr != text.data() + text.size() || value > limit || (!zero && value == 0)) invalid();
  return value;
}
std::string token(const std::string& value) {
  if (value.size() != 32 || value.find_first_not_of("0123456789abcdef") != std::string::npos) invalid();
  return value;
}
}
Command parseCommand(std::string_view line) {
  if (line.empty() || line.size() > 1024 || std::any_of(line.begin(), line.end(), [](unsigned char c) { return c < 32 || c > 126; })) invalid();
  std::istringstream input{std::string(line)};
  std::vector<std::string> words; std::string word;
  while (input >> word) { if (words.size() == 18) invalid(); words.push_back(std::move(word)); }
  if (words.empty()) invalid();
  Command result;
  if (words[0] == "stop" && words.size() == 1) return result;
  if (words[0] == "start" && (words.size() == 16 || words.size() == 18)) {
    if (!((words[1] == "1" && words.size() == 16) || (words[1] == "2" && words.size() == 18))) invalid();
    result.kind = CommandKind::Start;
    auto& start = result.start;
    start.nonce = token(words[2]); start.sessionId = token(words[3]); start.generation = token(words[4]);
    auto& o = start.owner;
    o.window = number(words[5], UINT64_MAX);
    o.pid = static_cast<std::uint32_t>(number(words[6], UINT32_MAX));
    o.createdAt = number(words[7], UINT64_MAX);
    o.x = static_cast<std::uint32_t>(number(words[8], 4096, true));
    o.y = static_cast<std::uint32_t>(number(words[9], 2160, true));
    o.width = static_cast<std::uint32_t>(number(words[10], 4096));
    o.height = static_cast<std::uint32_t>(number(words[11], 2160));
    o.outerWidth = static_cast<std::uint32_t>(number(words[12], 4096));
    o.outerHeight = static_cast<std::uint32_t>(number(words[13], 2160));
    if (o.x > o.outerWidth || o.y > o.outerHeight || o.width > o.outerWidth - o.x || o.height > o.outerHeight - o.y) invalid();
    start.parentPid = static_cast<std::uint32_t>(number(words[14], UINT32_MAX));
    start.parentCreated = number(words[15], UINT64_MAX);
    if (words[1] == "2") {
      o.childWindow = number(words[16], UINT64_MAX);
      o.lifetimeValue = number(words[17], INT32_MAX);
      if (o.childWindow == o.window) invalid();
    }
    return result;
  }
  if (words[0] == "clock" && words.size() == 2) {
    result.kind = CommandKind::Clock; result.requestId = number(words[1], maxSafe); return result;
  }
  if (words[0] == "notice" && words.size() == 4) {
    result.kind = CommandKind::Notice;
    result.key.sessionId = token(words[1]); result.key.generation = token(words[2]);
    result.requestId = number(words[3], maxSafe); return result;
  }
  if ((words[0] == "claim" && words.size() == 4) || (words[0] == "release" && words.size() == 6)) {
    result.kind = words[0] == "claim" ? CommandKind::Claim : CommandKind::Release;
    result.requestId = number(words[1], maxSafe); result.key.sessionId = token(words[2]); result.key.generation = token(words[3]);
    if (result.kind == CommandKind::Release) {
      result.key.slotId = static_cast<std::uint32_t>(number(words[4], 2, true));
      result.key.sequence = number(words[5], maxSafe);
    }
    return result;
  }
  invalid();
}
bool verifyBootstrap(const StartConfig& config, std::uint32_t pid, std::uint64_t created, const std::string& nonce) {
  return config.parentPid == pid && config.parentCreated == created && config.nonce == nonce;
}
bool CommandInbox::feed(std::string_view bytes) {
  std::lock_guard<std::mutex> lock(mutex_);
  if (failed_ || ended_) return false;
  try {
    for (unsigned char c : bytes) {
      if (c == '\n') {
        if (queue_.size() >= 16) invalid();
        queue_.push_back(parseCommand(partial_)); partial_.clear();
      } else {
        if (c < 32 || c > 126 || partial_.size() >= 1024) invalid();
        partial_ += static_cast<char>(c);
      }
    }
    return true;
  } catch (const std::invalid_argument&) { failed_ = true; queue_.clear(); partial_.clear(); return false; }
}
bool CommandInbox::finish() {
  std::lock_guard<std::mutex> lock(mutex_); ended_ = true;
  if (!partial_.empty()) { failed_ = true; queue_.clear(); partial_.clear(); }
  return !failed_;
}
std::optional<Command> CommandInbox::take() {
  std::lock_guard<std::mutex> lock(mutex_);
  if (failed_ || queue_.empty()) return std::nullopt;
  auto command = std::move(queue_.front()); queue_.pop_front(); return command;
}
bool CommandInbox::failed() const { std::lock_guard<std::mutex> lock(mutex_); return failed_; }
bool ResponseQueue::push(std::string line) {
  std::lock_guard<std::mutex> lock(mutex_);
  if (failed_) return false;
  if (line.empty() || line.size() > 2048 || line.find_first_of("\r\n\0", 0, 3) != std::string::npos || queue_.size() >= 16) {
    failed_ = true; queue_.clear(); return false;
  }
  queue_.push_back(std::move(line)); return true;
}
std::optional<std::string> ResponseQueue::take() {
  std::lock_guard<std::mutex> lock(mutex_);
  if (failed_ || queue_.empty()) return std::nullopt;
  auto line = std::move(queue_.front()); queue_.pop_front(); return line;
}
bool ResponseQueue::failed() const { std::lock_guard<std::mutex> lock(mutex_); return failed_; }
std::optional<std::uint64_t> NoticeGate::publish() {
  if (outstanding_) { dirty_ = true; return std::nullopt; }
  if (next_ >= maxSafe) invalid();
  outstanding_ = ++next_; return outstanding_;
}
std::optional<std::uint64_t> NoticeGate::acknowledge(std::uint64_t id) {
  if (!outstanding_ || id != outstanding_) invalid();
  outstanding_ = 0;
  if (!dirty_) return std::nullopt;
  dirty_ = false; return publish();
}
}
