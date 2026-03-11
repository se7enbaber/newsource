---
name: erp-testing
description: Dùng khi cần tạo test cho một tính năng, verify flow đã có trong .spec.md khớp với code thực tế, hoặc gen E2E/Integration/Unit test. Luôn đọc file .spec.md tương ứng TRƯỚC khi gen bất kỳ test nào. Không dùng cho debug lỗi runtime hoặc fix bug.
---

# Testing — Unit / Integration / E2E

## Nguyên tắc cốt lõi
Test phải bám sát Acceptance Criteria trong .spec.md — không tự suy đoán
behaviour. Nếu .spec.md và code đang mâu thuẫn → báo cáo trước, không tự
chọn bên nào đúng.

---

## Bước 0 — Bắt buộc trước khi viết bất kỳ test nào
[ ] Đọc .agent/specs/{module}/{feature}.spec.md
[ ] Đọc code thực tế của feature đó
[ ] Đối chiếu AC trong .spec với code — ghi nhận mâu thuẫn nếu có
[ ] Xác định loại test phù hợp (xem bảng bên dưới)
[ ] Báo cáo mâu thuẫn cho người dùng trước khi tiếp tục

### Báo cáo mâu thuẫn theo format

⚠️ PHÁT HIỆN MÂU THUẪN
.spec nói: {AC từ spec}
Code thực tế: {behaviour thực tế}
Ảnh hưởng: {test sẽ pass hay fail nếu theo spec / theo code}
Cần xác nhận: Spec hay Code là nguồn đúng?

---

## Chọn loại test theo tình huống

| Cần verify | Dùng loại test |
|------------|----------------|
| Business logic, tính toán, mapping | Unit Test |
| API endpoint, DB, auth flow | Integration Test |
| Flow người dùng end-to-end | E2E Test (Playwright) |
| Tất cả AC trong một .spec | Cả 3 — phân tầng |

---

## Unit Test — .NET xUnit

### Cấu trúc file
AdministrationService.Tests/
└── Features/
└── Users/
├── UserServiceTests.cs
└── UserServiceIntegrationTests.cs

### Pattern chuẩn
```csharp
public class UserServiceTests
{
    // Arrange — dữ liệu đầu vào
    // Act     — gọi method cần test
    // Assert  — kiểm tra kết quả

    [Fact]
    public async Task CreateAsync_ValidDto_ReturnsUserDto()
    {
        // Arrange
        var mockUow = new Mock<IUnitOfWork>();
        var mockTenant = new Mock<ITenantService>();
        mockTenant.Setup(x => x.TenantId).Returns(Guid.NewGuid());

        var service = new UserService(mockUow.Object, mockTenant.Object);
        var dto = new CreateUserDto { UserName = "test", Email = "test@test.com" };

        // Act
        var result = await service.CreateAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(dto.UserName, result.UserName);
    }

    [Theory]
    [InlineData("", "email@test.com")]   // username rỗng
    [InlineData("user", "not-an-email")] // email sai format
    public async Task CreateAsync_InvalidInput_ThrowsException(
        string userName, string email)
    {
        // ...
    }
}
```

### Checklist Unit Test theo AC
Với mỗi AC trong .spec.md, gen ít nhất:
- 1 test happy path (input hợp lệ → output đúng)
- 1 test edge case (input rỗng / null / sai format)
- 1 test constraint (vi phạm business rule → exception đúng loại)

---

## Integration Test — API Level

### Cấu trúc file
AdministrationService.Tests/
└── Integration/
└── Users/
└── UsersControllerTests.cs

### Pattern chuẩn
```csharp
public class UsersControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public UsersControllerTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Thay DB thật bằng InMemory hoặc test DB
                services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
                services.AddDbContext<ApplicationDbContext>(opt =>
                    opt.UseInMemoryDatabase("TestDb"));
            });
        }).CreateClient();
    }

    [Fact]
    public async Task POST_CreateUser_WithValidToken_Returns200()
    {
        // Arrange
        var token = await GetTestTokenAsync(); // login với test account
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        var payload = new CreateUserDto { UserName = "newuser", ... };

        // Act
        var response = await _client.PostAsJsonAsync("/api/users", payload);

        // Assert
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<UserDto>();
        Assert.Equal("newuser", result?.UserName);
    }

    [Fact]
    public async Task POST_CreateUser_WithoutToken_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/users", new { });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task POST_CreateUser_WithoutPermission_Returns403()
    {
        var token = await GetTestTokenAsync(role: "Viewer"); // role không có quyền
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.PostAsJsonAsync("/api/users", new { });
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
```

### Checklist Integration Test theo AC
Với mỗi API endpoint trong .spec.md:
- [ ] Happy path — 200/201 với data đúng
- [ ] Unauthorized — 401 khi không có token
- [ ] Forbidden — 403 khi thiếu permission
- [ ] Not Found — 404 khi resource không tồn tại
- [ ] Bad Request — 400 khi input sai

---

## E2E Test — Playwright

### Cấu trúc file
my-nextjs/
└── e2e/
└── {module}/
├── {feature}.spec.ts      ← test file
└── {feature}.fixture.ts   ← test data & helpers

