This is the Frontend part of the Enterprise ERP Admin Panel, built with **Next.js**, **Ant Design**, and **TypeScript**.

---

## 🚀 Core Features (Mới cập nhật 03/2026)

1.  **Hệ thống Tour hướng dẫn (Guided Tours)**:
    *   Tích hợp `AppTour` và `react-i18next` cho phép hướng dẫn người dùng bằng cả tiếng Việt và tiếng Anh.
    *   Hỗ trợ trên các trang danh sách (Tenants, Users, Roles, Products) và cả bên trong các **Popup/Modal** nhiệm vụ.
    *   Nút **Trợ giúp (Help)** được trang bị sẵn trên thanh tiêu đề Popup để kích hoạt hướng dẫn tại chỗ.

2.  **Xuất báo cáo Excel**:
    *   Hỗ trợ nút **Xuất Excel** nhanh trên tất cả các màn hình quản trị chính.

3.  **Hệ thống UI Component "Siêu năng lực"**:
    -   [`AppButton`](./app/components/common/AppButton.tsx): Tích hợp sâu với `PermissionProvider` (tự ẩn theo quyền), hỗ trợ loading spinner đồng bộ và cơ chế xác nhận (`Popconfirm`) trực tiếp qua prop.
    -   [`AppGrid`](./app/components/common/AppGrid.tsx): Thế hệ mới tích hợp **Summary Cards** (thẻ thống kê), thanh công cụ **Toolbar**, và cơ chế **Row Actions** thông minh (chỉ hiện khi hover).
    -   [`AppBadge`](./app/components/common/AppBadge.tsx) & [`AppStatCard`](./app/components/common/AppStatCard.tsx): Hiển thị trạng thái và thông số thống kê đồng bộ, chuyên nghiệp.
    -   Chi tiết xem tại: [**Components Documentation**](./app/components/README.md).

4.  **Thiết kế Mint ERP Premium**:
    -   **Trang đăng nhập Split Layout**: Giao diện login 50/50 hiện đại với vùng branding ấn tượng.
    -   Hệ thống theme đồng bộ với font **Space Grotesk** và bo góc pill-style chuyên nghiệp.

5.  **Sidebar V3 (Premium Glassmorphism)**:
    -   **Thiết kế Depth & Glassmorphism**: Sử dụng gradient dọc kết hợp backdrop-blur và màu nền tính toán động (adjust lightness -15%) từ Primary Color.
    -   **Phân cấp Visual (Hierarchy)**: Menu cha (Semi-bold, 14px, White/0.75), menu con (Medium, 13px, White/0.6).
    -   **Active State sang trọng**: Nền White/0.22, border-left trắng 3px, đổ bóng inner shadow nhẹ.
    -   **Avatar Dropdown Footer**: Vùng hồ sơ người dùng được tách biệt tại chân Sidebar với hiệu ứng Glassmorphism và dropdown menu nhanh.
    -   **Scrollbar tinh tế**: Custom scrollbar siêu mỏng, tự ẩn hiện mượt mà.

---

## 🏗 Vị trí trong Kiến trúc Tổng thể

```text
┌────────────────────────┐         ┌────────────────────────┐
│ Trình duyệt (Người dùng)│  HTTP   │ Next.js Server (Proxy) │
└───────────┬────────────┘         └───────────┬────────────┘
            │                                  │
            ▼                                  ▼
┌───────────────────────────────────────────────────────────┐
│                   Gateway Service (YARP)                  │
└──────┬──────────────────────────┬──────────────┬──────────┘
       │ /notificationHub         │ /api/**       │ /files/**
       ▼                          ▼               ▼
┌─────────────┐  HTTP   ┌──────────────────┐  ┌──────────────────┐
│SignalR Svc  │◄────────│Administration Svc│  │  File Service    │
│(WebSocket)  │  POST   │  (Core API)      │  │  (Upload/Download)│
└─────────────┘         └────────┬─────────┘  └────────┬─────────┘
                                 │ EF Core              │ S3 API
                                 ▼                      ▼
                         ┌──────────────┐      ┌──────────────────┐
                         │   Database   │      │      Minio       │
                         │ (PostgreSQL) │      │ (File Storage)   │
                         └──────────────┘      └──────────────────┘
```

6.  **Auto Contrast Color (WCAG 2.1)**:
    -   Tự động tối ưu màu chữ theo nền Dashboard/Table Header.
    -   Đảm bảo Accessibility chuẩn quốc tế khi thay đổi Theme Color động.


---

## 🛠 Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📘 Documentation

For more detailed technical documentation, architecture diagrams, and coding rules, please refer to:
- [**README_PROJECT.md**](./README_PROJECT.md) - Chi tiết kỹ thuật Frontend.
- [**Markdown/Readme_Project.md**](../Markdown/Readme_Project.md) - Tổng quan toàn hệ thống.


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
