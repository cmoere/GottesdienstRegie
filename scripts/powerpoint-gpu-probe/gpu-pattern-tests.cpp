#include "producer-io.h"
#include "gpu-targets.h"
#include <functional>
#include <iostream>
#include <stdexcept>
#include <thread>
#include <vector>

using namespace gpu_probe;
static void check(bool ok, const char* why) { if (!ok) throw std::runtime_error(why); }
static void rejects(const std::function<void()>& fn) {
  try { fn(); } catch (const std::invalid_argument&) { return; }
  throw std::runtime_error("invalid command was accepted");
}
static const std::string session(32, 'a'), generation(32, 'b'), nonce(32, 'c');
static std::string startLine() {
  return "start 1 " + nonce + " " + session + " " + generation + " 123 45 132000000000000000 0 64 1600 900 1600 964 67 133000000000000000";
}
static void parses_exact_start_and_bootstrap() {
  const auto command = parseCommand(startLine());
  check(command.kind == CommandKind::Start && command.start.nonce == nonce, "start/nonce lost");
  check(command.start.owner.window == 123 && command.start.owner.pid == 45 && command.start.owner.createdAt == 132000000000000000ULL, "unsafe owner conversion");
  check(command.start.owner.x == 0 && command.start.owner.y == 64 && command.start.owner.height == 900 && command.start.owner.outerHeight == 964, "crop altered");
  check(verifyBootstrap(command.start, 67, 133000000000000000ULL, nonce), "own parent rejected");
  check(!verifyBootstrap(command.start, 68, 133000000000000000ULL, nonce), "foreign parent accepted");
  check(!verifyBootstrap(command.start, 67, 1, nonce), "parent PID reuse accepted");
  check(!verifyBootstrap(command.start, 67, 133000000000000000ULL, std::string(32, 'd')), "bootstrap nonce not bound");
}
static void rejects_bad_commands() {
  const std::vector<std::string> invalid{
    "", "stop extra", "clock 0", "clock -1", "clock 9007199254740992", "clock 1 extra",
    "clock 18446744073709551616", "clock 1\n", std::string("clock 1\0", 8), std::string(1025, 'x'),
    "claim 1 " + session + " bad", "release 1 " + session + " " + generation + " 3 1",
    "release 1 " + session + " " + generation + " 0 0", "notice " + session + " " + generation + " 0",
    startLine() + " extra"
  };
  for (const auto& line : invalid) rejects([&] { parseCommand(line); });
  auto crop = startLine(); crop.replace(crop.find("1600 900"), 8, "4097 900");
  rejects([&] { parseCommand(crop); });
  auto bounds = startLine(); bounds.replace(bounds.find("0 64 1600"), 9, "1 64 1600");
  rejects([&] { parseCommand(bounds); });
  const auto release = parseCommand("release 7 " + session + " " + generation + " 2 9007199254740991");
  check(release.kind == CommandKind::Release && release.key.slotId == 2 && release.key.sequence == 9007199254740991ULL && release.requestId == 7, "safe boundary rejected");
}
static void fragmented_bounded_inbox() {
  CommandInbox inbox;
  check(inbox.feed("clo") && !inbox.take(), "fragment dispatched early");
  check(inbox.feed("ck 1\nclock 2\n"), "valid fragments rejected");
  const auto a = inbox.take(), b = inbox.take();
  check(a && b && a->requestId == 1 && b->requestId == 2 && !inbox.take(), "fragmented command order");
  check(inbox.finish() && !inbox.failed(), "clean EOF invalid");
  CommandInbox partial;
  check(partial.feed("clock 1") && !partial.finish() && partial.failed() && !partial.take(), "unterminated line dispatched");
  CommandInbox oversized;
  check(!oversized.feed(std::string(1025, 'x')) && oversized.failed(), "unbounded partial line");
  CommandInbox nul;
  check(!nul.feed(std::string("clock 1\0\n", 9)) && nul.failed(), "NUL accepted by streaming decoder");
}
static void queue_seventeenth_fails_closed() {
  CommandInbox inbox;
  for (unsigned i = 1; i <= 16; ++i) check(inbox.feed("clock " + std::to_string(i) + "\n"), "less than16commands rejected");
  check(!inbox.feed("clock 17\n") && inbox.failed() && !inbox.take(), "17th queued command not bounded/fail-closed");
  CommandInbox concurrent;
  std::thread reader([&] { for (unsigned i = 1; i <= 16; ++i) check(concurrent.feed("clock " + std::to_string(i) + "\n"), "cross-thread command feed"); });
  reader.join();
  for (unsigned i = 1; i <= 16; ++i) { auto command = concurrent.take(); check(command && command->requestId == i, "cross-thread queue order"); }
}
static void responses_do_not_grow_or_block_worker() {
  ResponseQueue queue;
  check(queue.push(std::string(2048, 'x')), "bounded maximum reply rejected");
  const auto full = queue.take(); check(full && full->size() == 2048, "reply changed");
  check(!queue.push(std::string(2049, 'x')) && queue.failed(), "oversized response queued");
  ResponseQueue blocked;
  for (unsigned i = 0; i < 16; ++i) check(blocked.push("{}"), "bounded reply capacity");
  check(!blocked.push("{}") && blocked.failed(), "slow writer blocks or grows queue");
}
static void coalesces_one_notice_and_dirty_bit() {
  NoticeGate gate;
  check(gate.publish() == 1, "initial notice");
  for (unsigned i = 0; i < 100; ++i) check(!gate.publish(), "notice flood");
  rejects([&] { gate.acknowledge(2); });
  check(gate.acknowledge(1) == 2, "dirty change lost");
  rejects([&] { gate.acknowledge(1); });
  check(!gate.acknowledge(2) && gate.publish() == 3 && !gate.acknowledge(3), "notice credit not restored");
}
static void actual_gpu_patterns_preserve_leased_texture() {
  GpuTargets gpu; gpu.initialize(nullptr);
  SlotPool pool(session, generation);
  D3D11_TEXTURE2D_DESC desc{}; gpu.slots[0].texture->GetDesc(&desc);
  desc.Usage = D3D11_USAGE_STAGING; desc.BindFlags = 0; desc.CPUAccessFlags = D3D11_CPU_ACCESS_READ; desc.MiscFlags = 0;
  winrt::com_ptr<ID3D11Texture2D> staging;
  winrt::check_hresult(gpu.device->CreateTexture2D(&desc, nullptr, staging.put()));
  auto verify = [&](std::uint32_t slot, std::uint32_t expected) {
    gpu.context->CopyResource(staging.get(), gpu.slots[slot].texture.get());
    D3D11_MAPPED_SUBRESOURCE mapped{};
    winrt::check_hresult(gpu.context->Map(staging.get(), 0, D3D11_MAP_READ, 0, &mapped));
    bool correct = mapped.RowPitch >= 1920 * 4;
    for (unsigned y = 0; correct && y < 1080; ++y) {
      const auto row = reinterpret_cast<const std::uint32_t*>(static_cast<const unsigned char*>(mapped.pData) + y * mapped.RowPitch);
      for (unsigned x = 0; x < 1920; ++x) if (row[x] != expected) { correct = false; break; }
    }
    gpu.context->Unmap(staging.get(), 0);
    check(correct, "actual GPU frame torn or leased texture overwritten");
  };
  std::optional<FrameKey> pinned;
  for (std::uint64_t sequence = 1; sequence <= 1000; ++sequence) {
    const auto key = pool.beginWrite(); check(key.has_value(), "GPU write unavailable");
    const unsigned r = static_cast<unsigned>(sequence % 251), g = static_cast<unsigned>((sequence * 3) % 251), b = 37;
    const float color[4]{r / 255.0f, g / 255.0f, b / 255.0f, 1};
    gpu.context->ClearRenderTargetView(gpu.slots[key->slotId].view.get(), color);
    gpu.submit(key->slotId);
    const auto until = GetTickCount64() + 5000;
    while (!gpu.copyDone(key->slotId)) { check(GetTickCount64() < until, "GPU query timeout"); Sleep(1); }
    check(pool.completeWrite(*key, {std::nullopt, sequence * 10, sequence * 10 + 1, 10000000}), "GPU publish rejected");
    const auto record = pool.claimLatest(); check(record && record->key == *key, "GPU latest claim");
    verify(key->slotId, 0xff000000U | (r << 16) | (g << 8) | b);
    if (sequence == 1) pinned = *key;
    else { check(key->slotId != pinned->slotId, "pinned slot reused"); check(pool.release(*key), "GPU release rejected"); }
    if (sequence % 25 == 0) verify(pinned->slotId, 0xff010325U);
  }
  check(pinned && pool.release(*pinned), "pinned release"); pool.revoke(); check(pool.drained(), "GPU leases not drained");
  check(gpu.closeRemoteHandles(), "GPU handles not released");
  std::cout << "GPU_PATTERN_PASS 1000 FULL_1080P_FRAMES\n";
}
static void failed_handle_close_cannot_retry_reused_value() {
  GpuTargets gpu; gpu.initialize(GetCurrentProcess());
  const auto ownHandle = gpu.slots[0].remote;
  check(CloseHandle(ownHandle) != 0, "test cannot close its own duplicate");
  check(!gpu.closeRemoteHandles(), "invalid own handle not reported");
  for (const auto& slot : gpu.slots) check(slot.remote == nullptr, "failed close leaves stale handle for destructor retry");
  check(gpu.closeRemoteHandles(), "cleanup retried uncertain old handles");
  std::cout << "GPU_HANDLE_FAILURE_PASS\n";
}
int main() {
  try {
    parses_exact_start_and_bootstrap(); rejects_bad_commands(); fragmented_bounded_inbox();
    queue_seventeenth_fails_closed(); responses_do_not_grow_or_block_worker(); coalesces_one_notice_and_dirty_bit();
    std::cout << "GPU_IO_PASS\n";
    actual_gpu_patterns_preserve_leased_texture();
    failed_handle_close_cannot_retry_reused_value();
    return 0;
  } catch (const std::exception& error) { std::cerr << "GPU_IO_FAIL " << error.what() << '\n'; return 1; }
}
