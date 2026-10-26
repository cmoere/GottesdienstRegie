#include "gpu-targets.h"
#include "producer-io.h"
#include "capture-cadence.h"
#include <tlhelp32.h>
#include <bcrypt.h>
#include <d3dcompiler.h>
#include <windows.graphics.capture.interop.h>
#include <windows.graphics.directx.direct3d11.interop.h>
#include <winrt/Windows.Foundation.h>
#include <winrt/Windows.Graphics.Capture.h>
#include <winrt/Windows.Graphics.DirectX.h>
#include <winrt/Windows.Graphics.DirectX.Direct3D11.h>
#include <atomic>
#include <memory>
#include <sstream>
#ifndef REGIE_GPU_CAPTURE_HZ
#define REGIE_GPU_CAPTURE_HZ 30
#endif
static_assert(REGIE_GPU_CAPTURE_HZ == 30 || REGIE_GPU_CAPTURE_HZ == 60, "Unsupported capture rate");

using namespace winrt;
using namespace winrt::Windows::Graphics::Capture;
using namespace winrt::Windows::Graphics::DirectX;
using namespace winrt::Windows::Graphics::DirectX::Direct3D11;
using namespace gpu_probe;
namespace {
struct Handle {
  HANDLE value = nullptr;
  Handle() = default;
  explicit Handle(HANDLE h) : value(h) { if (!h || h == INVALID_HANDLE_VALUE) throw std::runtime_error("GPU_HANDLE_FAILED"); }
  Handle(const Handle&) = delete;
  Handle& operator=(const Handle&) = delete;
  ~Handle() { if (value && value != INVALID_HANDLE_VALUE) CloseHandle(value); }
};
std::uint64_t qpc() {
  LARGE_INTEGER value{};
  if (!QueryPerformanceCounter(&value) || value.QuadPart <= 0) throw std::runtime_error("GPU_CLOCK_FAILED");
  return static_cast<std::uint64_t>(value.QuadPart);
}
std::uint64_t created(HANDLE process) {
  FILETIME start{}, exit{}, kernel{}, user{};
  if (!GetProcessTimes(process, &start, &exit, &kernel, &user)) throw std::runtime_error("GPU_OWNER_MISMATCH");
  return (static_cast<std::uint64_t>(start.dwHighDateTime) << 32) | start.dwLowDateTime;
}
DWORD actualParent() {
  Handle snapshot(CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0));
  PROCESSENTRY32W entry{}; entry.dwSize = sizeof(entry);
  if (!Process32FirstW(snapshot.value, &entry)) throw std::runtime_error("GPU_PARENT_FAILED");
  do { if (entry.th32ProcessID == GetCurrentProcessId()) return entry.th32ParentProcessID; } while (Process32NextW(snapshot.value, &entry));
  throw std::runtime_error("GPU_PARENT_FAILED");
}
std::string randomNonce() {
  unsigned char bytes[16];
  if (BCryptGenRandom(nullptr, bytes, sizeof(bytes), BCRYPT_USE_SYSTEM_PREFERRED_RNG) < 0) throw std::runtime_error("GPU_RANDOM_FAILED");
  constexpr char digits[] = "0123456789abcdef"; std::string value;
  for (auto b : bytes) { value += digits[b >> 4]; value += digits[b & 15]; } return value;
}
void validateLifetime(const StartConfig& config) {
  const auto& o = config.owner;
  if (!o.childWindow) return; // Legacy synthetic probe sources only.
  const auto root = reinterpret_cast<HWND>(static_cast<std::uintptr_t>(o.window));
  const auto child = reinterpret_cast<HWND>(static_cast<std::uintptr_t>(o.childWindow));
  const std::wstring marker = L"GDR.PowerPoint." + std::wstring(config.generation.begin(), config.generation.end());
  const auto cookie = reinterpret_cast<HANDLE>(static_cast<std::uintptr_t>(o.lifetimeValue));
  DWORD pid = 0;
  if (!IsWindow(child) || !IsWindowVisible(child) || GetAncestor(child, GA_ROOT) != root
      || !GetWindowThreadProcessId(child, &pid) || pid != o.pid
      || GetPropW(root, marker.c_str()) != cookie || GetPropW(child, marker.c_str()) != cookie)
    throw std::runtime_error("SOURCE_LIFETIME_ENDED");
}
void validateOwner(const StartConfig& config) {
  const auto& o = config.owner;
  validateLifetime(config);
  const auto window = reinterpret_cast<HWND>(static_cast<std::uintptr_t>(o.window));
  DWORD pid = 0;
  if (!IsWindow(window) || GetAncestor(window, GA_ROOT) != window || !GetWindowThreadProcessId(window, &pid) || pid != o.pid)
    throw std::runtime_error("SOURCE_OWNER_MISMATCH");
  Handle process(OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, pid));
  if (created(process.value) != o.createdAt) throw std::runtime_error("SOURCE_OWNER_MISMATCH");
  if (IsIconic(window)) throw std::runtime_error("SOURCE_MINIMIZED");
  RECT bounds{};
  if (!GetWindowRect(window, &bounds) || bounds.right - bounds.left != static_cast<LONG>(o.outerWidth)
      || bounds.bottom - bounds.top != static_cast<LONG>(o.outerHeight)) throw std::runtime_error("SOURCE_GEOMETRY_CHANGED");
}
void hideMarkedSourceAfterParentLoss(const StartConfig& config) noexcept {
  // A generic diagnostic HWND is never authority to hide another app. The
  // actual child, markers, PID and start time must still match. A slideshow
  // root recycled for an editor is deliberately left untouched.
  if (!config.owner.childWindow) return;
  try {
    validateOwner(config);
    ShowWindow(reinterpret_cast<HWND>(static_cast<std::uintptr_t>(config.owner.window)), SW_HIDE);
  } catch (...) {}
}
std::string keyJson(const FrameKey& key) {
  return "{\"sessionId\":\"" + key.sessionId + "\",\"generation\":\"" + key.generation + "\",\"slotId\":"
    + std::to_string(key.slotId) + ",\"sequence\":" + std::to_string(key.sequence) + "}";
}
std::string recordJson(const FrameRecord& record) {
  const auto& t = record.times;
  return "{\"key\":" + keyJson(record.key) + ",\"width\":1920,\"height\":1080,\"pixelFormat\":\"bgra\",\"times\":{\"sourceReportedQpc\":"
    + (t.sourceReportedQpc ? "\"" + std::to_string(*t.sourceReportedQpc) + "\"" : "null")
    + ",\"acquiredQpc\":\"" + std::to_string(t.acquiredQpc) + "\",\"copyDoneQpc\":\"" + std::to_string(t.copyDoneQpc)
    + "\",\"qpcFrequency\":\"" + std::to_string(t.qpcFrequency) + "\"}}";
}

