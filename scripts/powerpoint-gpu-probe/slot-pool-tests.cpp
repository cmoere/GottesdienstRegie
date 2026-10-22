#include "slot-pool.h"
#include <array>
#include <functional>
#include <iostream>
#include <stdexcept>
#include <thread>
#include <vector>

using namespace gpu_probe;
static const std::string session(32, 'a'), generation(32, 'b');
static void check(bool ok, const char* what) { if (!ok) throw std::runtime_error(what); }
static FrameTimes times(std::uint64_t n = 10) { return {std::nullopt, n, n + 1, 10000000}; }
static FrameKey write(SlotPool& pool, std::uint64_t n = 10) {
  auto key = pool.beginWrite(); check(key.has_value(), "write unavailable");
  check(pool.completeWrite(*key, times(n)), "complete rejected"); return *key;
}
static FrameKey lease(SlotPool& pool, std::uint64_t n = 10) {
  const auto written = write(pool, n);
  auto record = pool.claimLatest(); check(record.has_value(), "claim empty");
  check(record->key == written, "claimed wrong version");
  check(record->width == 1920 && record->height == 1080 && record->pixelFormat == "bgra", "invalid geometry");
  check(record->times.acquiredQpc == n && record->times.copyDoneQpc == n + 1, "changed times");
  return record->key;
}
static void initial_three_free() {
  SlotPool pool(session, generation);
  check(pool.drained() && !pool.claimLatest(), "initial state");
  auto a = pool.beginWrite(), b = pool.beginWrite(), c = pool.beginWrite();
  check(a && b && c && a->slotId != b->slotId && b->slotId != c->slotId && a->slotId != c->slotId, "not three independent slots");
  check(a->sequence == 1 && b->sequence == 2 && c->sequence == 3, "nonmonotone sequence");
  check(!pool.beginWrite() && !pool.drained(), "overwrites writing slot");
  check(!pool.release(*a), "released writing slot");
}
static void reclaim_ready_never_leased() {
  SlotPool pool(session, generation);
  const auto a = lease(pool), b = lease(pool), c = lease(pool);
  check(!pool.beginWrite(), "fourth lease");
  auto bad = b; bad.generation = std::string(32, 'c');
  check(!pool.release(bad) && !pool.beginWrite(), "foreign release frees lease");
  check(pool.release(b) && !pool.release(b), "double release accepted");
  for (unsigned i = 0; i < 100; ++i) {
    const auto ready = write(pool, i + 10);
    check(ready.slotId == b.slotId, "reclaimed leased slot");
    check(!pool.release(b), "stale key releases reused slot");
  }
  check(pool.release(a) && pool.release(c), "lost original leases");
}
static void claim_after_notice_uses_current() {
  SlotPool pool(session, generation);
  const auto first = write(pool), second = write(pool), third = write(pool), newest = write(pool);
  check(newest.slotId == first.slotId, "must reclaim oldest ready before newer ready");
  check(!pool.completeWrite(first, times()), "stale completion accepted");
  const auto record = pool.claimLatest();
  check(record && record->key == newest && record->key.sequence > third.sequence, "notice treated as access permission");
  check(!pool.claimLatest(), "old ready frame regresses output");
  check(!pool.release(second), "released unclaimed version");
}
static void late_release_cannot_free_reused_slot() {
  SlotPool pool(session, generation);
  const auto a = lease(pool), b = lease(pool), c = lease(pool);
  check(pool.release(a), "first release");
  const auto replacement = lease(pool);
  check(replacement.slotId == a.slotId && replacement.sequence > c.sequence, "version not advanced");
  check(!pool.release(a) && !pool.beginWrite(), "late release frees new key");
  for (unsigned mutation = 0; mutation < 5; ++mutation) {
    auto bad = replacement;
    if (mutation == 0) bad.sessionId = std::string(32, 'c');
    if (mutation == 1) bad.generation = std::string(32, 'c');
    if (mutation == 2) bad.slotId = 3;
    if (mutation == 3) bad.sequence = 0;
    if (mutation == 4) bad.sequence = 9007199254740992ULL;
    check(!pool.release(bad) && !pool.beginWrite(), "invalid key frees slot");
  }
  check(pool.release(b) && pool.release(c) && pool.release(replacement) && pool.drained(), "drain lost versions");
}
static void revoke_drains_without_new_generation() {
  SlotPool pool(session, generation);
  const auto claimed = lease(pool);
  const auto writing = pool.beginWrite(); check(writing.has_value(), "missing writing");
  write(pool);
  pool.revoke(); pool.revoke();
  check(!pool.beginWrite() && !pool.claimLatest() && !pool.drained(), "revoked still produces");
  check(pool.release(claimed) && !pool.drained(), "writing lost on revoke");
  check(pool.completeWrite(*writing, times()) && pool.drained(), "GPU completion cannot drain revoke");
  check(!pool.claimLatest() && !pool.completeWrite(*writing, times()), "revoked published/completed twice");
}
static void reject_invalid_times_and_identity() {
  for (const auto& bad : {std::string(), std::string(31, 'a'), std::string(32, 'z'), std::string(33, 'a')}) {
    bool rejected = false;
    try { SlotPool pool(bad, generation); } catch (const std::invalid_argument&) { rejected = true; }
    check(rejected, "invalid identity accepted");
    rejected = false;
    try { SlotPool pool(session, bad); } catch (const std::invalid_argument&) { rejected = true; }
    check(rejected, "invalid generation accepted");
  }
  SlotPool pool(session, generation);
  const auto key = pool.beginWrite(); check(key.has_value(), "write");
  check(!pool.completeWrite(*key, {std::nullopt, 12, 11, 10000000}), "backwards copy time");
  check(!pool.completeWrite(*key, {std::nullopt, 0, 11, 10000000}), "zero acquire time");
  check(!pool.completeWrite(*key, {std::nullopt, 10, 11, 0}), "zero frequency");
  check(!pool.completeWrite(*key, {0, 10, 11, 10000000}), "zero reported time");
  // Known WGC clock contradiction must remain a separate diagnostic, not erase a valid copy.
  check(pool.completeWrite(*key, {100, 10, 11, 10000000}), "untrusted source time rejects valid copy");
  const auto record = pool.claimLatest();
  check(record && record->times.sourceReportedQpc == 100, "source time clamped");
}
static void older_gpu_completion_does_not_regress() {
  SlotPool pool(session, generation);
  const auto older = pool.beginWrite(), newer = pool.beginWrite();
  check(older && newer, "writes");
  check(pool.completeWrite(*newer, times(20)), "newer complete");
  const auto record = pool.claimLatest(); check(record && record->key == *newer, "newer claim");
  check(pool.completeWrite(*older, times(10)) && !pool.claimLatest(), "late GPU completion regresses output");
}
static void worker_affinity() {
  SlotPool pool(session, generation);
  bool rejected = false;
  std::thread foreign([&] { try { pool.beginWrite(); } catch (const std::logic_error&) { rejected = true; } });
  foreign.join(); check(rejected && pool.drained(), "foreign worker mutates pool");
}
static void deterministic_10000_operations() {
  SlotPool pool(session, generation);
  std::vector<FrameKey> writing, leased;
  std::uint64_t lastClaimed = 0, writes = 0;
  std::uint32_t random = 0x47a319U;
  for (unsigned i = 0; i < 10000; ++i) {
    random = random * 1664525U + 1013904223U;
    switch ((random >> 16) % 4) {
      case 0: {
        const auto key = pool.beginWrite();
        if (key) {
          check(key->slotId < 3 && key->sequence > writes, "bad write sequence"); writes = key->sequence;
          for (const auto& live : leased) check(live.slotId != key->slotId, "overwrote leased texture");
          for (const auto& live : writing) check(live.slotId != key->slotId, "overwrote pending GPU copy");
          writing.push_back(*key);
        }
        break;
      }
      case 1:
        if (!writing.empty()) {
          const auto index = random % writing.size(); const auto key = writing[index];
          check(pool.completeWrite(key, times(key.sequence * 10)), "valid completion rejected");
          check(!pool.completeWrite(key, times()), "duplicate completion accepted");
          writing.erase(writing.begin() + index);
        }
        break;
      case 2: {
        const auto record = pool.claimLatest();
        if (record) { check(record->key.sequence > lastClaimed, "claim regressed"); lastClaimed = record->key.sequence; leased.push_back(record->key); }
        break;
      }
      case 3:
        if (!leased.empty()) {
          const auto index = random % leased.size(); const auto key = leased[index];
          auto bad = key; bad.sequence += 9007199254740992ULL;
          check(!pool.release(bad) && pool.release(key) && !pool.release(key), "unsafe or duplicate release");
          leased.erase(leased.begin() + index);
        }
        break;
    }
  }
  check(writes > 1000, "insufficient mixed writes");
  pool.revoke();
  for (const auto& key : writing) check(pool.completeWrite(key, times(key.sequence * 10)), "drain writing");
  for (const auto& key : leased) check(pool.release(key), "drain leased");
  check(pool.drained(), "10k operations leaked");
}
int main() {
  const std::array<std::pair<const char*, std::function<void()>>, 9> tests{{
    {"initial_three_free", initial_three_free}, {"reclaim_ready_never_leased", reclaim_ready_never_leased},
    {"claim_after_notice_uses_current", claim_after_notice_uses_current}, {"late_release_cannot_free_reused_slot", late_release_cannot_free_reused_slot},
    {"revoke_drains_without_new_generation", revoke_drains_without_new_generation}, {"reject_invalid_times_and_identity", reject_invalid_times_and_identity},
    {"older_gpu_completion_does_not_regress", older_gpu_completion_does_not_regress}, {"worker_affinity", worker_affinity},
    {"deterministic_10000_operations", deterministic_10000_operations}
  }};
  try { for (const auto& test : tests) { test.second(); std::cout << "PASS " << test.first << '\n'; } }
  catch (const std::exception& error) { std::cerr << "GPU_SLOT_FAIL " << error.what() << '\n'; return 1; }
  std::cout << "GPU_SLOT_PASS\n";
}
