# Specification: AI Governance & Monitoring (Phase 6)

## 1. Mục tiêu (Goals)
Triển khai hệ thống theo dõi và quản trị sử dụng AI cho Business AI Notebook. Đảm bảo tính minh bạch về chi phí, kiểm soát hạn mức sử dụng theo từng khách hàng (Tenant) và hệ thống cảnh báo tự động.

## 2. Các thành phần chính

### 2.1. Dual-Metric Monitoring (Theo dõi kép)
- **Token Usage**: Theo dõi số lượng Input Tokens và Output Tokens từ LLM (Gemini 1.5 Pro).
- **Cost Calculation**: Tự động quy đổi Token sang tiền tệ (USD/VND) dựa trên bảng giá cấu hình.
- **Rerank Monitoring**: Theo dõi số lượng đơn vị tìm kiếm (search units) hoặc tokens sử dụng cho Cohere Rerank.

### 2.2. Quota Management (Quản lý hạn mức)
- **Soft Limit (Cảnh báo Vàng)**: Khi sử dụng đạt 90% hạn mức tháng.
- **Hard Limit (Cảnh báo Đỏ)**: Khi đạt 100%, hệ thống tự động ngắt dịch vụ AI cho Tenant đó.
- **Monthly Reset**: Tự động cộng lại hạn mức vào ngày 1 hàng tháng.

### 2.3. Multi-level Reporting (Báo cáo đa cấp)
- **Global Admin**: Xem báo cáo tổng hợp toàn hệ thống, top tenants tiêu thụ, tổng chi phí.
- **Tenant Admin**: Xem chi tiết sử dụng của nhân viên trong công ty, biểu đồ xu hướng theo ngày/tháng.

## 3. Thiết kế kỹ thuật

### 3.1. Database Schema (PostgreSQL)

#### Bảng `AiUsageLogs`
| Column | Type | Description |
|--------|------|-------------|
| Id | Guid | Primary Key |
| TenantId | Guid | ID của khách hàng |
| UserId | Guid | ID của người dùng thực hiện chat |
| ModelName | String | Tên model (gemini-1.5-pro, etc.) |
| PromptTokens | Int | Số token đầu vào |
| ReadingTokens | Int | (Nếu có) cho các model đặc thù |
| CompletionTokens | Int | Số token đầu ra |
| TotalTokens | Int | Tổng token |
| EstimatedCost | Decimal | Chi phí ước tính (USD) |
| Timestamp | DateTime | Thời điểm log |

#### Bảng `AiQuotas`
| Column | Type | Description |
|--------|------|-------------|
| TenantId | Guid | Primary Key, Foreign Key to Tenants |
| MonthlyTokenLimit | Long | Hạn mức token mỗi tháng |
| MonthlyCostLimit | Decimal | Hạn mức chi phí mỗi tháng (optional) |
| CurrentUsedTokens | Long | Số token đã dùng trong tháng hiện tại |
| CurrentUsedCost | Decimal | Tổng chi phí đã dùng trong tháng hiện tại |
| LastResetDate | DateTime | Ngày cuối cùng reset hạn mức |
| IsBlocked | Boolean | Trạng thái khóa dịch vụ khi hết hạn mức |

### 3.2. AI Service (Python) Integration
- Sử dụng callback hoặc log thủ công từ `chain.invoke()` kết quả.
- Gửi thông tin token usage về `AdministrationService` qua một internal API endpoint.

### 3.3. Administration Service (.NET)
- **Service**: `AiGovernanceService` xử lý việc cộng dồn usage và kiểm tra quota.
- **Controller**: `AiGovernanceController` cung cấp API ghi log và lấy báo cáo.
- **Background Job**: `AiQuotaResetJob` chạy hàng tháng.
- **Alerting**: Gửi thông báo qua `SignalRService` khi chạm ngưỡng.

## 4. Checklist thực hiện

### Bước 1: Hạ tầng & Database
- [x] Định nghĩa Entity `AiUsageLog` và `AiQuota` trong `AdministrationService`.
- [x] Cập nhật `ApplicationDbContext`.
- [x] Tạo Migration và Update Database.

### Bước 2: AI Service Usage Tracking
- [x] Cập nhật `AiService/main.py` để trích xuất token usage từ LangChain result.
- [x] Implement function gửi log về Backend.

### Bước 3: Backend Logic & API
- [x] Viết `IAiGovernanceService` xử lý cộng dồn và check quota.
- [x] Tạo API Endpoint `/api/ai-governance/log` (Internal).
- [x] Tạo API Endpoint `/api/ai-governance/usage-report` (Tenant/Global).
- [x] Tạo API Endpoint `/api/ai-governance/quota-config` (Global Admin).

### Bước 4: Alerting & Automation
- [x] Implement Hangfire Job reset quota hàng tháng.
- [x] Thêm logic kiểm tra threshold và trigger notification.

### Bước 5: Frontend UI
- [x] View: `AI Usage Dashboard` cho Admin với các biểu đồ.
- [x] Form: `Quota Configuration`.
- [x] Tích hợp thông báo hết hạn mức trên Chat UI.

---

## 5. Bug Log & Fix History

### Bug #001: Missing Table "ADMIN_AiQuotas" (Postgres 42P01)
- **Status**: Investigating / Fixing
- **Description**: Error `relation "ADMIN_AiQuotas" does not exist` occurs when accessing the dashboard.
- **Root Cause**: Migration `AddAiGovernance` was not correctly applied to the Postgres database during startup or was targeting a different DB.
- **Fix Plan**: 
    1. Rebuild `admin-service` with latest source and migrations.
    2. Check `Program.cs` and `MigrationExtensions.cs` to ensure `ADMIN_` prefix is consistent.
    3. Update `AiGovernanceController` to return default object when null to avoid crash. (DONE)
    4. Manually trigger migration if auto-update fails on restart.

---
**Tôi hiểu yêu cầu như sau:**
- Mục tiêu: Triển khai hệ thống giám sát và quản trị chi phí/hạn mức AI cho toàn hệ thống.
- Actor: Global Admin (Quản trị toàn hệ thống) và Tenant Admin (Quản trị mức khách hàng).
- Flow: Chat AI -> Log usage -> Check Quota -> Alert/Block -> Report.
- Scope ảnh hưởng: AdministrationService (DB, API, Jobs), AiService (Python log), my-nextjs (Dashboard).

**Đúng không? Nếu đúng tôi sẽ bắt đầu thực hiện Bước 1.**
