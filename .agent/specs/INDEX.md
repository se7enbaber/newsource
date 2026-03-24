# Spec Index

> **Cập nhật lần cuối:** 2026-03-25
> **Spec Template:** Tất cả file `.spec.md` tuân theo chuẩn thống nhất — xem skill `erp-analyst` để biết template đầy đủ.
> Tra cứu link Notion tại đây trước khi đồng bộ tài liệu. Mỗi entry phải có Notion link hoặc `-` nếu chưa tạo.

## 🤖 Agent & Workflow

| Tài liệu | File | Notion | Loại | Status |
|----------|------|--------|------|--------|
| **Agent Workflow & Analysis Process** | [pm-assistant.md](../workflows/pm-assistant.md) | [Link](https://www.notion.so/Agent-Workflow-Analysis-Process-32cf1e6a215c8131bf23d0bc01eddad3) | Workflow | active |
| **Analyst Skill (erp-analyst)** | [analyst/SKILL.md](../skills/analyst/SKILL.md) | [Link](https://www.notion.so/Agent-Workflow-Analysis-Process-32cf1e6a215c8131bf23d0bc01eddad3) | Skill | active |
| **Thiết kế & UX** | [DESIGN.md](../DESIGN.md) | - | Design | stable |

## 🏗️ System Architecture

| Feature | File | Notion | Module | Status |
|---------|------|--------|--------|--------|
| **Kiến trúc & Workflow** | [STRUCTURE.md](./STRUCTURE.md) | [Link](https://www.notion.so/System-Workflow-Architecture-32bf1e6a215c819ab226e821f1c57903) | Toàn hệ thống | active |
| Cổng giao tiếp API (Gateway) | [gateway.spec.md](./gateway/gateway.spec.md) | - | GatewayService | stable |
| Real-time SignalR | [signalr.spec.md](./signalr/signalr.spec.md) | - | SignalRService | stable |
| Shared Infrastructure | [shareservice.spec.md](./shared/shareservice.spec.md) | - | ShareService | stable |

## 🔐 Administration Service

| Feature | File | Notion | Module | Status |
|---------|------|--------|--------|--------|
| Đăng nhập (Auth) | [auth.spec.md](./auth/auth.spec.md) | - | AdministrationService | stable |
| Người dùng (Users) | [users/users.spec.md](./users/users.spec.md) | [Link](https://www.notion.so/Users-Management-Spec-32bf1e6a215c8134a15dc0ff71c32173) | AdministrationService | stable |
| Quyền hạn (Roles) | [roles/roles.spec.md](./roles/roles.spec.md) | - | AdministrationService | stable |
| Tổ chức (Tenants) | [tenants/tenants.spec.md](./tenants/tenants.spec.md) | [Link](https://www.notion.so/Tenants-Management-Spec-32bf1e6a215c81eb9678f495970a1ba3) | AdministrationService | stable |
| Gói tính năng (Features) | [tenants/tenants-features.spec.md](./tenants/tenants-features.spec.md) | - | AdministrationService | stable |
| Migrations | [tenants/tenants-migration.spec.md](./tenants/tenants-migration.spec.md) | [Link](https://www.notion.so/Tenants-Migration-Spec-32bf1e6a215c8134a13ce9c523a65412) | AdministrationService | stable |
| Hangfire (Redis Storage) | [administration/hangfire-redis.spec.md](./administration/hangfire-redis.spec.md) | - | AdministrationService | active |
| [BUG] Hangfire abstract/interface job | [administration/bug-hangfire-abstract-job.spec.md](./administration/bug-hangfire-abstract-job.spec.md) | - | AdministrationService | fixed |
| [BUG] 500 Internal Server (SignalR Circuit Breaker) | [administration/bug-500-signalr-circuit-breaker.spec.md](./administration/bug-500-signalr-circuit-breaker.spec.md) | [Link](https://www.notion.so/BUG-Analysis-500-Internal-Server-Error-SignalR-32bf1e6a215c816da32de96f10b29263) | AdministrationService | fixed |
| [BUG] Ant Design Timeline deprecation | [administration/bug-antd-timeline-deprecation.spec.md](./administration/bug-antd-timeline-deprecation.spec.md) | - | Frontend | fixed |

## 🤖 AI Service

| Feature | File | Notion | Module | Status |
|---------|------|--------|--------|--------|
| [FEATURE] Business AI Notebook | [ai/business-notebook.spec.md](./ai/business-notebook.spec.md) | [Link](https://www.notion.so/Business-AI-Notebook-Spec-32bf1e6a215c8188aaeaca925629b401) | AI-Service | draft |
| AI Governance & Monitoring | [ai/governance-monitoring.spec.md](./ai/governance-monitoring.spec.md) | [Link](https://www.notion.so/AI-Governance-Monitoring-Spec-32bf1e6a215c81dca2c3ebefb095b0f4) | AI-Service | draft |
| Kiến trúc hạ tầng AI | [ai/infrastructure.spec.md](./ai/infrastructure.spec.md) | [Link](https://www.notion.so/AI-Infrastructure-Spec-32bf1e6a215c81c5bd2acd410a9f226f) | AiService | active |
| [BUG] AI Proxy Exception | [ai/bug-proxy-exception.md](./ai/bug-proxy-exception.md) | [Link](https://www.notion.so/BUG-Analysis-Proxy-Exception-AI-Chat-32bf1e6a215c81789496fdbfb7ff2faa) | AiService | fixed |
| Lộ trình phát triển | [roadmap.spec.md](./roadmap.spec.md) | - | Toàn hệ thống | planned |

## 📚 Tri thức nghiệp vụ (KIs)

| Kiến thức | File | Notion | Module | Status |
|-----------|------|--------|--------|--------|
| **Tổng hợp Tri thức** | - | [Link](https://www.notion.so/Business-Knowledge-RAG-KIs-32bf1e6a215c8102874dc786f63e17c0) | AI-Service | active |
| Quy trình Phê duyệt | [ai/knowledge/business/approval-workflows.md](./ai/knowledge/business/approval-workflows.md) | [Link](https://www.notion.so/Quy-tr-nh-Ph-duy-t-KIs-32bf1e6a215c81d0b1cfc421564e6a4c) | AI-Service | active |
| Quản lý Kho | [ai/knowledge/business/inventory-management.md](./ai/knowledge/business/inventory-management.md) | [Link](https://www.notion.so/Qu-n-l-Kho-KIs-32bf1e6a215c81e8a668f5d10a297404) | AI-Service | active |
| Quy trình Bán hàng | [ai/knowledge/business/sales-process.md](./ai/knowledge/business/sales-process.md) | [Link](https://www.notion.so/Quy-tr-nh-B-n-h-ng-KIs-32bf1e6a215c8187bd59c287b8417a7c) | AI-Service | active |
| Quản lý Tổ chức (Tenant) | [ai/knowledge/business/tenant-management.md](./ai/knowledge/business/tenant-management.md) | [Link](https://www.notion.so/Qu-n-l-T-ch-c-Tenant-KIs-32bf1e6a215c817e822ce3dcf04375d5) | AI-Service | active |
| Người dùng & Vai trò | [ai/knowledge/business/user-roles-management.md](./ai/knowledge/business/user-roles-management.md) | [Link](https://www.notion.so/Qu-n-l-Ng-i-d-ng-v-Vai-tr-KIs-32bf1e6a215c81a38ef4f07ebaf9e446) | AI-Service | active |

---

## 📌 Ghi chú Notion Workspace

| Page | ID | URL |
|------|----|-----|
| Root Workspace | `32bf1e6a-215c-80cd-aa81-cc023c17197b` | (workspace root) |
| MintERP Specs | `32bf1e6a-215c-81c0-a665-f3945a263a48` | https://www.notion.so/MintERP-Specs-32bf1e6a215c81c0a665f3945a263a48 |
| Administration | `32bf1e6a-215c-816e-b6f2-d756600bd204` | https://www.notion.so/Administration-32bf1e6a215c816eb6f2d756600bd204 |
| AI Service | `32bf1e6a-215c-81d5-ae44-e9f817ab44db` | https://www.notion.so/AI-Service-32bf1e6a215c81d5ae44e9f817ab44db |
| System Workflow & Architecture | `32bf1e6a-215c-819a-b226-e821f1c57903` | https://www.notion.so/System-Workflow-Architecture-32bf1e6a215c819ab226e821f1c57903 |
| Agent Workflow & Analysis Process | `32cf1e6a-215c-8131-bf23-d0bc01eddad3` | https://www.notion.so/Agent-Workflow-Analysis-Process-32cf1e6a215c8131bf23d0bc01eddad3 |
