// Own generated source only. Never enumerates or controls an existing window.
#define NOMINMAX
#include <windows.h>
#include <iostream>
#include <string>
namespace {
uint64_t frame = 0; int contentWidth = 1600, contentHeight = 900;
RECT screen{}; bool found = false;
BOOL CALLBACK monitor(HMONITOR item, HDC, LPRECT, LPARAM) {
  MONITORINFOEXW info{}; info.cbSize = sizeof(info);
  if (GetMonitorInfoW(item, &info) && std::wstring(info.szDevice) == L"\\\\.\\DISPLAY1") {screen = info.rcMonitor; found = true; return FALSE;}
  return TRUE;
}
LRESULT CALLBACK windowProc(HWND window, UINT message, WPARAM w, LPARAM l) {
  if (message == WM_DESTROY) {PostQuitMessage(0); return 0;}
  if (message == WM_ERASEBKGND) return 1;
  if (message == WM_PAINT) {
    PAINTSTRUCT paint{}; HDC dc = BeginPaint(window, &paint);
    HDC back = CreateCompatibleDC(dc); HBITMAP image = CreateCompatibleBitmap(dc, contentWidth, contentHeight + 64);
    const auto old = SelectObject(back, image);
    HBRUSH magenta = CreateSolidBrush(RGB(255, 0, 255)), red = CreateSolidBrush(RGB(255, 0, 0));
    HBRUSH blue = CreateSolidBrush(RGB(0, 0, 255)), yellow = CreateSolidBrush(RGB(255, 255, 0));
    RECT toolbar{0, 0, contentWidth, 64}, left{0, 64, contentWidth/2, contentHeight + 64}, right{contentWidth/2, 64, contentWidth, contentHeight + 64};
    FillRect(back, &toolbar, magenta); FillRect(back, &left, red); FillRect(back, &right, blue);
    const int x = static_cast<int>((frame * 7) % (contentWidth - 40));
    RECT marker{x, contentHeight - 50, x + 40, contentHeight + 20}; FillRect(back, &marker, yellow);
    for (int bit = 0; bit < 16; ++bit) {RECT box{bit * 20, 70, bit * 20 + 15, 85}; FillRect(back, &box, (frame & (1ULL << bit)) ? yellow : blue);}
    BitBlt(dc, 0, 0, contentWidth, contentHeight + 64, back, 0, 0, SRCCOPY);
    SelectObject(back, old); DeleteObject(image); DeleteDC(back);
    DeleteObject(magenta); DeleteObject(red); DeleteObject(blue); DeleteObject(yellow); EndPaint(window, &paint); return 0;
  }
  return DefWindowProcW(window, message, w, l);
}
}
int wmain(int argc, wchar_t** argv) {
  SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);
  if (argc != 3 || std::wstring(argv[1]) != L"--monitor=1") return 2;
  if (std::wstring(argv[2]) == L"standard") contentWidth = 1200;
  else if (std::wstring(argv[2]) != L"wide") return 2;
  EnumDisplayMonitors(nullptr, nullptr, monitor, 0);
  if (!found || screen.right - screen.left < contentWidth || screen.bottom - screen.top < contentHeight + 64) return 3;
  WNDCLASSW type{}; type.lpfnWndProc = windowProc; type.hInstance = GetModuleHandleW(nullptr); type.lpszClassName = L"RegieOwnedFrameFixture";
  if (!RegisterClassW(&type)) return 4;
  HWND window = CreateWindowExW(0, type.lpszClassName, L"GottesdienstRegie own capture fixture", WS_POPUP | WS_VISIBLE,
    screen.left, screen.top, contentWidth, contentHeight + 64, nullptr, nullptr, type.hInstance, nullptr);
  if (!window) return 5;
  FILETIME created{}, exit{}, kernel{}, user{};
  if (!GetProcessTimes(GetCurrentProcess(), &created, &exit, &kernel, &user)) {DestroyWindow(window); return 6;}
  const uint64_t started = (static_cast<uint64_t>(created.dwHighDateTime) << 32) | created.dwLowDateTime;
  std::cout << "{\"hwnd\":\"" << reinterpret_cast<uintptr_t>(window) << "\",\"pid\":" << GetCurrentProcessId()
    << ",\"createdAt\":\"" << started << "\",\"crop\":{\"x\":0,\"y\":64,\"width\":" << contentWidth << ",\"height\":900,\"outerWidth\":" << contentWidth << ",\"outerHeight\":964}}" << std::endl;
  HANDLE timer = CreateWaitableTimerExW(nullptr, nullptr, CREATE_WAITABLE_TIMER_HIGH_RESOLUTION, TIMER_ALL_ACCESS);
  LARGE_INTEGER due{}; due.QuadPart = -160000;
  if (!timer || !SetWaitableTimer(timer, &due, 16, nullptr, nullptr, FALSE)) {if (timer) CloseHandle(timer); DestroyWindow(window); return 7;}
  bool running = true;
  while (running) {
    const auto reason = MsgWaitForMultipleObjectsEx(1, &timer, 100, QS_ALLINPUT, MWMO_INPUTAVAILABLE);
    if (reason == WAIT_OBJECT_0) {++frame; InvalidateRect(window, nullptr, FALSE); UpdateWindow(window);}
    MSG message{};
    while (PeekMessageW(&message, nullptr, 0, 0, PM_REMOVE)) {if (message.message == WM_QUIT) running = false; else {TranslateMessage(&message); DispatchMessageW(&message);}}
    DWORD available = 0;
    const auto input = GetStdHandle(STD_INPUT_HANDLE);
    if (!PeekNamedPipe(input, nullptr, 0, nullptr, &available, nullptr)) running = false;
    else if (available) {char stop[64]; DWORD count = 0; ReadFile(input, stop, sizeof(stop), &count, nullptr); running = false;}
  }
  CancelWaitableTimer(timer); CloseHandle(timer);
  if (IsWindow(window)) DestroyWindow(window);
  return 0;
}
