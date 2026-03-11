import { Page } from '@playwright/test';

export const TEST_ACCOUNTS = {
  hostAdmin: {
    username: 'admin',
    password: 'Password123!',
    tenant: 'Admin',
  },
  regularUser: {
    username: 'user1',
    password: 'Password123!',
    tenant: 'TenantA',
  },
};

export const RATE_LIMIT_CONFIG_URL = '/administration/system-config';

/**
 * Login helper — điều hướng tới trang login và đăng nhập với account được chỉ định.
 */
export async function loginAs(
  page: Page,
  account: { username: string; password: string; tenant: string }
) {
  await page.goto('/login');
  await page.fill('[name="username"]', account.username);
  await page.fill('[name="password"]', account.password);
  await page.fill('[name="tenant"]', account.tenant);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/products', { timeout: 10_000 });
}

/**
 * Điều hướng đến tab System trong System Config page.
 */
export async function navigateToSystemTab(page: Page) {
  await page.goto(RATE_LIMIT_CONFIG_URL);
  // Click tab "System" nếu dùng tabbed layout
  const systemTab = page.locator('[role="tab"]:has-text("System"), [role="tab"]:has-text("Hệ thống")');
  if (await systemTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await systemTab.click();
  }
}
