#include <iostream>
#include <sstream>
#include <charconv>
#include <cstring>
#include <fcntl.h>
#include <io.h>
#include "frame-ring.h"
using namespace regie;
namespace {
bool line(std::string& value) {
  char bytes[1025];
  if (!std::cin.getline(bytes, sizeof(bytes))) {
    if (std::cin.eof() && std::cin.gcount() == 0) return false;
    throw std::runtime_error("READER_COMMAND_INVALID");
  }
  if (std::cin.eof()) throw std::runtime_error("READER_COMMAND_INVALID");
  value.assign(bytes, static_cast<size_t>(std::cin.gcount()) - 1);
  if (value.find('\0') != std::string::npos || value.size() > 1024) throw std::runtime_error("READER_COMMAND_INVALID");
  return true;
}
std::wstring wide(const std::string& value) {
  for (unsigned char c : value) if (c < 32 || c > 126) throw std::runtime_error("READER_COMMAND_INVALID");
  return std::wstring(value.begin(), value.end());
}
std::string ascii(const Token& value) {const auto text = tokenToHex(value); return std::string(text.begin(), text.end());}
void response(const std::string& header, const std::vector<uint8_t>* pixels = nullptr) {
  if (header.empty() || header.size() > 1024 || (pixels && pixels->size() != 8294400)) throw std::runtime_error("READER_RESPONSE_INVALID");
  uint32_t fields[4]{0x50465247, 1, static_cast<uint32_t>(header.size()), pixels ? static_cast<uint32_t>(pixels->size()) : 0};
  std::cout.write(reinterpret_cast<const char*>(fields), sizeof(fields));
  std::cout.write(header.data(), static_cast<std::streamsize>(header.size()));
  if (pixels) std::cout.write(reinterpret_cast<const char*>(pixels->data()), static_cast<std::streamsize>(pixels->size()));
  std::cout.flush();
  if (!std::cout) throw std::runtime_error("READER_PIPE_CLOSED");
}
std::string identity(const RingConfig& config) {return "\"sessionId\":\"" + ascii(config.session) + "\",\"generation\":\"" + ascii(config.generation) + "\"";}
uint64_t sequence(const std::string& text) {
  uint64_t value = 0;
  if (text.empty() || text.size() > 16 || text.find_first_not_of("0123456789") != std::string::npos) throw std::runtime_error("READER_COMMAND_INVALID");
  const auto result = std::from_chars(text.data(), text.data() + text.size(), value);
  if (result.ec != std::errc{} || result.ptr != text.data() + text.size() || value > 9007199254740991ULL) throw std::runtime_error("READER_COMMAND_INVALID");
  return value;
}
}
int main() {
  _setmode(_fileno(stdin), _O_BINARY); _setmode(_fileno(stdout), _O_BINARY);
  try {
    std::string input, mode, name, session, generation, extra;
    if (!line(input)) return 0;
    std::istringstream setup(input);
    if (!(setup >> mode >> name >> session >> generation) || mode != "reader" || (setup >> extra)) throw std::runtime_error("READER_COMMAND_INVALID");
    RingConfig config{wide(name), tokenFromHex(wide(session)), tokenFromHex(wide(generation))};
    auto ring = FrameRing::openReadOnly(config);
    response("{\"status\":\"ready\"," + identity(config) + "}");
    while (line(input)) {
      std::string after; std::istringstream command(input);
      if (!(command >> mode >> generation >> after) || mode != "read" || (command >> extra) || tokenFromHex(wide(generation)) != config.generation)
        throw std::runtime_error("READER_COMMAND_INVALID");
      auto frame = ring.readLatest(sequence(after));
      if (!frame) {response("{\"status\":\"empty\"," + identity(config) + "}"); continue;}
      const auto& d = frame->descriptor;
      const std::string header = "{\"status\":\"frame\",\"descriptor\":{" + identity(config) +
        ",\"sequence\":" + std::to_string(d.sequence) + ",\"capturedQpc\":\"" + std::to_string(d.capturedQpc) +
        "\",\"qpcFrequency\":\"" + std::to_string(d.qpcFrequency) + "\",\"width\":1920,\"height\":1080,\"stride\":7680,\"byteLength\":8294400}}";
      response(header, &frame->pixels);
    }
    return 0;
  } catch (const std::exception&) {
    try {response("{\"status\":\"error\",\"code\":\"NATIVE_READER_FAILED\"}");} catch (...) {}
    return 1;
  }
}
