using AdministrationService.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using Moq;
using System.Text;
using Xunit;

namespace AdministrationService.Tests.Integration.SystemConfig;

/// <summary>
/// Integration-style Unit tests cho SystemConfigController
/// Bám theo AC trong rate-limiting.spec.md:
///   AC-3: Cấu hình từ UI cập nhật thẳng vào Redis
///   AC-4: GET load dữ liệu từ Redis, fallback default nếu key trống
///   AC-5: [Authorize] bảo vệ — test 401 khi không auth (xem note mâu thuẫn)
/// </summary>
public class SystemConfigControllerTests
{
    // ─── Helpers ───────────────────────────────────────────────────────────────

    private static SystemConfigController BuildController(Mock<IDistributedCache>? cacheMock = null)
    {
        cacheMock ??= new Mock<IDistributedCache>();
        var controller = new SystemConfigController(cacheMock.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };
        return controller;
    }

    private static Mock<IDistributedCache> BuildCacheReturning(string? globalLimit, string? authLimit)
    {
        var mock = new Mock<IDistributedCache>();

        SetupCacheValue(mock, "RateLimit:Global:PermitLimit", globalLimit ?? "100");
        SetupCacheValue(mock, "RateLimit:Auth:PermitLimit", authLimit ?? "5");

        return mock;
    }

    private static void SetupCacheValue(Mock<IDistributedCache> mock, string key, string value)
    {
        mock.Setup(c => c.GetAsync(key, default))
            .ReturnsAsync(Encoding.UTF8.GetBytes(value));
    }

    // ─── AC-3 & AC-4: GET /api/SystemConfig/rate-limit ───────────────────────

    /// <summary>
    /// AC-4: GET trả về GlobalLimit và AuthLimit từ Redis đúng giá trị.
    /// </summary>
    [Fact]
    public async Task GET_RateLimitConfig_WhenRedisHasValues_ShouldReturnCorrectLimits()
    {
        // Arrange
        var mockCache = BuildCacheReturning(globalLimit: "150", authLimit: "8");
        var controller = BuildController(mockCache);

        // Act
        var result = await controller.GetRateLimitConfig();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var config = Assert.IsType<SystemConfigController.RateLimitConfig>(okResult.Value);
        Assert.Equal(150, config.GlobalLimit);
        Assert.Equal(8, config.AuthLimit);
    }

    /// <summary>
    /// AC-4: GET trả về default (100/5) khi Redis keys không tồn tại.
    /// </summary>
    [Fact]
    public async Task GET_RateLimitConfig_WhenRedisEmpty_ShouldReturnDefaults()
    {
        // Arrange — cache trả null → fallback "100" và "5" trong code
        var mockCache = new Mock<IDistributedCache>();
        mockCache.Setup(c => c.GetAsync("RateLimit:Global:PermitLimit", default))
                 .ReturnsAsync((byte[]?)null);
        mockCache.Setup(c => c.GetAsync("RateLimit:Auth:PermitLimit", default))
                 .ReturnsAsync((byte[]?)null);

        var controller = BuildController(mockCache);

        // Act
        var result = await controller.GetRateLimitConfig();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var config = Assert.IsType<SystemConfigController.RateLimitConfig>(okResult.Value);
        Assert.Equal(100, config.GlobalLimit);
        Assert.Equal(5, config.AuthLimit);
    }

    /// <summary>
    /// AC-4: GET trả về 200 OK với shape đúng { GlobalLimit, AuthLimit }.
    /// </summary>
    [Fact]
    public async Task GET_RateLimitConfig_ShouldReturn200WithCorrectShape()
    {
        // Arrange
        var mockCache = BuildCacheReturning("50", "3");
        var controller = BuildController(mockCache);

        // Act
        var result = await controller.GetRateLimitConfig();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(200, okResult.StatusCode);
        Assert.IsType<SystemConfigController.RateLimitConfig>(okResult.Value);
    }

    // ─── AC-3: POST /api/SystemConfig/rate-limit ─────────────────────────────

    /// <summary>
    /// AC-3: POST với config hợp lệ phải ghi GlobalLimit và AuthLimit vào Redis.
    /// </summary>
    [Fact]
    public async Task POST_UpdateRateLimitConfig_WithValidConfig_ShouldWriteBothKeysToRedis()
    {
        // Arrange
        var mockCache = new Mock<IDistributedCache>();
        var controller = BuildController(mockCache);
        var payload = new SystemConfigController.RateLimitConfig
        {
            GlobalLimit = 200,
            AuthLimit = 10
        };

        // Act
        var result = await controller.UpdateRateLimitConfig(payload);

        // Assert — 200 OK
        Assert.IsType<OkObjectResult>(result);

        // Verify Redis được ghi đúng 2 keys
        mockCache.Verify(
            c => c.SetAsync(
                "RateLimit:Global:PermitLimit",
                It.Is<byte[]>(b => Encoding.UTF8.GetString(b) == "200"),
                It.IsAny<DistributedCacheEntryOptions>(),
                default),
            Times.Once, "Phải ghi GlobalLimit=200 vào Redis");

        mockCache.Verify(
            c => c.SetAsync(
                "RateLimit:Auth:PermitLimit",
                It.Is<byte[]>(b => Encoding.UTF8.GetString(b) == "10"),
                It.IsAny<DistributedCacheEntryOptions>(),
                default),
            Times.Once, "Phải ghi AuthLimit=10 vào Redis");
    }

