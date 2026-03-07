This is the Frontend part of the Enterprise ERP Admin Panel, built with **Next.js**, **Ant Design**, and **TypeScript**.

---

## 🚀 Core Features (Mới cập nhật 03/2026)

1.  **Hệ thống Tour hướng dẫn (Guided Tours)**:
    *   Tích hợp `AppTour` và `react-i18next` cho phép hướng dẫn người dùng bằng cả tiếng Việt và tiếng Anh.
    *   Hỗ trợ trên các trang danh sách (Tenants, Users, Roles, Products) và cả bên trong các **Popup/Modal** nhiệm vụ.
    *   Nút **Trợ giúp (Help)** được trang bị sẵn trên thanh tiêu đề Popup để kích hoạt hướng dẫn tại chỗ.

2.  **Xuất báo cáo Excel**:
    *   Hỗ trợ nút **Xuất Excel** nhanh trên tất cả các màn hình quản trị chính.

3.  **Hệ thống UI Component dùng chung**:
    *   `AppGrid`, `AppButton`, `AppPopup`, `AppTour` được thiết kế đồng bộ, dễ tái sử dụng.
    *   `AppPopup` mặc định luôn được căn giữa màn hình (`centered`), mang lại UX đồng nhất cho mọi Form nhập liệu.
    *   `AppGrid` được thiết kế mới thanh Toolbar tìm kiếm & lọc với các icon tối giản, nổi bật theo theme.
    *   `AppButton` tự động gán class tour (vd: `tour-edit`) để hệ thống hướng dẫn dễ dàng tìm thấy phần tử.

4.  **Thiết kế Mint ERP (Vibe Check Theme)**:
    *   Hệ thống chuyển đổi sang phong cách "Mint ERP" cực kỳ hiện đại với bảng màu chủ đạo `#2BD4BD`, font **Space Grotesk** và bo góc pill-style (24px-32px).
    *   Tích hợp Sidebar tinh xảo (Pill-style, Upgrade card), Header độc lập và Dashboard 2 cột chuẩn mực như hình thiết kế.

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
