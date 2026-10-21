#define NOMINMAX
#include <windows.h>
#include <bcrypt.h>
#include <sddl.h>
#include <algorithm>
#include <cstring>
#include <mutex>
#include <stdexcept>
#include "frame-ring.h"

namespace regie {
namespace {
constexpr uint32_t magic = 0x52465247;
constexpr uint32_t protocol = 1;
constexpr size_t pixelBytes = 8294400;
constexpr uint64_t maxSequence = 9007199254740991ULL;
constexpr wchar_t prefix[] = L"Local\\GottesdienstRegie.Probe.";
struct alignas(64) RingHeader {
  uint32_t magic, version, slotCount, headerBytes;
  Token session, generation;
  uint64_t mappingBytes;
  volatile LONG64 latestSequence;
};
struct alignas(64) SlotHeader {volatile LONG64 version; FrameDescriptor descriptor; uint8_t reserved[48];};
static_assert(sizeof(void*) == 8, "x64 only");
static_assert(sizeof(RingHeader) == 64 && sizeof(SlotHeader) == 128, "fixed ring ABI");
constexpr size_t slotBytes = sizeof(SlotHeader) + pixelBytes;
constexpr size_t mappingBytes = sizeof(RingHeader) + 3 * slotBytes;
[[noreturn]] void fail(const char* code) {throw std::runtime_error(code);}
bool hex(wchar_t c) {return (c >= L'0' && c <= L'9') || (c >= L'a' && c <= L'f');}
void validateConfig(const RingConfig& config) {
  const std::wstring start(prefix);
  if (config.name.size() != start.size() + 32 || config.name.compare(0, start.size(), start) != 0 ||
      !std::all_of(config.name.begin() + start.size(), config.name.end(), hex) ||
      std::all_of(config.session.begin(), config.session.end(), [](uint8_t n) {return n == 0;}) ||
      std::all_of(config.generation.begin(), config.generation.end(), [](uint8_t n) {return n == 0;})) fail("RING_CONFIG_INVALID");
}
void validateFrame(const FrameDescriptor& frame, const RingConfig& config) {
  if (frame.session != config.session || frame.generation != config.generation) fail("RING_IDENTITY_MISMATCH");
  // Fixed dimensions make all byte-count products bounded before any allocation/copy.
  if (frame.width != 1920 || frame.height != 1080 || frame.stride != 7680 || frame.byteLength != pixelBytes ||
      frame.sequence == 0 || frame.sequence > maxSequence || frame.capturedQpc == 0 || frame.qpcFrequency == 0)
    fail("RING_FRAME_INVALID");
}
LONG64 loadAcquire(const volatile LONG64* value) {
  // Read-only x64 mapping: naturally aligned 64-bit volatile load, then full barrier.
  // InterlockedCompareExchange is not used: it would write into a read-only view.
  const LONG64 result = *value; MemoryBarrier(); return result;
}
struct LocalAllocation {void* pointer = nullptr; ~LocalAllocation() {if (pointer) LocalFree(pointer);}};
struct Handle {HANDLE value = nullptr; ~Handle() {if (value) CloseHandle(value);}};
struct RestrictedSecurity {
  LocalAllocation descriptor;
  SECURITY_ATTRIBUTES attributes{};
  RestrictedSecurity() {
    Handle token;
    if (!OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &token.value)) fail("RING_SECURITY_FAILED");
    DWORD count = 0; GetTokenInformation(token.value, TokenUser, nullptr, 0, &count);
    if (count == 0 || count > 65536) fail("RING_SECURITY_FAILED");
    std::vector<uint8_t> user(count);
    if (!GetTokenInformation(token.value, TokenUser, user.data(), count, &count)) fail("RING_SECURITY_FAILED");
    LPWSTR sid = nullptr;
    if (!ConvertSidToStringSidW(reinterpret_cast<TOKEN_USER*>(user.data())->User.Sid, &sid)) fail("RING_SECURITY_FAILED");
    LocalAllocation stringSid; stringSid.pointer = sid;
    const auto sddl = L"D:P(A;;GA;;;SY)(A;;GA;;;" + std::wstring(sid) + L")";
    PSECURITY_DESCRIPTOR security = nullptr;
    if (!ConvertStringSecurityDescriptorToSecurityDescriptorW(sddl.c_str(), SDDL_REVISION_1, &security, nullptr)) fail("RING_SECURITY_FAILED");
    descriptor.pointer = security;
    attributes = {sizeof(SECURITY_ATTRIBUTES), security, FALSE};
  }
};
Token randomToken() {
  Token token{};
  if (BCryptGenRandom(nullptr, token.data(), static_cast<ULONG>(token.size()), BCRYPT_USE_SYSTEM_PREFERRED_RNG) < 0) fail("RING_RANDOM_FAILED");
  return token;
}
}
Token tokenFromHex(const std::wstring& text) {
  if (text.size() != 32 || !std::all_of(text.begin(), text.end(), hex)) fail("RING_CONFIG_INVALID");
  Token result{};
  const auto digit = [](wchar_t c) {return c <= L'9' ? c - L'0' : c - L'a' + 10;};
  for (size_t i = 0; i < result.size(); ++i) result[i] = static_cast<uint8_t>(16 * digit(text[2*i]) + digit(text[2*i+1]));
  return result;
}
std::wstring tokenToHex(const Token& token) {
  constexpr wchar_t digits[] = L"0123456789abcdef";
  std::wstring result; result.reserve(32);
  for (auto byte : token) {result += digits[byte >> 4]; result += digits[byte & 15];}
  return result;
}
RingConfig RingConfig::random() {return {std::wstring(prefix) + tokenToHex(randomToken()), randomToken(), randomToken()};}
struct FrameRing::Impl {
  RingConfig config;
  HANDLE handle = nullptr;
  uint8_t* view = nullptr;
  bool writable = false;
  uint64_t lastPublished = 0;
  std::mutex publication;
  explicit Impl(const RingConfig& value) : config(value) {}
  ~Impl() {if (view) UnmapViewOfFile(view); if (handle) CloseHandle(handle);}
  RingHeader* header() const {return reinterpret_cast<RingHeader*>(view);}
  SlotHeader* slot(uint64_t sequence) const {return reinterpret_cast<SlotHeader*>(view + sizeof(RingHeader) + (sequence % 3) * slotBytes);}
  void validateHeader() const {
    const auto h = header();
    if (h->magic != magic || h->version != protocol || h->slotCount != 3 || h->headerBytes != sizeof(RingHeader) || h->mappingBytes != mappingBytes)
      fail("RING_VERSION_MISMATCH");
    if (h->session != config.session || h->generation != config.generation) fail("RING_IDENTITY_MISMATCH");
  }
};
FrameRing::FrameRing(std::unique_ptr<Impl> value) : impl(std::move(value)) {}
FrameRing::~FrameRing() = default;
FrameRing::FrameRing(FrameRing&&) noexcept = default;
FrameRing& FrameRing::operator=(FrameRing&&) noexcept = default;
FrameRing FrameRing::create(const RingConfig& config) {
  validateConfig(config); auto state = std::make_unique<Impl>(config); RestrictedSecurity security;
  state->handle = CreateFileMappingW(INVALID_HANDLE_VALUE, &security.attributes, PAGE_READWRITE, 0, static_cast<DWORD>(mappingBytes), config.name.c_str());
  const auto error = GetLastError();
  if (!state->handle) fail("RING_CREATE_FAILED");
  if (error == ERROR_ALREADY_EXISTS) fail("RING_ALREADY_EXISTS");
  state->view = static_cast<uint8_t*>(MapViewOfFile(state->handle, FILE_MAP_WRITE, 0, 0, mappingBytes));
  if (!state->view) fail("RING_VIEW_FAILED");
  state->writable = true;
  auto h = state->header();
  h->magic = magic; h->version = protocol; h->slotCount = 3; h->headerBytes = sizeof(RingHeader);
  h->session = config.session; h->generation = config.generation; h->mappingBytes = mappingBytes;
  MemoryBarrier();
  return FrameRing(std::move(state));
}
FrameRing FrameRing::openReadOnly(const RingConfig& config) {
  validateConfig(config); auto state = std::make_unique<Impl>(config);
  state->handle = OpenFileMappingW(FILE_MAP_READ, FALSE, config.name.c_str());
  if (!state->handle) fail("RING_OPEN_FAILED");
  state->view = static_cast<uint8_t*>(MapViewOfFile(state->handle, FILE_MAP_READ, 0, 0, mappingBytes));
  if (!state->view) fail("RING_VIEW_FAILED");
  state->validateHeader(); return FrameRing(std::move(state));
}
void FrameRing::publish(const FrameDescriptor& descriptor, const std::vector<uint8_t>& pixels) {
  if (!impl) fail("RING_CLOSED");
  if (!impl->writable) fail("RING_READ_ONLY");
  validateFrame(descriptor, impl->config);
  if (pixels.size() != pixelBytes) fail("RING_FRAME_INVALID");
  std::lock_guard<std::mutex> lock(impl->publication);
  impl->validateHeader();
  if (descriptor.sequence <= impl->lastPublished) fail("RING_SEQUENCE_INVALID");
  auto slot = impl->slot(descriptor.sequence);
  InterlockedExchange64(&slot->version, static_cast<LONG64>(descriptor.sequence * 2 - 1));
  slot->descriptor = descriptor;
  std::memcpy(reinterpret_cast<uint8_t*>(slot) + sizeof(SlotHeader), pixels.data(), pixelBytes);
  MemoryBarrier();
  InterlockedExchange64(&slot->version, static_cast<LONG64>(descriptor.sequence * 2));
  InterlockedExchange64(&impl->header()->latestSequence, static_cast<LONG64>(descriptor.sequence));
  impl->lastPublished = descriptor.sequence;
}
std::optional<FrameSnapshot> FrameRing::readLatest(uint64_t afterSequence) const {
  if (!impl) fail("RING_CLOSED");
  if (afterSequence > maxSequence) fail("RING_SEQUENCE_INVALID");
  impl->validateHeader();
  for (int attempt = 0; attempt < 3; ++attempt) {
    const auto latest = loadAcquire(&impl->header()->latestSequence);
    if (latest == 0 || static_cast<uint64_t>(latest) <= afterSequence) return std::nullopt;
    if (latest < 0 || static_cast<uint64_t>(latest) > maxSequence) fail("RING_FRAME_INVALID");
    auto slot = impl->slot(static_cast<uint64_t>(latest));
    const auto version = loadAcquire(&slot->version);
    if (version != latest * 2 || version & 1) continue;
    FrameSnapshot frame; frame.descriptor = slot->descriptor; frame.pixels.resize(pixelBytes);
    std::memcpy(frame.pixels.data(), reinterpret_cast<const uint8_t*>(slot) + sizeof(SlotHeader), pixelBytes);
    MemoryBarrier();
    if (loadAcquire(&slot->version) != version) continue;
    validateFrame(frame.descriptor, impl->config);
    if (frame.descriptor.sequence != static_cast<uint64_t>(latest)) fail("RING_FRAME_INVALID");
    return frame;
  }
  return std::nullopt;
}
void FrameRing::close() noexcept {impl.reset();}
}
