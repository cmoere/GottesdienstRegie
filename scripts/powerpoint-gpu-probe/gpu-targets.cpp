#include "gpu-targets.h"
#include <stdexcept>

namespace gpu_probe {
void GpuTargets::initialize(HANDLE parent) {
  if (device) throw std::logic_error("GPU_TARGET_ALREADY_INITIALIZED");
  parent_ = parent;
  winrt::check_hresult(D3D11CreateDevice(nullptr, D3D_DRIVER_TYPE_HARDWARE, nullptr, D3D11_CREATE_DEVICE_BGRA_SUPPORT,
    nullptr, 0, D3D11_SDK_VERSION, device.put(), nullptr, context.put()));
  D3D11_TEXTURE2D_DESC desc{};
  desc.Width = 1920; desc.Height = 1080; desc.MipLevels = 1; desc.ArraySize = 1;
  desc.Format = DXGI_FORMAT_B8G8R8A8_UNORM; desc.SampleDesc.Count = 1; desc.Usage = D3D11_USAGE_DEFAULT;
  desc.BindFlags = D3D11_BIND_SHADER_RESOURCE | D3D11_BIND_RENDER_TARGET;
  desc.MiscFlags = D3D11_RESOURCE_MISC_SHARED | D3D11_RESOURCE_MISC_SHARED_NTHANDLE;
  try {
    for (auto& slot : slots) {
      winrt::check_hresult(device->CreateTexture2D(&desc, nullptr, slot.texture.put()));
      winrt::check_hresult(device->CreateRenderTargetView(slot.texture.get(), nullptr, slot.view.put()));
      D3D11_QUERY_DESC query{D3D11_QUERY_EVENT, 0};
      winrt::check_hresult(device->CreateQuery(&query, slot.query.put()));
      winrt::check_hresult(slot.texture.as<IDXGIResource1>()->CreateSharedHandle(nullptr,
        DXGI_SHARED_RESOURCE_READ | DXGI_SHARED_RESOURCE_WRITE, nullptr, &slot.local));
      if (parent_ && !DuplicateHandle(GetCurrentProcess(), slot.local, parent_, &slot.remote, 0, FALSE, DUPLICATE_SAME_ACCESS))
        throw std::runtime_error("GPU_HANDLE_DUPLICATION");
    }
  } catch (...) { closeRemoteHandles(); throw; }
}
void GpuTargets::submit(std::uint32_t id) {
  if (id >= slots.size() || !context) throw std::invalid_argument("GPU_TARGET_INVALID");
  context->End(slots[id].query.get()); context->Flush();
}
bool GpuTargets::copyDone(std::uint32_t id) {
  if (id >= slots.size() || !context) throw std::invalid_argument("GPU_TARGET_INVALID");
  const auto state = context->GetData(slots[id].query.get(), nullptr, 0, D3D11_ASYNC_GETDATA_DONOTFLUSH);
  winrt::check_hresult(state); return state == S_OK;
}
bool GpuTargets::closeRemoteHandles() noexcept {
  bool ok = true;
  for (auto& slot : slots) if (slot.remote) {
    const auto owned = slot.remote;
    // CLOSE_SOURCE closes even on an error return. Consume ownership before the
    // call: retrying this number could close a newly reused handle in Main.
    slot.remote = nullptr;
    if (!DuplicateHandle(parent_, owned, nullptr, nullptr, 0, FALSE, DUPLICATE_CLOSE_SOURCE)) ok = false;
  }
  return ok;
}
GpuTargets::~GpuTargets() {
  // Never close borrowed Main handles automatically while imports may still live.
  // Hard helper failure requires the isolated Main supervisor to terminate itself.
  for (auto& slot : slots) if (slot.local) CloseHandle(slot.local);
}
}