struct PipeControl {
  CommandInbox inbox; ResponseQueue replies;
  Handle control{CreateEventW(nullptr, FALSE, FALSE, nullptr)}, writable{CreateEventW(nullptr, FALSE, FALSE, nullptr)};
  std::atomic<bool> eof{false}, failed{false}, stopping{false};
  std::thread reader, writer;
  PipeControl() {
    reader = std::thread([this] {
      char bytes[1024]; DWORD count = 0;
      while (!stopping && ReadFile(GetStdHandle(STD_INPUT_HANDLE), bytes, sizeof(bytes), &count, nullptr) && count) {
        if (!inbox.feed(std::string_view(bytes, count))) { failed = true; SetEvent(control.value); return; }
        SetEvent(control.value);
      }
      if (!inbox.finish()) failed = true;
      eof = true; SetEvent(control.value);
    });
    writer = std::thread([this] {
      while (true) {
        WaitForSingleObject(writable.value, INFINITE);
        while (auto value = replies.take()) {
          value->push_back('\n'); DWORD offset = 0;
          while (offset < value->size()) {
            DWORD count = 0;
            if (!WriteFile(GetStdHandle(STD_OUTPUT_HANDLE), value->data() + offset, static_cast<DWORD>(value->size() - offset), &count, nullptr) || !count) {
              failed = true; SetEvent(control.value); return;
            }
            offset += count;
          }
        }
        if (stopping) return;
      }
    });
  }
  void send(std::string line) {
    if (!replies.push(std::move(line))) { failed = true; SetEvent(control.value); }
    SetEvent(writable.value);
  }
  ~PipeControl() {
    stopping = true; SetEvent(writable.value);
    if (reader.joinable()) { CancelSynchronousIo(reader.native_handle()); reader.join(); }
    if (writer.joinable()) {
      if (WaitForSingleObject(writer.native_handle(), 1500) != WAIT_OBJECT_0) CancelSynchronousIo(writer.native_handle());
      writer.join();
    }
  }
};
struct Signals {
  Handle frames{CreateEventW(nullptr, FALSE, FALSE, nullptr)};
  std::atomic<bool> closed{false};
};
struct PendingCopy {
  Direct3D11CaptureFrame frame{nullptr};
  FrameKey key{}; FrameTimes times{};
};
struct Capture {
  const StartConfig config;
  SlotPool slots;
  GpuTargets gpu;
  std::unique_ptr<Handle> sourceHelper;
  const std::shared_ptr<Signals> signals = std::make_shared<Signals>();
  std::uint64_t frequency = 0, nextFrame = 0, origin = 0, ownerCheck = 0;
  bool running = true, framesHooked = false, closedHooked = false, announcedLost = false;
  GraphicsCaptureItem item{nullptr}; Direct3D11CaptureFramePool pool{nullptr}; GraphicsCaptureSession session{nullptr};
  event_token framesToken{}, closedToken{};
  std::array<PendingCopy, 3> pending{};
  com_ptr<ID3D11Texture2D> sampled;
  com_ptr<ID3D11ShaderResourceView> sampleView;
  com_ptr<ID3D11VertexShader> vertex; com_ptr<ID3D11PixelShader> pixel;
  com_ptr<ID3D11SamplerState> sampler; com_ptr<ID3D11Buffer> constants;
  explicit Capture(StartConfig c) : config(std::move(c)), slots(config.sessionId, config.generation) {}
  void initialize(HANDLE parent) {
    validateOwner(config);
    if(config.owner.childWindow){
      sourceHelper=std::make_unique<Handle>(OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION|SYNCHRONIZE,FALSE,static_cast<DWORD>(config.owner.lifetimeValue)));
      if(WaitForSingleObject(sourceHelper->value,0)!=WAIT_TIMEOUT)throw std::runtime_error("SOURCE_HELPER_EXITED");
      validateOwner(config);
    }
    if (!GraphicsCaptureSession::IsSupported()) throw std::runtime_error("SOURCE_CAPTURE_UNSUPPORTED");
    LARGE_INTEGER f{}; if (!QueryPerformanceFrequency(&f) || f.QuadPart <= 0) throw std::runtime_error("GPU_CLOCK_FAILED");
    frequency = static_cast<std::uint64_t>(f.QuadPart);
    gpu.initialize(parent);
    const char* shader = R"(
cbuffer Crop:register(b0){float4 crop;}
struct V{float4 position:SV_POSITION;float2 uv:TEXCOORD0;};
V vs(uint id:SV_VertexID){float2 p[3]={float2(-1,-1),float2(-1,3),float2(3,-1)};V o;o.position=float4(p[id],0,1);o.uv=float2((p[id].x+1)*.5,1-(p[id].y+1)*.5);return o;}
Texture2D source:register(t0);SamplerState sampleState:register(s0);
float4 ps(V v):SV_TARGET{float4 c=source.Sample(sampleState,crop.xy+v.uv*crop.zw);return float4(c.rgb,1);}
)";
    com_ptr<ID3DBlob> vs, ps, errors;
    check_hresult(D3DCompile(shader, strlen(shader), nullptr, nullptr, nullptr, "vs", "vs_5_0", D3DCOMPILE_OPTIMIZATION_LEVEL3, 0, vs.put(), errors.put()));
    errors = nullptr;
    check_hresult(D3DCompile(shader, strlen(shader), nullptr, nullptr, nullptr, "ps", "ps_5_0", D3DCOMPILE_OPTIMIZATION_LEVEL3, 0, ps.put(), errors.put()));
    check_hresult(gpu.device->CreateVertexShader(vs->GetBufferPointer(), vs->GetBufferSize(), nullptr, vertex.put()));
    check_hresult(gpu.device->CreatePixelShader(ps->GetBufferPointer(), ps->GetBufferSize(), nullptr, pixel.put()));
    const auto& o = config.owner;
    D3D11_TEXTURE2D_DESC desc{}; desc.Width = o.outerWidth; desc.Height = o.outerHeight;
    desc.MipLevels = 1; desc.ArraySize = 1; desc.Format = DXGI_FORMAT_B8G8R8A8_UNORM; desc.SampleDesc.Count = 1;
    desc.Usage = D3D11_USAGE_DEFAULT; desc.BindFlags = D3D11_BIND_SHADER_RESOURCE;
    check_hresult(gpu.device->CreateTexture2D(&desc, nullptr, sampled.put()));
    check_hresult(gpu.device->CreateShaderResourceView(sampled.get(), nullptr, sampleView.put()));
    D3D11_SAMPLER_DESC sampling{}; sampling.Filter = D3D11_FILTER_MIN_MAG_MIP_POINT;
    sampling.AddressU = sampling.AddressV = sampling.AddressW = D3D11_TEXTURE_ADDRESS_CLAMP; sampling.MaxLOD = D3D11_FLOAT32_MAX;
    check_hresult(gpu.device->CreateSamplerState(&sampling, sampler.put()));
    const float crop[4]{static_cast<float>(o.x) / o.outerWidth, static_cast<float>(o.y) / o.outerHeight,
      static_cast<float>(o.width) / o.outerWidth, static_cast<float>(o.height) / o.outerHeight};
    D3D11_BUFFER_DESC constant{}; constant.ByteWidth = sizeof(crop); constant.Usage = D3D11_USAGE_IMMUTABLE; constant.BindFlags = D3D11_BIND_CONSTANT_BUFFER;
    D3D11_SUBRESOURCE_DATA data{}; data.pSysMem = crop;
    check_hresult(gpu.device->CreateBuffer(&constant, &data, constants.put()));
    com_ptr<IInspectable> wrapped;
    check_hresult(CreateDirect3D11DeviceFromDXGIDevice(gpu.device.as<IDXGIDevice>().get(), wrapped.put()));
    const auto interop = get_activation_factory<GraphicsCaptureItem, IGraphicsCaptureItemInterop>();
    check_hresult(interop->CreateForWindow(reinterpret_cast<HWND>(static_cast<std::uintptr_t>(o.window)), guid_of<GraphicsCaptureItem>(), put_abi(item)));
    if (item.Size().Width != static_cast<int>(o.outerWidth) || item.Size().Height != static_cast<int>(o.outerHeight)) throw std::runtime_error("SOURCE_CAPTURE_GEOMETRY_" + std::to_string(item.Size().Width) + "X" + std::to_string(item.Size().Height));
    pool = Direct3D11CaptureFramePool::CreateFreeThreaded(wrapped.as<IDirect3DDevice>(), DirectXPixelFormat::B8G8R8A8UIntNormalized, 3, item.Size());
    session = pool.CreateCaptureSession(item);
    const auto signal = signals;
    framesToken = pool.FrameArrived([signal](const auto&, const auto&) { SetEvent(signal->frames.value); }); framesHooked = true;
    closedToken = item.Closed([signal](const auto&, const auto&) { signal->closed = true; SetEvent(signal->frames.value); }); closedHooked = true;
    session.IsCursorCaptureEnabled(false);
    origin = nextFrame = ownerCheck = qpc();
    session.StartCapture();
  }
  void stopAccepting() {
    if (!running) return;
    running = false; slots.revoke();
    if (session) session.Close();
  }
  template<class Published> void tick(Published published) {
    const auto now = qpc();
    if(running&&sourceHelper&&WaitForSingleObject(sourceHelper->value,0)!=WAIT_TIMEOUT){hideMarkedSourceAfterParentLoss(config);throw std::runtime_error("SOURCE_HELPER_EXITED");}
    if (running) validateLifetime(config);
    for (unsigned id = 0; id < 3; ++id) if (pending[id].frame) {
      if (now - pending[id].times.acquiredQpc > frequency * 5) throw std::runtime_error("GPU_COPY_TIMEOUT");
      if (gpu.copyDone(id)) {
        auto& copy = pending[id]; copy.times.copyDoneQpc = qpc(); copy.frame.Close(); copy.frame = nullptr;
        if (!slots.completeWrite(copy.key, copy.times)) throw std::runtime_error("GPU_COMPLETION_INVALID");
        if (running) published();
      }
    }
    if (!running) return;
    if (signals->closed) throw std::runtime_error("SOURCE_WINDOW_CLOSED");
    if (now >= ownerCheck) { validateOwner(config); ownerCheck = now + frequency / 10; }
    captureAtDeadline(now, origin, frequency, nextFrame, [&]() -> bool {
    Direct3D11CaptureFrame frame{nullptr};
    try {
      for (unsigned i = 0; i < 3; ++i) {
        auto newer = pool.TryGetNextFrame(); if (!newer) break;
        if (frame) frame.Close(); frame = newer;
      }
      if (!frame) return false;
      const auto& o = config.owner;
      const auto size = frame.ContentSize();
      if (size.Width != static_cast<int>(o.outerWidth) || size.Height != static_cast<int>(o.outerHeight)) throw std::runtime_error("SOURCE_GEOMETRY_CHANGED");
      const auto key = slots.beginWrite();
      if (!key) { frame.Close(); return false; }
      const auto acquired = qpc();
      auto access = frame.Surface().as<::Windows::Graphics::DirectX::Direct3D11::IDirect3DDxgiInterfaceAccess>();
      com_ptr<ID3D11Texture2D> source;
      check_hresult(access->GetInterface(__uuidof(ID3D11Texture2D), source.put_void()));
      D3D11_TEXTURE2D_DESC input{}; source->GetDesc(&input);
      if (input.Width < o.outerWidth || input.Height < o.outerHeight || input.Format != DXGI_FORMAT_B8G8R8A8_UNORM) throw std::runtime_error("SOURCE_SURFACE_INVALID");
      D3D11_BOX box{0, 0, 0, o.outerWidth, o.outerHeight, 1};
      gpu.context->CopySubresourceRegion(sampled.get(), 0, 0, 0, 0, source.get(), 0, &box);
      const float black[4]{0, 0, 0, 1}; gpu.context->ClearRenderTargetView(gpu.slots[key->slotId].view.get(), black);
      const float scale = (std::min)(1920.0f / o.width, 1080.0f / o.height);
      D3D11_VIEWPORT viewport{(1920 - o.width * scale) / 2, (1080 - o.height * scale) / 2, o.width * scale, o.height * scale, 0, 1};
      gpu.context->RSSetViewports(1, &viewport);
      ID3D11RenderTargetView* target = gpu.slots[key->slotId].view.get(); gpu.context->OMSetRenderTargets(1, &target, nullptr);
      gpu.context->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST);
      gpu.context->VSSetShader(vertex.get(), nullptr, 0); gpu.context->PSSetShader(pixel.get(), nullptr, 0);
      ID3D11ShaderResourceView* view = sampleView.get(); gpu.context->PSSetShaderResources(0, 1, &view);
      ID3D11SamplerState* state = sampler.get(); gpu.context->PSSetSamplers(0, 1, &state);
      ID3D11Buffer* constant = constants.get(); gpu.context->PSSetConstantBuffers(0, 1, &constant);
      gpu.context->Draw(3, 0); view = nullptr; gpu.context->PSSetShaderResources(0, 1, &view);
      auto& copy = pending[key->slotId]; copy.key = *key;
      const auto relative = frame.SystemRelativeTime().count();
      copy.times = {relative > 0 ? std::optional<std::uint64_t>(static_cast<std::uint64_t>(static_cast<long double>(relative) * frequency / 10000000.0L)) : std::nullopt,
        acquired, 0, frequency};
      copy.frame = frame; frame = nullptr;
      gpu.submit(key->slotId);
      return true;
    } catch (...) { if (frame) frame.Close(); throw; }
    }, REGIE_GPU_CAPTURE_HZ);
  }
  ~Capture() {
    try { if (framesHooked) pool.FrameArrived(framesToken); } catch (...) {}
    try { if (closedHooked) item.Closed(closedToken); } catch (...) {}
    try { if (session) session.Close(); } catch (...) {}
    for (auto& copy : pending) try { if (copy.frame) copy.frame.Close(); } catch (...) {}
    try { if (pool) pool.Close(); } catch (...) {}
    if (slots.drained()) gpu.closeRemoteHandles();
  }
};
std::string fixedError(const char* raw) {
  const std::string code(raw);
  if (code.size() <= 64 && !code.empty() && code.find_first_not_of("ABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789") == std::string::npos) return code;
  return "GPU_PRODUCER_FAILED";
}
}
int main(int argc, char**) {
  if (argc != 1) return 2;
  SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);
  try {
    init_apartment(apartment_type::multi_threaded);
    const auto parentPid = actualParent();
    Handle parent(OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION | PROCESS_DUP_HANDLE | SYNCHRONIZE, FALSE, parentPid));
    const auto parentCreated = created(parent.value); const auto nonce = randomNonce();
    PipeControl pipe;
    pipe.send("{\"status\":\"hello\",\"protocol\":1,\"parentPid\":" + std::to_string(parentPid) + ",\"parentCreated\":\"" + std::to_string(parentCreated) + "\",\"nonce\":\"" + nonce + "\"}");
    std::unique_ptr<Capture> capture;
    NoticeGate notices;
    bool stop = false, fatal = false, explicitStop = false; std::uint64_t stopDeadline = 0, lastRequest = 0;
    const auto startupDeadline = GetTickCount64() + 10000;
    auto notice = [&](std::uint64_t id) { pipe.send("{\"status\":\"notice\",\"sessionId\":\"" + capture->config.sessionId + "\",\"generation\":\"" + capture->config.generation + "\",\"noticeId\":" + std::to_string(id) + "}"); };
    auto beginStop = [&] { if (!stop) { stop = true; stopDeadline = GetTickCount64() + 2000; if (capture) capture->stopAccepting(); } };
    try {
      while (true) {
        if (WaitForSingleObject(parent.value, 0) != WAIT_TIMEOUT) {
          if (capture) hideMarkedSourceAfterParentLoss(capture->config);
          throw std::runtime_error("GPU_PARENT_LOST");
        }
        if (pipe.failed || pipe.inbox.failed() || pipe.replies.failed()) throw std::runtime_error("GPU_PROTOCOL_INVALID");
        if (pipe.eof) beginStop();
        while (auto command = pipe.inbox.take()) {
          if (command->kind == CommandKind::Stop) { explicitStop = true; beginStop(); continue; }
          if (command->kind == CommandKind::Start) {
            if (capture || stop || !verifyBootstrap(command->start, parentPid, parentCreated, nonce)) throw std::runtime_error("GPU_BOOTSTRAP_INVALID");
            capture = std::make_unique<Capture>(command->start); capture->initialize(parent.value);
            const auto& handles = capture->gpu.slots;
            pipe.send("{\"status\":\"ready\",\"sessionId\":\"" + capture->config.sessionId + "\",\"generation\":\"" + capture->config.generation
              + "\",\"width\":1920,\"height\":1080,\"handles\":[\"" + std::to_string(reinterpret_cast<std::uintptr_t>(handles[0].remote))
              + "\",\"" + std::to_string(reinterpret_cast<std::uintptr_t>(handles[1].remote)) + "\",\"" + std::to_string(reinterpret_cast<std::uintptr_t>(handles[2].remote)) + "\"]}");
            continue;
          }
          if (!capture) throw std::runtime_error("GPU_NOT_STARTED");
          if (command->kind != CommandKind::Notice) {
            if (command->requestId <= lastRequest) throw std::runtime_error("GPU_REQUEST_REPLAY");
            lastRequest = command->requestId;
          }
          if (command->kind == CommandKind::Clock) {
            pipe.send("{\"status\":\"clock\",\"requestId\":" + std::to_string(command->requestId) + ",\"qpcNow\":\"" + std::to_string(qpc()) + "\",\"qpcFrequency\":\"" + std::to_string(capture->frequency) + "\"}"); continue;
          }
          if (command->key.sessionId != capture->config.sessionId || command->key.generation != capture->config.generation) throw std::runtime_error("GPU_IDENTITY_INVALID");
          const auto id = std::to_string(command->requestId);
          if (command->kind == CommandKind::Claim) {
            if (capture->running) validateLifetime(capture->config);
            const auto record = capture->slots.claimLatest();
            pipe.send(record ? "{\"status\":\"claimed\",\"requestId\":" + id + ",\"record\":" + recordJson(*record) + "}" : "{\"status\":\"empty\",\"requestId\":" + id + "}");
          } else if (command->kind == CommandKind::Release) {
            if (!capture->slots.release(command->key)) throw std::runtime_error("GPU_RELEASE_INVALID");
            pipe.send("{\"status\":\"released\",\"requestId\":" + id + ",\"key\":" + keyJson(command->key) + "}");
          } else if (command->kind == CommandKind::Notice) { const auto next = notices.acknowledge(command->requestId); if (next) notice(*next); }
        }
        if (capture) {
          try { capture->tick([&] { const auto next = notices.publish(); if (next) notice(*next); }); }
          catch (const std::exception& error) {
            const auto code = fixedError(error.what());
            if (code.rfind("SOURCE_", 0) != 0) throw;
            capture->stopAccepting();
            if (!capture->announcedLost) { capture->announcedLost = true; pipe.send("{\"status\":\"source-lost\",\"code\":\"" + code + "\"}"); }
          }
        }
        if (stop && (!capture || capture->slots.drained() || GetTickCount64() >= stopDeadline)) break;
        if (!capture && GetTickCount64() >= startupDeadline) throw std::runtime_error("GPU_START_TIMEOUT");
        HANDLE events[]{pipe.control.value, capture ? capture->signals->frames.value : pipe.control.value};
        WaitForMultipleObjects(capture ? 2 : 1, events, FALSE, capture ? 2 : 100);
      }
    } catch (const std::exception& error) { fatal = true; pipe.send("{\"status\":\"error\",\"code\":\"" + fixedError(error.what()) + "\"}"); }
    catch (...) { fatal = true; pipe.send("{\"status\":\"error\",\"code\":\"GPU_PRODUCER_FAILED\"}"); }
    // Pipe EOF can arrive just before the parent's process handle signals.
    // Both an unexpected transport end and a terminal fault revoke the own
    // marked source. A requested clean stop keeps the source reusable.
    if (capture && (fatal || !explicitStop || WaitForSingleObject(parent.value, 0) != WAIT_TIMEOUT)) hideMarkedSourceAfterParentLoss(capture->config);
    bool drained = !capture || capture->slots.drained();
    if (capture && drained && !capture->gpu.closeRemoteHandles()) { drained = false; fatal = true; }
    pipe.send(std::string("{\"status\":\"closed\",\"drained\":") + (drained ? "true}" : "false}"));
    capture.reset();
    return fatal || !drained ? 1 : 0;
  } catch (...) { return 1; }
}