    /// <summary>
    /// AC-3: POST thành công phải trả về 200 OK với message xác nhận.
    /// </summary>
    [Fact]
    public async Task POST_UpdateRateLimitConfig_ShouldReturn200WithSuccessMessage()
    {
        // Arrange
        var mockCache = new Mock<IDistributedCache>();
        var controller = BuildController(mockCache);
        var payload = new SystemConfigController.RateLimitConfig { GlobalLimit = 100, AuthLimit = 5 };

        // Act
        var result = await controller.UpdateRateLimitConfig(payload);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(200, okResult.StatusCode);

        // Kiểm tra message field tồn tại
        var value = okResult.Value;
        Assert.NotNull(value);
        var messageProperty = value.GetType().GetProperty("Message");
        Assert.NotNull(messageProperty);
        var message = messageProperty.GetValue(value)?.ToString();
        Assert.False(string.IsNullOrEmpty(message));
    }

    /// <summary>
    /// AC-3: POST cấu hình zero limit cũng phải ghi Redis (không bị filter).
    /// Gateway sẽ drop mọi request nếu cấu hình 0.
    /// </summary>
    [Fact]
    public async Task POST_UpdateRateLimitConfig_WithZeroValues_ShouldStillWriteToRedis()
    {
        // Arrange
        var mockCache = new Mock<IDistributedCache>();
        var controller = BuildController(mockCache);
        var payload = new SystemConfigController.RateLimitConfig { GlobalLimit = 0, AuthLimit = 0 };

        // Act
        var result = await controller.UpdateRateLimitConfig(payload);

        // Assert
        Assert.IsType<OkObjectResult>(result);
        mockCache.Verify(
            c => c.SetAsync(
                "RateLimit:Global:PermitLimit",
                It.Is<byte[]>(b => Encoding.UTF8.GetString(b) == "0"),
                It.IsAny<DistributedCacheEntryOptions>(),
                default),
            Times.Once);
    }

    /// <summary>
    /// AC-3: POST ghi đúng cả 2 key — không chỉ 1 key.
    /// Giải quyết edge case partial update.
    /// </summary>
    [Fact]
    public async Task POST_UpdateRateLimitConfig_ShouldWriteExactly2Keys()
    {
        // Arrange
        var mockCache = new Mock<IDistributedCache>();
        var controller = BuildController(mockCache);
        var payload = new SystemConfigController.RateLimitConfig { GlobalLimit = 80, AuthLimit = 4 };

        // Act
        await controller.UpdateRateLimitConfig(payload);

        // Assert — SetAsync được gọi đúng 2 lần
        mockCache.Verify(
            c => c.SetAsync(
                It.IsAny<string>(),
                It.IsAny<byte[]>(),
                It.IsAny<DistributedCacheEntryOptions>(),
                default),
            Times.Exactly(2));
    }

    // ─── AC-5: Authorization — Ghi chú mâu thuẫn ────────────────────────────
    // ⚠️ SPEC yêu cầu chỉ Host Tenant Admin mới có quyền (hostOnly: true).
    // Code thực tế dùng [Authorize] cơ bản — chưa có guard TenantId.
    // Test dưới đây verify những gì CODE THỰC TẾ đang làm (JWT auth cơ bản).
    // Khi implement Host-Only guard, cần thêm test 403 cho non-host tenant.

    /// <summary>
    /// AC-5 (partial): Controller phải được bảo vệ bởi [Authorize] attribute.
    /// </summary>
    [Fact]
    public void SystemConfigController_ShouldHaveAuthorizeAttribute()
    {
        // Act
        var controllerType = typeof(SystemConfigController);
        var hasAuthorize = controllerType
            .GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), true)
            .Any();

        // Assert
        Assert.True(hasAuthorize, "SystemConfigController phải có [Authorize] để bảo vệ endpoint");
    }

    /// <summary>
    /// AC-5 (partial): Controller phải là ApiController.
    /// </summary>
    [Fact]
    public void SystemConfigController_ShouldHaveApiControllerAttribute()
    {
        var controllerType = typeof(SystemConfigController);
        var hasApiController = controllerType
            .GetCustomAttributes(typeof(Microsoft.AspNetCore.Mvc.ApiControllerAttribute), true)
            .Any();

        Assert.True(hasApiController);
    }

    /// <summary>
    /// AC-5 (partial): Route phải là api/SystemConfig.
    /// </summary>
    [Fact]
    public void SystemConfigController_ShouldHaveCorrectRoute()
    {
        var controllerType = typeof(SystemConfigController);
        var routeAttr = controllerType
            .GetCustomAttributes(typeof(Microsoft.AspNetCore.Mvc.RouteAttribute), true)
            .FirstOrDefault() as Microsoft.AspNetCore.Mvc.RouteAttribute;

        Assert.NotNull(routeAttr);
        Assert.Contains("SystemConfig", routeAttr.Template, StringComparison.OrdinalIgnoreCase);
    }
}
