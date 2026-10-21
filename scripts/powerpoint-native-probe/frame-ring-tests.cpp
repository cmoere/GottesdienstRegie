#define NOMINMAX
#include <windows.h>
#include <aclapi.h>
#include <sddl.h>
#include <algorithm>
#include <chrono>
#include <iostream>
#include <functional>
#include <fstream>
#include <string>
#include <vector>
#include "frame-ring.h"

using namespace regie;
static void check(bool value, const char* name) { if (!value) throw std::runtime_error(name); }
static void rejects(const char* code, const std::function<void()>& fn) {
  try {fn();} catch (const std::exception& e) {check(std::string(e.what()) == code, e.what()); return;}
  throw std::runtime_error(std::string("Expected rejection: ") + code);
}
static FrameDescriptor descriptor(const RingConfig& config, uint64_t sequence) {
  return {config.session, config.generation, sequence, 123456789, 10000000, 1920, 1080, 7680, 8294400};
}
static std::vector<uint8_t> pattern(uint64_t sequence) {return std::vector<uint8_t>(8294400, static_cast<uint8_t>(sequence % 251));}
static void verify(const FrameSnapshot& frame) {
  check(frame.pixels.size() == 8294400, "bounded snapshot bytes");
  const auto expected = static_cast<uint8_t>(frame.descriptor.sequence % 251);
  check(std::all_of(frame.pixels.begin(), frame.pixels.end(), [expected](uint8_t value) {return value == expected;}), "torn pixels under write load");
}
struct MappingView {
  HANDLE handle = nullptr; void* view = nullptr;
  MappingView(const std::wstring& name) {
    handle = OpenFileMappingW(FILE_MAP_ALL_ACCESS, FALSE, name.c_str());
    check(handle != nullptr, "test mapping open");
    view = MapViewOfFile(handle, FILE_MAP_ALL_ACCESS, 0, 0, 0);
    check(view != nullptr, "test mapping view");
  }
  ~MappingView() {if (view) UnmapViewOfFile(view); if (handle) CloseHandle(handle);}
};
static void checkAcl(const RingConfig& config) {
  HANDLE object = OpenFileMappingW(READ_CONTROL, FALSE, config.name.c_str());
  check(object != nullptr, "read mapping ACL");
  PACL acl = nullptr; PSECURITY_DESCRIPTOR security = nullptr;
  DWORD code = GetSecurityInfo(object, SE_KERNEL_OBJECT, DACL_SECURITY_INFORMATION, nullptr, nullptr, &acl, nullptr, &security);
  CloseHandle(object);
  check(code == ERROR_SUCCESS && acl != nullptr, "mapping has explicit DACL");
  HANDLE token = nullptr; check(OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &token) != 0, "current token");
  DWORD bytes = 0; GetTokenInformation(token, TokenUser, nullptr, 0, &bytes);
  std::vector<uint8_t> user(bytes);
  check(GetTokenInformation(token, TokenUser, user.data(), bytes, &bytes) != 0, "current SID");
  CloseHandle(token);
  BYTE system[SECURITY_MAX_SID_SIZE]; DWORD systemBytes = sizeof(system);
  check(CreateWellKnownSid(WinLocalSystemSid, nullptr, system, &systemBytes) != 0, "SYSTEM SID");
  bool hasUser = false, hasSystem = false;
  check(acl->AceCount == 2, "only user and SYSTEM ACEs");
  for (DWORD i = 0; i < acl->AceCount; ++i) {
    void* ace = nullptr; check(GetAce(acl, i, &ace) != 0, "get mapping ACE");
    const auto allowed = static_cast<ACCESS_ALLOWED_ACE*>(ace);
    check(allowed->Header.AceType == ACCESS_ALLOWED_ACE_TYPE, "explicit allow ACE");
    PSID sid = const_cast<DWORD*>(&allowed->SidStart);
    if (EqualSid(sid, reinterpret_cast<TOKEN_USER*>(user.data())->User.Sid)) hasUser = true;
    else if (EqualSid(sid, system)) hasSystem = true;
    else check(false, "unexpected public mapping ACE");
  }
  LocalFree(security);
  check(hasUser && hasSystem, "both restricted identities present");
}
static void runCases() {
  std::cout << "CASE bounds_and_readonly_snapshot" << std::endl;
  auto config = RingConfig::random();
  auto writer = FrameRing::create(config);
  auto reader = FrameRing::openReadOnly(config);
  check(!reader.readLatest(0).has_value(), "empty ring is not a frame");
  auto one = descriptor(config, 1); const auto pixels = pattern(1);
  writer.publish(one, pixels);
  auto frame = reader.readLatest(0); check(frame.has_value(), "committed frame exists"); verify(*frame);
  check(frame->descriptor.capturedQpc == 123456789 && frame->descriptor.qpcFrequency == 10000000, "clock metadata exact");
  check(!reader.readLatest(1).has_value(), "old sequence not repeated");
  rejects("RING_READ_ONLY", [&] {reader.publish(one, pixels);});
  rejects("RING_ALREADY_EXISTS", [&] {FrameRing::create(config);});
  checkAcl(config);
  for (int field = 0; field < 7; ++field) {
    auto bad = descriptor(config, 2);
    if (field == 0) bad.width = 0;
    if (field == 1) bad.width = UINT32_MAX;
    if (field == 2) bad.height = UINT32_MAX;
    if (field == 3) bad.stride = UINT32_MAX;
    if (field == 4) bad.byteLength = 8294401;
    if (field == 5) bad.capturedQpc = 0;
    if (field == 6) bad.qpcFrequency = 0;
    rejects("RING_FRAME_INVALID", [&] {writer.publish(bad, pixels);});
  }
  auto bad = descriptor(config, 2); bad.generation[0] ^= 0xff;
  rejects("RING_IDENTITY_MISMATCH", [&] {writer.publish(bad, pixels);});
  bad = descriptor(config, 9007199254740992ULL);
  rejects("RING_FRAME_INVALID", [&] {writer.publish(bad, pixels);});
  rejects("RING_FRAME_INVALID", [&] {writer.publish(descriptor(config, 2), std::vector<uint8_t>(4));});
  rejects("RING_SEQUENCE_INVALID", [&] {writer.publish(one, pixels);});

  std::cout << "CASE rejects_uncommitted_or_foreign_generation" << std::endl;
  auto wrong = config; wrong.generation[0] ^= 0xff;
  rejects("RING_IDENTITY_MISMATCH", [&] {FrameRing::openReadOnly(wrong);});
  auto badName = config; badName.name = L"Global\\untrusted";
  rejects("RING_CONFIG_INVALID", [&] {FrameRing::openReadOnly(badName);});
  rejects("RING_CONFIG_INVALID", [&] {tokenFromHex(L"0000");});
  check(tokenFromHex(tokenToHex(config.session)) == config.session, "128-bit token roundtrip");
  {
    MappingView corrupt(config.name);
    auto version = static_cast<uint32_t*>(corrupt.view) + 1;
    const auto saved = *version; *version = 99;
    rejects("RING_VERSION_MISMATCH", [&] {FrameRing::openReadOnly(config);});
    *version = saved;
    // Ring ABI: 64-byte global header; 128-byte slot headers; seq1 is slot1.
    auto slotVersion = reinterpret_cast<volatile LONG64*>(static_cast<uint8_t*>(corrupt.view) + 64 + 8294528);
    const auto committed = *slotVersion;
    *slotVersion = committed | 1;
    check(!reader.readLatest(0).has_value(), "uncommitted slot is unavailable");
    *slotVersion = committed;
    auto width = reinterpret_cast<uint32_t*>(reinterpret_cast<uint8_t*>(const_cast<LONG64*>(slotVersion)) + 64);
    const auto goodWidth = *width; *width = UINT32_MAX;
    rejects("RING_FRAME_INVALID", [&] {reader.readLatest(0);});
    *width = goodWidth;
  }
  reader.close(); writer.close();
  HANDLE absent = OpenFileMappingW(FILE_MAP_READ, FALSE, config.name.c_str());
  if (absent) CloseHandle(absent);
  check(absent == nullptr, "mapping handles released");
  rejects("RING_CLOSED", [&] {reader.readLatest(0);});
  const auto smallConfig = RingConfig::random();
  HANDLE undersizedMapping = CreateFileMappingW(INVALID_HANDLE_VALUE, nullptr, PAGE_READWRITE, 0, 1024, smallConfig.name.c_str());
  check(undersizedMapping != nullptr, "undersized test mapping");
  rejects("RING_VIEW_FAILED", [&] {FrameRing::openReadOnly(smallConfig);});
  CloseHandle(undersizedMapping);
}
static int stressReader(const wchar_t* name, const wchar_t* session, const wchar_t* generation, const wchar_t* readyName) {
  RingConfig config{name, tokenFromHex(session), tokenFromHex(generation)};
  auto reader = FrameRing::openReadOnly(config);
  HANDLE ready = OpenEventW(EVENT_MODIFY_STATE, FALSE, readyName);
  check(ready != nullptr, "reader ready event"); SetEvent(ready); CloseHandle(ready);
  uint64_t latest = 0; size_t observed = 0;
  const auto end = std::chrono::steady_clock::now() + std::chrono::seconds(60);
  while (std::chrono::steady_clock::now() < end) {
    auto frame = reader.readLatest(latest);
    if (!frame) {SwitchToThread(); continue;}
    check(frame->descriptor.sequence > latest, "strict monotonic snapshots");
    verify(*frame); latest = frame->descriptor.sequence; ++observed;
    if (latest == 10000) {check(observed >= 2, "concurrent snapshots observed"); return 0;}
  }
  throw std::runtime_error("stress reader timed out");
}
static void stress() {
  std::cout << "CASE never_returns_torn_pixels_under_load" << std::endl;
  const auto config = RingConfig::random(); auto writer = FrameRing::create(config);
  const auto readyName = config.name + L"-ready";
  HANDLE ready = CreateEventW(nullptr, TRUE, FALSE, readyName.c_str()); check(ready != nullptr, "ready event create");
  wchar_t exe[32768]; check(GetModuleFileNameW(nullptr, exe, 32768) != 0, "own executable path");
  std::wstring line = L"\"" + std::wstring(exe) + L"\" --stress-reader " + config.name + L" " + tokenToHex(config.session) + L" " + tokenToHex(config.generation) + L" " + readyName;
  STARTUPINFOW startup{}; startup.cb = sizeof(startup); PROCESS_INFORMATION child{};
  check(CreateProcessW(exe, line.data(), nullptr, nullptr, FALSE, CREATE_NO_WINDOW, nullptr, nullptr, &startup, &child) != 0, "own stress reader start");
  CloseHandle(child.hThread);
  const auto start = WaitForSingleObject(ready, 10000); CloseHandle(ready);
  if (start != WAIT_OBJECT_0) {TerminateProcess(child.hProcess, 9); CloseHandle(child.hProcess); check(false, "stress reader start timeout");}
  auto pixels = pattern(1);
  for (uint64_t sequence = 1; sequence <= 10000; ++sequence) {
    std::fill(pixels.begin(), pixels.end(), static_cast<uint8_t>(sequence % 251));
    writer.publish(descriptor(config, sequence), pixels);
    if (sequence % 100 == 0) SwitchToThread();
  }
  const auto finished = WaitForSingleObject(child.hProcess, 60000);
  DWORD exitCode = 9;
  if (finished != WAIT_OBJECT_0) TerminateProcess(child.hProcess, 9);
  else GetExitCodeProcess(child.hProcess, &exitCode);
  CloseHandle(child.hProcess);
  check(finished == WAIT_OBJECT_0 && exitCode == 0, "cross-process read/write stress");
  std::cout << "PUBLISHED 10000 FULL_1080P_FRAMES" << std::endl;
}
int wmain(int argc, wchar_t** argv) {
  try {
    if (argc == 6 && std::wstring(argv[1]) == L"--stress-reader") return stressReader(argv[2], argv[3], argv[4], argv[5]);
    check(argc == 1, "invalid test arguments");
    runCases(); stress(); std::cout << "FRAME_RING_PASS" << std::endl; return 0;
  } catch (const std::exception& e) {
    if (argc == 6) {std::ofstream diagnostic("stress-reader-failure.log"); diagnostic << e.what() << '\n';}
    std::cerr << "FRAME_RING_FAIL " << e.what() << std::endl; return 1;
  }
}
