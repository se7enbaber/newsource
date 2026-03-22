# GEMINI.md - Core Project Context & Critical Rules

> [!IMPORTANT]
> This file MUST be read first by any AI agent before performing any task in this codebase.

## Project Summary
[Add project summary here]

## Critical Instructions for AI
1. **Always Read This File First**: Before starting any research or task, read the contents of `GEMINI.md`.
2. **Follow ANTIGRAVITY_INSTRUCTIONS.md**: The core workflow is defined in `.agent/ANTIGRAVITY_INSTRUCTIONS.md`.
3. **Respect Service Rules**: Read the `.md` files of each service (e.g., `NEXTJS.md`) as specified in the global rules.
4. **Mandatory Analysis**: Always apply the `erp-analyst` skill to analyze and confirm requirements before starting code implementation, particularly for Next.js tasks.
5. **PM Assistant Workflow**: Luôn tuân thủ quy trình tại [.agent/workflows/pm-assistant.md](file:///d:/App/Project/.agent/workflows/pm-assistant.md) khi tiếp nhận yêu cầu mới.
6. **Clean Up**: Always delete unused `.log` and `.txt` files after completing a task to keep the workspace clean.
7. **Notion & Document Sync**: LUÔN cập nhật tài liệu `.md` (specs, designs, knowledge) tại `.agent/` ngay khi có thay đổi logic/tính năng. Sau đó, ĐỒNG BỘ nội dung này lên trang Notion tương ứng (tra cứu link mapping tại `.agent/specs/INDEX.md`). **Không báo "Done" nếu chưa hoàn thành bước này.**

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
