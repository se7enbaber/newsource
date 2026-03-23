# GEMINI.md - Core Project Context & Critical Rules

> [!IMPORTANT]
> This file MUST be read first by any AI agent before performing any task in this codebase.
> **Cập nhật lần cuối: 2026-03-23**

## Project Summary
**MintERP** là hệ thống quản lý doanh nghiệp (ERP) đa tenant, xây dựng theo kiến trúc microservices. Hệ thống bao gồm: Gateway (YARP), AdministrationService (.NET), SignalRService, FileService, AiService (Python/RAG), và Frontend (Next.js 16). Tài liệu kỹ thuật được quản lý tập trung tại `.agent/specs/` và đồng bộ lên Notion. Quy trình phân tích yêu cầu theo chuẩn: erp-analyst skill + pm-assistant workflow.

## Critical Instructions for AI
1. **Always Read This File First**: Before starting any research or task, read the contents of `GEMINI.md`.
2. **Follow ANTIGRAVITY_INSTRUCTIONS.md**: The core workflow is defined in `.agent/ANTIGRAVITY_INSTRUCTIONS.md`.
3. **Respect Service Rules**: Read the `.md` files of each service (e.g., `NEXTJS.md`) as specified in the global rules.
4. **Mandatory Analysis**: Always apply the `erp-analyst` skill to analyze and confirm requirements before starting code implementation, particularly for Next.js tasks.
5. **PM Assistant Workflow**: Luôn tuân thủ quy trình tại [.agent/workflows/pm-assistant.md](file:///d:/App/Project/.agent/workflows/pm-assistant.md) khi tiếp nhận yêu cầu mới. **Quy trình: Phân tích → Notion → Stitch (UI) → .md local → Confirm → Code**.
6. **Clean Up**: Always delete unused `.log` and `.txt` files after completing a task to keep the workspace clean.
7. **Notion & Document Sync**: LUÔN cập nhật tài liệu `.md` (specs, designs, knowledge) tại `.agent/` ngay khi có thay đổi logic/tính năng. BẮT BUỘC ghi rõ **ngày tháng update** vào file `.md` cũng như khi đồng bộ lên Notion để lưu vết. Sau đó, ĐỒNG BỘ nội dung này lên trang Notion tương ứng (tra cứu link mapping tại `.agent/specs/INDEX.md`). **Không báo "Done" nếu chưa hoàn thành bước này.**
8. **Notion MCP — Hạn chế đọc**: KHÔNG được tự ý gọi `mcp_notion-mcp-server_API-*` để **đọc** dữ liệu từ Notion (retrieve page, query database, get block children, v.v.) trừ khi user đã **confirm rõ ràng**. Chỉ được dùng Notion MCP để **ghi** (tạo page, cập nhật block) trong luồng tài liệu hóa đã được duyệt. Mọi thao tác đọc Notion cần hỏi user trước: *"Tôi cần đọc trang Notion X để lấy thông tin Y — bạn có đồng ý không?"*

## Current Priorities
- [x] Giai đoạn 1 & 2: Hạ tầng & Backend AI Service (RAG).
- [x] Giai đoạn 3: Frontend Business Notebook (Next.js components).
- [x] Bảo trì & Cập nhật tri thức nghiệp vụ (Giai đoạn 4).
- [x] Tối ưu hoá AI Service - Cache/Hybrid/Re-rank (Giai đoạn 5).
- [x] Quản trị & Giám sát AI (Giai đoạn 6 - Token & Cost).

## Tech Stack
- **Backend**: .NET / C#
- **Frontend**: Next.js / TypeScript
- **Infrastructure**: Docker, SignalR, Hangfire, Redis

## Known Issues & Resolved Bugs
- **[Resolved] 2026-03-22 - Tenant Migration Idempotency:** Quá trình Hangfire job migration cho Tenants báo lỗi `relation "ADMIN_Tenants" already exists` (SQL Code `42P07`) nếu CSDL đã có dữ liệu trước. Đã cấu trúc lại `TenantMigrationJob.cs` và `MigrationExtensions.cs` để tự động chèn record vào `__EFMigrationsHistory` và chạy tiếp các scripts mới thay vì throw lỗi làm đứt sequence.
- **[Resolved] 2026-03-22 - AiGovernanceService build error:** Lỗi biên dịch do bất đồng nhất tham số và tên method giữa Interface `IAiGovernanceService` (`UpdateQuotaAsync`, `IsQuotaExceededAsync`) và class implement. Đã tiến hành mapping lại param cho đồng nhất.
- **[Resolved] 2026-03-22 - SignalR Circuit Breaker:** Lỗi `The circuit is now open` và `Connection refused` do port không nhất quán giữa Dockerfile (10000) và docker-compose/AdminService (8080). Đã đồng bộ tất cả về port 8080 và tăng khả năng phục hồi của resilience policy.
