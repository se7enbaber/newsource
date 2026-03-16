# Spec: Nâng cấp Toàn diện Dashboard Giám sát Hệ thống

## 1. Vấn đề & Mục tiêu (Problem & Goal)
- **Vấn đề**:
    1. Lỗi deprecation: Component `Timeline` sử dụng `children` thay vì `content`.
    2. Thiếu tính năng: Dashboard chỉ hiển thị trạng thái tĩnh, thiếu biểu đồ trực quan cho Microservices và thông tin chi tiết về lưu trữ Redis.
- **Mục tiêu**:
    - Sửa lỗi UI và nâng cao trải nghiệm người dùng với các tương tác thời gian thực.
    - Cung cấp biểu đồ RAM/CPU (lịch sử 1 phút) cho từng Microservice.
    - Cung cấp công cụ Explorer cho Redis Engine để giám sát bộ nhớ và keyspace.
- **Ngày phát hiện**: 2026-03-15
- **Ngày xử lý**: 2026-03-15

## 2. Phân tích Kỹ thuật (Technical Analysis)

### Hiện trạng (Current State)
- `page.tsx` sử dụng Ant Design 5.x/6.x.
- Dữ liệu được lấy từ các endpoint `/api/Monitoring/services-health` và `/api/Monitoring/redis-info`.

### Giải pháp Thực hiện (Implementation Solution)
- **Frontend Core**:
    - Thay đổi thuộc tính `children` sang `content` cho `Timeline`.
    - Sử dụng `recharts` để vẽ biểu đồ line/area cho Microservices và pie chart cho Redis.
- **Microservices Monitoring**:
    - Implement pooling (10s/lần) để lưu trữ lịch sử metrics (6 snapshots gần nhất).
    - Thêm Modal hiển thị biểu đồ vùng (Area Chart) CPU & RAM.
- **Redis Engine Exploration**:
    - Hiển thị thông số Memory Peak trong Dashboard chính.
    - Thêm Modal Redis Explorer hiển thị Keyspace (DB0, DB1...) và Phân bổ bộ nhớ chi tiết.

### Flow tương tác (Workflow)
1. User nhấn vào card Microservice -> Hiển thị biểu đồ hiệu năng.
2. User nhấn vào card Redis -> Hiển thị chi tiết bộ nhớ và danh sách key/database.

## 3. Scope ảnh hưởng
- `my-nextjs/app/page.tsx`: Cấu trúc lại component và tích hợp thư viện chart.

## 4. Checklist thực hiện
- [x] Fix Ant Design deprecation warning.
- [x] Setup logic pooling metrics thời gian thực.
- [x] Xây dựng Modal biểu đồ hiệu năng Microservices.
- [x] Xây dựng Modal Redis Explorer (Keyspace & Memory).
- [x] Tối ưu hóa UI/UX với hiệu ứng hover và dark-theme modals.

## 5. Metadata
- **Status**: completed
- **Priority**: medium
- **Department**: Frontend
