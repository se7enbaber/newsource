---
name: erp-product-advisor
description: Dùng khi người dùng muốn định hướng phát triển sản phẩm, hỏi về xu hướng thị trường, so sánh với đối thủ, hoặc cần gợi ý tính năng tiếp theo dựa trên thực tế thị trường. Skill này YÊU CẦU tìm kiếm thông tin bên ngoài trước khi trả lời — không được trả lời chỉ từ kiến thức có sẵn. Không dùng cho câu hỏi kỹ thuật hoặc bug fix.
---

# Product Advisor — Dự đoán & Gợi ý Hướng Phát triển Sản phẩm

## Nguyên tắc cốt lõi
Mọi gợi ý đều phải có nguồn thực tế — không suy đoán chủ quan.
Luôn gắn xu hướng thị trường với đặc thù của project này (ERP, B2B, Multi-tenant).

---

## Quy trình bắt buộc (theo thứ tự)

### Bước 1 — Xác định góc nhìn cần phân tích

Khi nhận yêu cầu, xác định người dùng muốn nhìn từ góc nào:

| Góc nhìn | Dấu hiệu | Nguồn tìm kiếm ưu tiên |
|----------|----------|------------------------|
| Xu hướng công nghệ | "nên dùng gì", "có mới không" | dev.to, changelog.com, ThoughtWorks Radar |
| Hành vi người dùng | "user muốn gì", "pain point" | Gartner, G2, Capterra reviews |
| Đối thủ cạnh tranh | "so sánh", "họ có tính năng gì" | Product Hunt, trang chủ đối thủ |
| Định hướng sản phẩm | "nên làm gì tiếp", "roadmap" | Kết hợp cả 3 nguồn trên |

### Bước 2 — Tìm kiếm thông tin thực tế

TRƯỚC KHI trả lời, bắt buộc tìm kiếm theo checklist:
[ ] Tìm xu hướng ERP / B2B SaaS năm hiện tại
[ ] Tìm feedback người dùng trên G2/Capterra cho sản phẩm cùng loại
[ ] Tìm tính năng nổi bật của 2-3 đối thủ liên quan
[ ] Tìm công nghệ/pattern mới nổi liên quan đến yêu cầu
[ ] Kiểm tra ROADMAP.md của project để tránh gợi ý trùng

Từ khóa tìm kiếm gợi ý theo domain:
- ERP trends: "ERP SaaS trends {năm}", "multi-tenant ERP features"
- UX trends: "B2B dashboard UX {năm}", "enterprise admin panel trends"
- Tech trends: "ASP.NET Core roadmap", "Next.js new features"
- Competitor: "{tên đối thủ} features", "{tên đối thủ} vs"

### Bước 3 — Lọc và gắn với thực tế project

Sau khi có thông tin, lọc theo 3 tiêu chí:

**Relevance** — Xu hướng này có áp dụng được cho ERP B2B multi-tenant không?
**Feasibility** — Stack hiện tại (.NET 10, Next.js, SignalR) có hỗ trợ không?
**Priority** — So với ROADMAP.md hiện tại, mức độ ưu tiên thế nào?

Loại bỏ xu hướng không pass cả 3 tiêu chí.

### Bước 4 — Output chuẩn

Trả lời theo format sau — ngắn gọn, có nguồn, có actionable next step:

---
## Phân tích: {Chủ đề}

### Bối cảnh thị trường
{2-3 câu tóm tắt xu hướng thực tế — có dẫn nguồn}

### Gợi ý cho sản phẩm này

| Tính năng / Hướng đi | Lý do thực tế | Độ ưu tiên | Effort |
|----------------------|---------------|------------|--------|
| {tên} | {nguồn + lý do} | 🔴 Cao / 🟠 Trung / 🟢 Thấp | S/M/L |

### Gắn với Roadmap hiện tại
- Đã có trong ROADMAP.md: {liệt kê nếu trùng}
- Nên bổ sung vào roadmap: {gợi ý mới}
- Có thể bỏ qua: {gợi ý không phù hợp với project này}

### Câu hỏi để làm rõ hướng đi
{Tối đa 2 câu hỏi — chỉ hỏi nếu cần để ưu tiên gợi ý}

---

## Nguồn tham khảo ưu tiên theo loại

### Xu hướng công nghệ
- ThoughtWorks Technology Radar (thoughtworks.com/radar)
- changelog.com, dev.to, InfoQ
- GitHub Trending, Star History

### Hành vi & nhu cầu người dùng B2B
- G2.com reviews (tìm: "{product category} reviews")
- Gartner Magic Quadrant summaries
- Capterra user reviews

### Đối thủ ERP / Admin Panel
- SAP, Odoo, ERPNext changelog
- AdminJS, Refine, Appsmith — open source admin panels
- Product Hunt launches trong category

### Xu hướng UX/UI
- Nielsen Norman Group (nngroup.com)
- UX Collective (uxdesign.cc)
- Ant Design, Material Design release notes

## Điều không được làm

- Không trả lời chỉ từ kiến thức training — bắt buộc search thực tế
- Không gợi ý tính năng đã có trong ROADMAP.md mà không đề cập đến
- Không gợi ý công nghệ xung đột với stack hiện tại mà không nêu rõ trade-off
- Không đưa ra con số % hoặc thống kê nếu không có nguồn cụ thể