### Pattern chuẩn
```typescript
import { test, expect } from '@playwright/test';

test.describe('User Management', () => {

  test.beforeEach(async ({ page }) => {
    // Login trước mỗi test
    await page.goto('/login');
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'Password123!');
    await page.fill('[name="tenant"]', 'Admin');
    await page.click('button[type="submit"]');
    await page.waitForURL('/products');
  });

  test('AC: Hiển thị danh sách user với phân trang', async ({ page }) => {
    await page.goto('/users');

    // Verify bảng hiển thị
    await expect(page.locator('.ant-table')).toBeVisible();

    // Verify phân trang
    await expect(page.locator('.ant-pagination')).toBeVisible();
  });

  test('AC: Cho phép thêm user mới với đầy đủ thông tin', async ({ page }) => {
    await page.goto('/users');

    // Mở modal
    await page.click('button.tour-add');
    await expect(page.locator('.ant-modal')).toBeVisible();

    // Điền form
    await page.fill('[name="userName"]', 'testuser_e2e');
    await page.fill('[name="email"]', 'e2e@test.com');
    await page.fill('[name="password"]', 'Password123!');

    // Submit
    await page.click('.ant-modal-footer button.ant-btn-primary');

    // Verify thành công
    await expect(page.locator('.ant-message-success')).toBeVisible();
    await expect(page.locator('text=testuser_e2e')).toBeVisible();
  });

  test('AC: Ngăn chặn submit khi thiếu trường bắt buộc', async ({ page }) => {
    await page.goto('/users');
    await page.click('button.tour-add');

    // Submit không điền gì
    await page.click('.ant-modal-footer button.ant-btn-primary');

    // Verify validation errors hiển thị
    await expect(page.locator('.ant-form-item-explain-error')).toBeVisible();

    // Modal vẫn còn mở
    await expect(page.locator('.ant-modal')).toBeVisible();
  });

  test('AC: Tự động hỏi xác nhận khi cancel form đang có thay đổi',
  async ({ page }) => {
    await page.goto('/users');
    await page.click('button.tour-add');

    // Điền một ít rồi cancel
    await page.fill('[name="userName"]', 'partial');
    await page.click('.ant-modal-close');

    // Verify confirm dialog xuất hiện
    await expect(page.locator('.ant-modal-confirm')).toBeVisible();
  });

});
```

### Checklist E2E theo AC
Với mỗi AC dạng "Hiển thị / Cho phép / Ngăn chặn / Tự động":
- [ ] Map 1:1 mỗi AC → 1 test case
- [ ] Tên test = "AC: {nội dung AC}" để trace được
- [ ] beforeEach luôn login với đúng role cần thiết
- [ ] Dùng class `tour-{btnType}` để locate button (đã có sẵn trong AppButton)

---

## Verify .spec vs Code — Checklist đối chiếu

Chạy checklist này trước khi gen test:

### API
[ ] Endpoint trong .spec có tồn tại trong Controller không?
[ ] HTTP method đúng không? (GET/POST/PUT/DELETE)
[ ] Permission attribute khớp với .spec không?
[ ] Response shape khớp với DTO không?

### UI
[ ] Các field trong form khớp với .spec không?
[ ] Validation rule trong Form.Item khớp với AC không?
[ ] Flow mở/đóng modal hoạt động đúng spec không?
[ ] Permission guard đúng chưa? (menu-config.json)

### Business Logic
[ ] Soft delete hay hard delete?
[ ] Scope tenant đúng chưa? (dữ liệu có bị lộ cross-tenant không?)
[ ] Edge case trong .spec đã có handler trong code chưa?

---

## Output sau khi gen test

Báo cáo theo format:

FEATURE: {tên}
SPEC ĐỌC: .agent/specs/{path}
MÂU THUẪN PHÁT HIỆN: {số lượng} — {mô tả ngắn hoặc "Không có"}

TEST ĐÃ GEN:
- Unit: {số test} tại {path}
- Integration: {số test} tại {path}
- E2E: {số test} tại {path}

AC COVERAGE:
- [ ] AC 1: {nội dung} → {test name}
- [ ] AC 2: {nội dung} → {test name}
AC chưa có test: {liệt kê nếu có}

---

## Template bắt buộc cho `{feature}.test.spec.md`

Sau khi gen test xong, **bắt buộc** tạo file `.agent/specs/{module}/{feature}.test.spec.md` theo đúng template này:

```markdown
---
feature: {tên tính năng}
module: {service}
tested-by: unit | integration | e2e
spec-ref: .agent/specs/{module}/{feature}.spec.md
status: pending | done | partial
updated: {ngày}
---

# Test Spec: {Tên tính năng}

## Coverage Map
| AC trong .spec | Unit | Integration | E2E | Kết quả |
|----------------|------|-------------|-----|---------|
| {AC 1}         | ✅   | ✅          | ✅  | pass    |
| {AC 2}         | —    | ✅          | ✅  | pending |

## Conflicts phát hiện
- [ ] {file}: spec nói {X}, code làm {Y} → cần xác nhận

## File test đã tạo
- Unit        : {đường dẫn file test}
- Integration : {đường dẫn file test}
- E2E         : {đường dẫn file test}

## Gợi ý bổ sung vào .spec
- {Edge case nào phát hiện khi test mà .spec chưa có}
```

### Lý do tách `.test.spec.md` khỏi `.spec.md`

| File | Mục đích | Cập nhật khi nào |
|------|----------|------------------|
| `{feature}.spec.md` | Đặc tả **YÊU CẦU** — nguồn sự thật về behavior mong muốn | Khi yêu cầu thay đổi |
| `{feature}.test.spec.md` | Kết quả **TEST** — trạng thái coverage thực tế | Mỗi lần chạy/thêm test |

Giữ riêng để `.spec.md` luôn sạch — không lẫn kết quả test vào tài liệu yêu cầu.
