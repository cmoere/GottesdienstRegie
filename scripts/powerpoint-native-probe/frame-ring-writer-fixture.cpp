// Test-only publisher, no source capture or product entry point.
#include <iostream>
#include <sstream>
#include "frame-ring.h"
using namespace regie;
int wmain() {
  try {
    std::wstring line, mode, mapping, session, generation, extra;
    std::getline(std::wcin, line); std::wistringstream configLine(line);
    if (!(configLine >> mode >> mapping >> session >> generation) || mode != L"host" || (configLine >> extra)) return 2;
    RingConfig config{mapping, tokenFromHex(session), tokenFromHex(generation)};
    auto ring = FrameRing::create(config);
    auto publish = [&](uint64_t sequence) {
      FrameDescriptor d{config.session, config.generation, sequence, 123456789, 10000000, 1920, 1080, 7680, 8294400};
      ring.publish(d, std::vector<uint8_t>(8294400, static_cast<uint8_t>(sequence)));
    };
    publish(1); std::cout << "READY" << std::endl;
    while (std::getline(std::wcin, line)) {
      uint64_t sequence = 0; std::wistringstream command(line);
      if (!(command >> mode >> sequence) || mode != L"publish" || (command >> extra)) return 2;
      publish(sequence); std::cout << "PUBLISHED" << std::endl;
    }
    return 0;
  } catch (const std::exception& e) {std::cerr << e.what() << std::endl; return 1;}
}
