---
feature: Đăng nhập & Xác thực OpenIddict
module: AdministrationService
status: stable
updated: 2026-03-10
---

# Đăng nhập hệ thống & uỷ quyền AccessToken

## Mô tả
Hệ thống sử dụng OAuth2 Password Flow với quản lý JWT tạo trực tiếp trên Backend (Administration Service), phân tách Auth guard client-side của Next.js với Component AuthWrapper.

## Flow chính
1. Trình duyệt nhập {user, password, tenantCode} → `POST /api/proxy/connect/token` trên Next.js Server.
2. Next.js forward đến Cổng YARP Gateway → tới Backend `AdministrationService`.
3. Backend map TenantCode → `ToUpperInvariant()` lấy thông tin Tenant ID.
4. Đọc Database context scope riêng (Hỗ trợ truy xuất Dynamic Connection String nếu Tenant nằm Isolated Database riêng).
5. Query `ApplicationUser`, xác nhận mật khẩu (SignInManager).
6. Background queries (từ `Task.WhenAll`): Tải `UserRoles` & lấy `TenantFeatures` từ DB hoặc Cache.
7. OpenIddict encode JWT Token chứa claims (`tenant_id`, `role`, `Permission`, `Feature`).
8. Next.js Client nhận object Access Token, mount biến localStorage, redirect sang Dashboard.

## Acceptance Criteria
- [ ] Cung cấp Request / Response trả JWT bảo mật, xử lý bypass self-certificate.
- [ ] Check Login thành công thì memory cache map permission luôn.
- [ ] Frontend Check Token Guard theo `useRef` đồng bộ loại bỏ Spinner tải trễ.
- [ ] Đăng xuất phải clear Context Token cache trước khi Call API `logout`.

## API
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/connect/token` | Lấy Token. Payload FormUrlEncoded |
| POST | `/connect/logout` | Invalid JWT Token |

## UI Rules & Validation
- Account bị 401 Unauthorized phải remove bộ nhớ localStorage ngay lập tức thay vì dính vòng lặp redirect về Login.

## Edge Cases
- Wildcard Admin có user `admin` tự động bỏ bớt Permission Claims nặng nề nhồi vào Token payload để làm giảm Token body size, bypass Check API qua code ẩn chứa role 'Admin'.

## Liên quan
- Xem thêm: [Dynamic Permission Skill](../../skills/erp-dynamic-permission/SKILL.md)
