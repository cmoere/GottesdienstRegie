#pragma once
#ifndef NOMINMAX
#define NOMINMAX
#endif
#include <windows.h>
#include <d3d11.h>
#include <dxgi1_2.h>
#include <winrt/base.h>
#include <array>
#include <cstdint>

namespace gpu_probe {
struct GpuSlot {
  winrt::com_ptr<ID3D11Texture2D> texture;
  winrt::com_ptr<ID3D11RenderTargetView> view;
  winrt::com_ptr<ID3D11Query> query;
  HANDLE local = nullptr, remote = nullptr;
};
class GpuTargets {
public:
  GpuTargets() = default;
  GpuTargets(const GpuTargets&) = delete;
  GpuTargets& operator=(const GpuTargets&) = delete;
  ~GpuTargets();
  void initialize(HANDLE verifiedParent);
  void submit(std::uint32_t slot);
  bool copyDone(std::uint32_t slot);
  // Call only after exact imports drain (or before any handle was exposed).
  bool closeRemoteHandles() noexcept;
  winrt::com_ptr<ID3D11Device> device;
  winrt::com_ptr<ID3D11DeviceContext> context;
  std::array<GpuSlot, 3> slots;
private:
  HANDLE parent_ = nullptr; // Borrowed verified process; owner outlives this object.
};
}
