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
| Migrations | [tenants-migration.spec.md](./tenants/tenants-migration.spec.md) | - | AdministrationService | stable |
| Hangfire (Redis Storage) | [hangfire-redis.spec.md](./administration/hangfire-redis.spec.md) | AdministrationService | active |
| [BUG] Hangfire abstract/interface job activation | [bug-hangfire-abstract-job.spec.md](./administration/bug-hangfire-abstract-job.spec.md) | - | AdministrationService | fixed |
| [BUG] 500 Internal Server (SignalR) | [bug-500-signalr-circuit-breaker.spec.md](./administration/bug-500-signalr-circuit-breaker.spec.md) | [Link](https://www.notion.so/BUG-Analysis-500-Internal-Server-Error-SignalR-32bf1e6a215c816da32de96f10b29263) | AdministrationService | fixed |
| [BUG] Ant Design Timeline deprecation warning | [bug-antd-timeline-deprecation.spec.md](./administration/bug-antd-timeline-deprecation.spec.md) | Frontend | fixed |
| [FEATURE] Business AI Notebook | [business-notebook.spec.md](./ai/business-notebook.spec.md) | - | AI-Service | draft |
| AI Governance & Monitoring | [governance-monitoring.spec.md](./ai/governance-monitoring.spec.md) | [Link](https://www.notion.so/AI-Governance-Monitoring-Spec-32bf1e6a215c81dca2c3ebefb095b0f4) | AI-Service | draft |
| Kiến trúc hạ tầng AI | [infrastructure.spec.md](./ai/infrastructure.spec.md) | - | AiService | active |
| Lộ trình phát triển | [roadmap.spec.md](./roadmap.spec.md) | Toàn hệ thống | planned |
| **Thiết kế & UX** | [DESIGN.md](../DESIGN.md) | Frontend | stable |
