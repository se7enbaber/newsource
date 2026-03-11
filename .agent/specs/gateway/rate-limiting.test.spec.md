---
feature: Rate Limiting & Proxy IP Forwarding
module: GatewayService / AdministrationService
tested-by: unit | integration | e2e
spec-ref: .agent/specs/gateway/rate-limiting.spec.md
status: partial
updated: 2026-03-11
---

# Test Spec: Rate Limiting & Proxy IP Forwarding

## Coverage Map

| AC trong .spec | Unit | Integration | E2E | Kết quả |
|----------------|------|-------------|-----|---------|
| AC-1: Bóc đúng `X-Forwarded-For`, không dính IP Docker | ✅ | — | — | pass |
| AC-2: Báo lỗi 429 nếu IP gửi > N limit / 10s (Global) hoặc / 30s (Auth) | ✅ (window config) | — | ✅ (smoke) | partial |
| AC-3: Cấu hình từ UI cập nhật thẳng sang Redis | — | ✅ | ✅ | pass |
| AC-4: Gateway đọc Redis real-time, fallback nếu Redis lỗi | ✅ | — | — | partial* |
| AC-5: Chỉ Host Tenant Admin mới thấy Menu và thao tác | ✅ (attr check) | — | ✅ | partial** |

> \* **Partial**: Code thực tế fallback là hardcoded default (100/5), không dùng MemoryCache như spec mô tả.
> \*\* **Partial**: `[Authorize]` chỉ check JWT, chưa filter theo `hostOnly` / TenantId.

## Conflicts phát hiện

- [ ] **AC-4 Fallback** — `RateLimiterExtension.cs`: spec nói fallback **MemoryCache**, code thực tế fallback là **hardcoded default value** (100 global / 5 auth). Cần xác nhận: có cần implement MemoryCache fallback thực sự không?
- [ ] **AC-5 Host-Only** — `SystemConfigController.cs`: spec nói `hostOnly: true` (chỉ Host Tenant Admin), code chỉ dùng `[Authorize]` JWT cơ bản — không chặn được non-host tenant. Cần thêm `[HasPermission]` hoặc guard TenantId.

## File test đã tạo

- Unit        : `GatewayService/GatewayService.Tests/Features/RateLimiter/RateLimiterExtensionTests.cs`
- Integration : `AdministrationService.Tests/Integration/SystemConfig/SystemConfigControllerTests.cs`
- E2E         : `my-nextjs/e2e/gateway/rate-limiting.spec.ts`
- Fixture     : `my-nextjs/e2e/gateway/rate-limiting.fixture.ts`
- Playwright Config : `my-nextjs/playwright.config.ts`

## Gợi ý bổ sung vào .spec

- Nên thêm AC rõ hơn cho **fallback behavior**: "Nếu Redis unavailable, Gateway dùng limit mặc định X (không crash, không block toàn bộ)". Hiện tại spec nói "fallback MemoryCache" nhưng không rõ MemoryCache lưu gì / lưu lúc nào.
- Nên thêm AC cho **validation UI**: GlobalLimit và AuthLimit phải > 0, kiểu số nguyên — spec hiện tại không đề cập validation rule cho form.
- Nên thêm AC cho **concurrent update**: Nếu 2 admin cùng lúc POST cấu hình khác nhau → Redis lưu cái nào? (last-write-wins hiện tại, có ổn không?)
- Cân nhắc thêm test **429 integration thực**: Cần test project riêng với in-memory rate limiter để verify 429 response thực sự — hiện chỉ test config value, chưa test behavior thực tế.
