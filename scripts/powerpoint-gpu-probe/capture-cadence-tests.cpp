#include "capture-cadence.h"
#include <iostream>
#include <stdexcept>

static void check(bool value, const char* message) { if (!value) throw std::runtime_error(message); }
int main() {
  try {
    // Regression: consuming a deadline on EMPTY loses an arriving frame for
    // the whole remaining period. Only the external capture attempt is faked.
    std::uint64_t next = 10000000;
    const auto empty = [] { return false; };
    const auto copied = [] { return true; };
    check(!gpu_probe::captureAtDeadline(10000000, 10000000, 10000000, next, empty), "empty reported as copied");
    check(gpu_probe::captureAtDeadline(10010000, 10000000, 10000000, next, copied), "EMPTY consumed deadline: arriving frame deferred");
    check(next == 10333333, "successful copy lost absolute 30Hz phase");
    unsigned attempts = 0;
    check(!gpu_probe::captureAtDeadline(10333332, 10000000, 10000000, next, [&] { ++attempts; return true; }), "early frame accepted");
    check(attempts == 0, "capture attempted before deadline");
    // No free slot is another unsuccessful attempt, not an accepted frame.
    check(!gpu_probe::captureAtDeadline(10333333, 10000000, 10000000, next, empty), "blocked slot reported copied");
    check(next == 10333333, "blocked slot consumed deadline");
    check(gpu_probe::captureAtDeadline(10343333, 10000000, 10000000, next, copied), "slot recovery deferred");
    check(next == 10666666, "recovery changed phase");
    check(gpu_probe::captureAtDeadline(12000000, 10000000, 10000000, next, copied), "late frame rejected");
    check(next == 12333333, "late frame replayed missed deadlines");
    check(!gpu_probe::captureAtDeadline(12000000, 10000000, 10000000, next, copied), "catch-up burst allowed");
    // Exceptions must not silently consume a deadline either.
    try { gpu_probe::captureAtDeadline(12333333, 10000000, 10000000, next, []()->bool { throw std::runtime_error("source error"); }); }
    catch (const std::runtime_error&) {}
    check(next == 12333333, "failed capture consumed deadline");
    std::uint64_t sixty = 10000000;
    check(gpu_probe::captureAtDeadline(10010000, 10000000, 10000000, sixty, copied, 60), "60Hz copy rejected");
    check(sixty == 10166666, "60Hz absolute phase incorrect");
    check(!gpu_probe::captureAtDeadline(10166665, 10000000, 10000000, sixty, copied, 60), "60Hz early frame accepted");
    check(!gpu_probe::captureAtDeadline(10166666, 10000000, 10000000, sixty, copied, 0), "invalid rate accepted");
    check(sixty == 10166666, "invalid rate consumed a deadline");
    std::cout << "GPU_CADENCE_PASS empty_retry early_gate slot_retry absolute_phase no_catchup exception\n";
    return 0;
  } catch (const std::exception& error) { std::cerr << error.what() << '\n'; return 1; }
}
