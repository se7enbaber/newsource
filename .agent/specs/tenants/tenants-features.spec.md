---
feature: Đóng Hộp Tính Năng
module: AdministrationService
status: stable
updated: 2026-03-10
---

# Gói Giải Pháp - Feature Toggle

## Mô tả
Hệ thống bật/tắt quyền module tính năng chung dựa vào "Gói Khách mua" (Pro, Enterprise...). Giao diện sẽ tự che Route và chức năng Backend tự chặn Policy nếu khách hạn không thỏa mãn.

## Flow chính
1. Host Admin gắn JSON Data List Enum cấu trúc `Feature.MDM.Products` vào CSDL `TenantFeatures`.
2. Khi System Tenant Login → Decode `Feature` claims nhòi vào JWT Token Request Session.
3. API Handler `FeatureAuthorization` tự chặn Request nào xài `[RequiredFeature({val})]` Attribute mà claims missing. 
4. UI Routing tự hide Path URL/Toolbar của cấu trúc theo tham chiếu `requiredFeature` tại file `menu-config.json` hoặc trong Guard Access Wrapper components.

## Acceptance Criteria
- [ ] Bật tắt gán array Feature theo Tenant Admin GUI.
- [ ] Gen Dynamic Authorization Policies `FEATURE:XXX`.
- [ ] Lệnh API nhận Reject Policy Auth 403 Forbidden.
- [ ] Menu Navigation tự động Remove Folder chứa App Module mà Access is Denied.

## API
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/tenants/get_features`| Cấp CheckTree UI List Toàn bộ Features Modules Option |

## UI Rules & Validation
- Tài khoản Root Admin System (Mã Tenant Host) tự decode trả array Allow All `["*"]` bỏ qua Filter Config cho Menu/Request.

## Liên quan
- Tách biệt với Group Roles Permission cấp Session Account.
