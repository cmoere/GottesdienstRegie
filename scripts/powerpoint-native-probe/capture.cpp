#define NOMINMAX
#include <windows.h>
#include <d3d11.h>
#include <d3dcompiler.h>
#include <dxgi1_2.h>
#include <windows.graphics.capture.interop.h>
#include <windows.graphics.directx.direct3d11.interop.h>
#include <winrt/Windows.Foundation.h>
#include <winrt/Windows.Graphics.Capture.h>
#include <winrt/Windows.Graphics.DirectX.h>
#include <winrt/Windows.Graphics.DirectX.Direct3D11.h>
#include <atomic>
#include <algorithm>
#include <charconv>
#include <cstring>
#include <iostream>
#include <mutex>
#include <sstream>
#include <thread>
#include "frame-ring.h"

using namespace winrt;
using namespace winrt::Windows::Graphics::Capture;
using namespace winrt::Windows::Graphics::DirectX;
using namespace winrt::Windows::Graphics::DirectX::Direct3D11;
namespace {
std::mutex statusMutex;
void status(const char* value, const char* code = "") {
  std::lock_guard<std::mutex> lock(statusMutex);
  if (!std::all_of(code, code + std::strlen(code), [](char c) {return (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_';})) code = "SOURCE_CAPTURE_FAILED";
  std::cout << "{\"status\":\"" << value << "\",\"code\":\"" << code << "\"}" << std::endl;
}
uint64_t number(const std::string& text) {
  uint64_t value = 0;
  if (text.empty() || text.size() > 20 || text.find_first_not_of("0123456789") != std::string::npos) throw std::runtime_error("SOURCE_CONFIG_INVALID");
  const auto parsed = std::from_chars(text.data(), text.data() + text.size(), value);
  if (parsed.ec != std::errc{} || parsed.ptr != text.data() + text.size()) throw std::runtime_error("SOURCE_CONFIG_INVALID");
  return value;
}
struct Owner {HWND window; DWORD pid; uint64_t createdAt; uint32_t x, y, width, height, outerWidth, outerHeight;};
uint64_t processCreated(DWORD pid) {
  HANDLE process = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, pid);
  if (!process) throw std::runtime_error("SOURCE_OWNER_MISMATCH");
  FILETIME created{}, exit{}, kernel{}, user{};
  const BOOL ok = GetProcessTimes(process, &created, &exit, &kernel, &user); CloseHandle(process);
  if (!ok) throw std::runtime_error("SOURCE_OWNER_MISMATCH");
  return (static_cast<uint64_t>(created.dwHighDateTime) << 32) | created.dwLowDateTime;
}
void validateOwner(const Owner& owner) {
  DWORD pid = 0;
  if (!IsWindow(owner.window) || GetAncestor(owner.window, GA_ROOT) != owner.window || !GetWindowThreadProcessId(owner.window, &pid) ||
      pid != owner.pid || processCreated(pid) != owner.createdAt) throw std::runtime_error("SOURCE_OWNER_MISMATCH");
  RECT rect{};
  if (!GetWindowRect(owner.window, &rect) || rect.right - rect.left != static_cast<LONG>(owner.outerWidth) || rect.bottom - rect.top != static_cast<LONG>(owner.outerHeight))
    throw std::runtime_error("SOURCE_GEOMETRY_CHANGED");
}
void cropValid(const Owner& o) {
  if (!o.width || !o.height || !o.outerWidth || !o.outerHeight || o.outerWidth > 4096 || o.outerHeight > 2160 ||
      o.x > o.outerWidth || o.y > o.outerHeight || o.width > o.outerWidth - o.x || o.height > o.outerHeight - o.y)
    throw std::runtime_error("SOURCE_CROP_INVALID");
}
struct FrameLease {Direct3D11CaptureFrame value{nullptr}; ~FrameLease() {try {if (value) value.Close();} catch (...) {}}};
struct Capture : std::enable_shared_from_this<Capture> {
  Owner owner; regie::RingConfig config; regie::FrameRing ring;
  com_ptr<ID3D11Device> device; com_ptr<ID3D11DeviceContext> context;
  com_ptr<ID3D11Texture2D> sampled, target, staging;
  com_ptr<ID3D11RenderTargetView> targetView; com_ptr<ID3D11ShaderResourceView> sampleView;
  com_ptr<ID3D11VertexShader> vertex; com_ptr<ID3D11PixelShader> pixel;
  com_ptr<ID3D11SamplerState> sampler; com_ptr<ID3D11Buffer> constants;
  GraphicsCaptureItem item{nullptr}; Direct3D11CaptureFramePool pool{nullptr}; GraphicsCaptureSession session{nullptr};
  event_token framesToken{}, closedToken{};
  std::mutex work; std::atomic<bool> stopping{false}, failed{false};
  HANDLE stopEvent = nullptr; std::thread ownerMonitor;
  uint64_t sequence = 0, lastPublishedQpc = 0; LARGE_INTEGER frequency{};
  bool hasFrame = false, framesHandler = false, closedHandler = false;
  Capture(const Owner& o, const regie::RingConfig& c) : owner(o), config(c), ring(regie::FrameRing::create(c)) {}
  void initialize() {
    validateOwner(owner); cropValid(owner);
    if (!GraphicsCaptureSession::IsSupported()) throw std::runtime_error("SOURCE_CAPTURE_UNSUPPORTED");
    if (!QueryPerformanceFrequency(&frequency) || frequency.QuadPart <= 0) throw std::runtime_error("SOURCE_CLOCK_FAILED");
    D3D_FEATURE_LEVEL level;
    check_hresult(D3D11CreateDevice(nullptr, D3D_DRIVER_TYPE_HARDWARE, nullptr, D3D11_CREATE_DEVICE_BGRA_SUPPORT, nullptr, 0, D3D11_SDK_VERSION, device.put(), &level, context.put()));
    const char* shader = R"(
cbuffer Crop:register(b0){float4 crop;}
struct V{float4 position:SV_POSITION;float2 uv:TEXCOORD0;};
V vs(uint id:SV_VertexID){float2 p[3]={float2(-1,-1),float2(-1,3),float2(3,-1)};V o;o.position=float4(p[id],0,1);o.uv=float2((p[id].x+1)*.5,1-(p[id].y+1)*.5);return o;}
Texture2D source:register(t0);SamplerState sampleState:register(s0);
float4 ps(V v):SV_TARGET{float4 c=source.Sample(sampleState,crop.xy+v.uv*crop.zw);return float4(c.rgb,1);}
)";
    com_ptr<ID3DBlob> vs, ps, errors;
    check_hresult(D3DCompile(shader, std::strlen(shader), nullptr, nullptr, nullptr, "vs", "vs_5_0", D3DCOMPILE_OPTIMIZATION_LEVEL3, 0, vs.put(), errors.put()));
    errors = nullptr;
    check_hresult(D3DCompile(shader, std::strlen(shader), nullptr, nullptr, nullptr, "ps", "ps_5_0", D3DCOMPILE_OPTIMIZATION_LEVEL3, 0, ps.put(), errors.put()));
    check_hresult(device->CreateVertexShader(vs->GetBufferPointer(), vs->GetBufferSize(), nullptr, vertex.put()));
    check_hresult(device->CreatePixelShader(ps->GetBufferPointer(), ps->GetBufferSize(), nullptr, pixel.put()));
    D3D11_TEXTURE2D_DESC texture{}; texture.Width = 1920; texture.Height = 1080; texture.MipLevels = 1; texture.ArraySize = 1;
    texture.Format = DXGI_FORMAT_B8G8R8A8_UNORM; texture.SampleDesc.Count = 1; texture.Usage = D3D11_USAGE_DEFAULT; texture.BindFlags = D3D11_BIND_RENDER_TARGET;
    check_hresult(device->CreateTexture2D(&texture, nullptr, target.put()));
    check_hresult(device->CreateRenderTargetView(target.get(), nullptr, targetView.put()));
    texture.Usage = D3D11_USAGE_STAGING; texture.BindFlags = 0; texture.CPUAccessFlags = D3D11_CPU_ACCESS_READ;
    check_hresult(device->CreateTexture2D(&texture, nullptr, staging.put()));
    texture.Width = owner.outerWidth; texture.Height = owner.outerHeight; texture.Usage = D3D11_USAGE_DEFAULT; texture.BindFlags = D3D11_BIND_SHADER_RESOURCE; texture.CPUAccessFlags = 0;
    check_hresult(device->CreateTexture2D(&texture, nullptr, sampled.put()));
    check_hresult(device->CreateShaderResourceView(sampled.get(), nullptr, sampleView.put()));
    D3D11_SAMPLER_DESC sampling{}; sampling.Filter = D3D11_FILTER_MIN_MAG_MIP_POINT; sampling.AddressU = sampling.AddressV = sampling.AddressW = D3D11_TEXTURE_ADDRESS_CLAMP; sampling.MaxLOD = D3D11_FLOAT32_MAX;
    check_hresult(device->CreateSamplerState(&sampling, sampler.put()));
    const float crop[4]{static_cast<float>(owner.x) / owner.outerWidth, static_cast<float>(owner.y) / owner.outerHeight, static_cast<float>(owner.width) / owner.outerWidth, static_cast<float>(owner.height) / owner.outerHeight};
    D3D11_BUFFER_DESC buffer{}; buffer.ByteWidth = sizeof(crop); buffer.Usage = D3D11_USAGE_IMMUTABLE; buffer.BindFlags = D3D11_BIND_CONSTANT_BUFFER;
    D3D11_SUBRESOURCE_DATA data{}; data.pSysMem = crop;
    check_hresult(device->CreateBuffer(&buffer, &data, constants.put()));
    com_ptr<IInspectable> wrapped;
    check_hresult(CreateDirect3D11DeviceFromDXGIDevice(device.as<IDXGIDevice>().get(), wrapped.put()));
    const auto interop = get_activation_factory<GraphicsCaptureItem, IGraphicsCaptureItemInterop>();
    check_hresult(interop->CreateForWindow(owner.window, guid_of<GraphicsCaptureItem>(), put_abi(item)));
    if (item.Size().Width != static_cast<int>(owner.outerWidth) || item.Size().Height != static_cast<int>(owner.outerHeight)) throw std::runtime_error("SOURCE_GEOMETRY_CHANGED");
    pool = Direct3D11CaptureFramePool::CreateFreeThreaded(wrapped.as<IDirect3DDevice>(), DirectXPixelFormat::B8G8R8A8UIntNormalized, 3, item.Size());
    session = pool.CreateCaptureSession(item);
    const auto self = shared_from_this();
    framesToken = pool.FrameArrived([self](const auto& sender, const auto&) {self->frame(sender);});
    framesHandler = true;
    closedToken = item.Closed([self](const auto&, const auto&) {std::lock_guard<std::mutex> lock(self->work); self->lose("SOURCE_WINDOW_CLOSED");});
    closedHandler = true;
    status("ready"); session.StartCapture();
    stopEvent = CreateEventW(nullptr, TRUE, FALSE, nullptr);
    if (!stopEvent) throw std::runtime_error("SOURCE_MONITOR_FAILED");
    // WGC may stop sending frames without raising Closed. Ownership must expire
    // independently of frame events; otherwise an exited source still looks live.
    ownerMonitor = std::thread([self] {
      while (WaitForSingleObject(self->stopEvent, 100) == WAIT_TIMEOUT) {
        std::lock_guard<std::mutex> lock(self->work);
        if (self->stopping || self->failed) break;
        try {validateOwner(self->owner); if (IsIconic(self->owner.window)) self->lose("SOURCE_MINIMIZED");}
        catch (const std::exception& e) {self->lose(e.what());}
      }
    });
  }
  void lose(const char* reason) {
    if (!stopping && !failed.exchange(true)) status("source-lost", reason);
  }
  void clock(uint64_t requestId) {
    LARGE_INTEGER now{};
    if (!QueryPerformanceCounter(&now)) throw std::runtime_error("SOURCE_CLOCK_FAILED");
    std::lock_guard<std::mutex> lock(statusMutex);
    std::cout << "{\"status\":\"clock\",\"requestId\":" << requestId << ",\"qpcNow\":\"" << now.QuadPart << "\",\"qpcFrequency\":\"" << frequency.QuadPart << "\"}" << std::endl;
  }
  void frame(const Direct3D11CaptureFramePool& sender) {
    std::lock_guard<std::mutex> lock(work);
    if (stopping || failed) return;
    FrameLease lease;
    try {
      lease.value = sender.TryGetNextFrame(); if (!lease.value) return;
      while (true) {auto newer = sender.TryGetNextFrame(); if (!newer) break; lease.value.Close(); lease.value = newer;}
      validateOwner(owner);
      if (IsIconic(owner.window)) {lose("SOURCE_MINIMIZED"); return;}
      const auto size = lease.value.ContentSize();
      if (size.Width != static_cast<int>(owner.outerWidth) || size.Height != static_cast<int>(owner.outerHeight)) {lose("SOURCE_GEOMETRY_CHANGED"); return;}
      const auto captureTime = static_cast<uint64_t>(static_cast<long double>(lease.value.SystemRelativeTime().count()) * frequency.QuadPart / 10000000.0L);
      if (!captureTime || captureTime <= lastPublishedQpc || captureTime - lastPublishedQpc < static_cast<uint64_t>(frequency.QuadPart / 30)) return;
      auto access = lease.value.Surface().as<::Windows::Graphics::DirectX::Direct3D11::IDirect3DDxgiInterfaceAccess>();
      com_ptr<ID3D11Texture2D> source;
      check_hresult(access->GetInterface(__uuidof(ID3D11Texture2D), source.put_void()));
      D3D11_TEXTURE2D_DESC input{}; source->GetDesc(&input);
      if (input.Width < owner.outerWidth || input.Height < owner.outerHeight || input.Format != DXGI_FORMAT_B8G8R8A8_UNORM) throw std::runtime_error("SOURCE_SURFACE_INVALID");
      D3D11_BOX box{0, 0, 0, owner.outerWidth, owner.outerHeight, 1};
      context->CopySubresourceRegion(sampled.get(), 0, 0, 0, 0, source.get(), 0, &box);
      constexpr float black[4]{0, 0, 0, 1}; context->ClearRenderTargetView(targetView.get(), black);
      const float scale = std::min(1920.0f / owner.width, 1080.0f / owner.height);
      D3D11_VIEWPORT viewport{(1920 - owner.width * scale) / 2, (1080 - owner.height * scale) / 2, owner.width * scale, owner.height * scale, 0, 1};
      context->RSSetViewports(1, &viewport);
      ID3D11RenderTargetView* outputView = targetView.get(); context->OMSetRenderTargets(1, &outputView, nullptr);
      context->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST);
      context->VSSetShader(vertex.get(), nullptr, 0); context->PSSetShader(pixel.get(), nullptr, 0);
      ID3D11ShaderResourceView* view = sampleView.get(); context->PSSetShaderResources(0, 1, &view);
      ID3D11SamplerState* state = sampler.get(); context->PSSetSamplers(0, 1, &state);
      ID3D11Buffer* constant = constants.get(); context->PSSetConstantBuffers(0, 1, &constant);
      context->Draw(3, 0);
      view = nullptr; context->PSSetShaderResources(0, 1, &view);
      context->CopyResource(staging.get(), target.get());
      std::vector<uint8_t> pixels(8294400);
      D3D11_MAPPED_SUBRESOURCE mapped{}; check_hresult(context->Map(staging.get(), 0, D3D11_MAP_READ, 0, &mapped));
      if (mapped.RowPitch < 7680) {context->Unmap(staging.get(), 0); throw std::runtime_error("SOURCE_SURFACE_INVALID");}
      for (size_t row = 0; row < 1080; ++row) std::memcpy(pixels.data() + row * 7680, static_cast<const uint8_t*>(mapped.pData) + row * mapped.RowPitch, 7680);
      context->Unmap(staging.get(), 0);
      if (failed || stopping) return;
      ring.publish({config.session, config.generation, ++sequence, captureTime, static_cast<uint64_t>(frequency.QuadPart), 1920, 1080, 7680, 8294400}, pixels);
      lastPublishedQpc = captureTime;
      if (!hasFrame) {hasFrame = true; status("capturing");}
    } catch (const std::exception& e) {lose(e.what());}
    catch (...) {lose("SOURCE_CAPTURE_FAILED");}
  }
  void stop() noexcept {
    if (stopping.exchange(true)) return;
    if (stopEvent) SetEvent(stopEvent);
    if (ownerMonitor.joinable()) ownerMonitor.join();
    if (stopEvent) {CloseHandle(stopEvent); stopEvent = nullptr;}
    try {if (framesHandler) {pool.FrameArrived(framesToken); framesHandler = false;}} catch (...) {}
    try {if (closedHandler) {item.Closed(closedToken); closedHandler = false;}} catch (...) {}
    std::lock_guard<std::mutex> lock(work);
    try {if (session) session.Close(); if (pool) pool.Close();} catch (...) {}
    ring.close(); status("closed");
  }
  ~Capture() {stop();}
};
}
int main() {
  SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);
  std::shared_ptr<Capture> capture;
  try {
    init_apartment(apartment_type::multi_threaded);
    char buffer[1025]; if (!std::cin.getline(buffer, sizeof(buffer))) throw std::runtime_error("SOURCE_CONFIG_INVALID");
    const std::string line(buffer, static_cast<size_t>(std::cin.gcount()) - 1);
    if (line.find('\0') != std::string::npos) throw std::runtime_error("SOURCE_CONFIG_INVALID");
    std::istringstream input(line); std::vector<std::string> words;
    std::string word; while (input >> word) words.push_back(word);
    if (words.size() != 13 || words[0] != "capture") throw std::runtime_error("SOURCE_CONFIG_INVALID");
    const uint64_t pid = number(words[2]);
    if (!pid || pid > MAXDWORD) throw std::runtime_error("SOURCE_CONFIG_INVALID");
    Owner owner{reinterpret_cast<HWND>(static_cast<uintptr_t>(number(words[1]))), static_cast<DWORD>(pid), number(words[3]), 0, 0, 0, 0, 0, 0};
    uint32_t* coordinates[]{&owner.x, &owner.y, &owner.width, &owner.height, &owner.outerWidth, &owner.outerHeight};
    for (int i = 0; i < 6; ++i) {const auto value = number(words[4 + i]); if (value > MAXDWORD) throw std::runtime_error("SOURCE_CROP_INVALID"); *coordinates[i] = static_cast<uint32_t>(value);}
    auto wide = [](const std::string& value) {if (value.find_first_not_of("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.\\") != std::string::npos) throw std::runtime_error("SOURCE_CONFIG_INVALID"); return std::wstring(value.begin(), value.end());};
    regie::RingConfig config{wide(words[10]), regie::tokenFromHex(wide(words[11])), regie::tokenFromHex(wide(words[12]))};
    cropValid(owner); validateOwner(owner);
    capture = std::make_shared<Capture>(owner, config); capture->initialize();
    while (std::cin.getline(buffer, sizeof(buffer))) {
      const std::string command(buffer, static_cast<size_t>(std::cin.gcount()) - 1);
      if (command.find('\0') != std::string::npos) throw std::runtime_error("SOURCE_COMMAND_INVALID");
      if (command == "stop") break;
      std::istringstream request(command); std::string mode, id, extra;
      if (!(request >> mode >> id) || mode != "clock" || (request >> extra)) throw std::runtime_error("SOURCE_COMMAND_INVALID");
      const auto serial = number(id); if (!serial || serial > 9007199254740991ULL) throw std::runtime_error("SOURCE_COMMAND_INVALID");
      capture->clock(serial);
    }
    capture->stop(); return 0;
  } catch (const std::exception& e) {status("error", e.what());}
  catch (...) {status("error", "SOURCE_CAPTURE_FAILED");}
  if (capture) capture->stop(); return 1;
}
