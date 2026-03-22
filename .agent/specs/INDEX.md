# Spec Index

| Feature | File | Notion | Module | Status |
|---------|------|--------|--------|--------|
| **Kiến trúc & Workflow** | [STRUCTURE.md](./STRUCTURE.md) | [Link](https://www.notion.so/System-Workflow-Architecture-32bf1e6a215c819ab226e821f1c57903) | Toàn hệ thống | active |
| Cổng giao tiếp API (Gateway) | [gateway.spec.md](./gateway/gateway.spec.md) | - | GatewayService | stable |
| Real-time SignalR | [signalr.spec.md](./signalr/signalr.spec.md) | - | SignalRService | stable |
| Shared Infrastructure | [shareservice.spec.md](./shared/shareservice.spec.md) | - | ShareService | stable |
| Đăng nhập (Auth) | [auth.spec.md](./auth/auth.spec.md) | - | AdministrationService | stable |
| Người dùng (Users) | [users.spec.md](./users/users.spec.md) | [Link](https://www.notion.so/Users-Management-Spec-32bf1e6a215c8134a15dc0ff71c32173) | AdministrationService | stable |
| Quyền hạn (Roles) | [roles.spec.md](./roles/roles.spec.md) | - | AdministrationService | stable |
| Tổ chức (Tenants) | [tenants.spec.md](./tenants/tenants.spec.md) | [Link](https://www.notion.so/Tenants-Management-Spec-32bf1e6a215c81eb9678f495970a1ba3) | AdministrationService | stable |
| Gói tính năng (Features) | [tenants-features.spec.md](./tenants/tenants-features.spec.md) | - | AdministrationService | stable |
| Migrations | [tenants-migration.spec.md](./tenants/tenants-migration.spec.md) | [Link](https://www.notion.so/Tenants-Migration-Spec-32bf1e6a215c8134a13ce9c523a65412) | AdministrationService | stable |
| Hangfire (Redis Storage) | [hangfire-redis.spec.md](./administration/hangfire-redis.spec.md) | AdministrationService | active |
| [BUG] Hangfire abstract/interface job activation | [bug-hangfire-abstract-job.spec.md](./administration/bug-hangfire-abstract-job.spec.md) | - | AdministrationService | fixed |
| [BUG] 500 Internal Server (SignalR) | [bug-500-signalr-circuit-breaker.spec.md](./administration/bug-500-signalr-circuit-breaker.spec.md) | [Link](https://www.notion.so/BUG-Analysis-500-Internal-Server-Error-SignalR-32bf1e6a215c816da32de96f10b29263) | AdministrationService | fixed |
| [BUG] Ant Design Timeline deprecation warning | [bug-antd-timeline-deprecation.spec.md](./administration/bug-antd-timeline-deprecation.spec.md) | Frontend | fixed |
| [FEATURE] Business AI Notebook | [business-notebook.spec.md](./ai/business-notebook.spec.md) | [Link](https://www.notion.so/Business-AI-Notebook-Spec-32bf1e6a215c8188aaeaca925629b401) | AI-Service | draft |
| AI Governance & Monitoring | [governance-monitoring.spec.md](./ai/governance-monitoring.spec.md) | [Link](https://www.notion.so/AI-Governance-Monitoring-Spec-32bf1e6a215c81dca2c3ebefb095b0f4) | AI-Service | draft |
| Kiến trúc hạ tầng AI | [infrastructure.spec.md](./ai/infrastructure.spec.md) | [Link](https://www.notion.so/AI-Infrastructure-Spec-32bf1e6a215c81c5bd2acd410a9f226f) | AiService | active |
| Lộ trình phát triển | [roadmap.spec.md](./roadmap.spec.md) | Toàn hệ thống | planned |
| [BUG] AI Proxy Exception | [bug-proxy-exception.md](./ai/bug-proxy-exception.md) | - | AiService | fixed |
| **Thiết kế & UX** | [DESIGN.md](../DESIGN.md) | Frontend | stable |

## 📚 Tri thức nghiệp vụ (KIs)

| Kiến thức | File | Notion | Module | Status |
|-----------|------|--------|--------|--------|
| **Tổng hợp Tri thức** | - | [Link](https://www.notion.so/Business-Knowledge-RAG-KIs-32bf1e6a215c8102874dc786f63e17c0) | AI-Service | active |
| Quy trình Phê duyệt | [approval-workflows.md](./ai/knowledge/business/approval-workflows.md) | [Link](https://www.notion.so/Quy-tr-nh-Ph-duy-t-KIs-32bf1e6a215c81d0b1cfc421564e6a4c) | AI-Service | active |
| Quản lý Kho | [inventory-management.md](./ai/knowledge/business/inventory-management.md) | [Link](https://www.notion.so/Qu-n-l-Kho-KIs-32bf1e6a215c81e8a668f5d10a297404) | AI-Service | active |
| Quy trình Bán hàng | [sales-process.md](./ai/knowledge/business/sales-process.md) | [Link](https://www.notion.so/Quy-tr-nh-B-n-h-ng-KIs-32bf1e6a215c8187bd59c287b8417a7c) | AI-Service | active |
| Quản lý Tổ chức (Tenant) | [tenant-management.md](./ai/knowledge/business/tenant-management.md) | [Link](https://www.notion.so/Qu-n-l-T-ch-c-Tenant-KIs-32bf1e6a215c817e822ce3dcf04375d5) | AI-Service | active |
| Người dùng & Vai trò | [user-roles-management.md](./ai/knowledge/business/user-roles-management.md) | [Link](https://www.notion.so/Qu-n-l-Ng-i-d-ng-v-Vai-tr-KIs-32bf1e6a215c81a38ef4f07ebaf9e446) | AI-Service | active |
