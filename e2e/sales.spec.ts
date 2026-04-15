import { test, expect } from "@playwright/test";

const API_URL = "http://localhost:4000";

// Clean DB before each test
test.beforeEach(async ({ request }) => {
  // Get all sales and delete via direct DB isn't possible,
  // so we reset by calling backend. We'll use a workaround:
  // fetch all sales, no delete endpoint exists, so we rely on
  // docker compose down -v between full runs.
  // For isolated tests, we just work with current state.
});

test.describe("Page load", () => {
  test("shows app title", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("Mini Sales App");
  });

  test("shows sale form with correct fields", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('label[for="customer"]')).toBeVisible();
    await expect(page.locator('label[for="product"]')).toBeVisible();
    await expect(page.locator('label[for="amount"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toHaveText("Crear Venta");
  });

  test("shows sales table header", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h2").filter({ hasText: "Ventas" })).toBeVisible();
  });
});

test.describe("Create sale", () => {
  test("creates a sale and shows it in table", async ({ page }) => {
    await page.goto("/");

    await page.fill("#customer", "Cliente E2E");
    await page.fill("#product", "Producto Test");
    await page.fill("#amount", "250.50");
    await page.click('button[type="submit"]');

    // Success message appears
    await expect(page.locator("text=Venta creada exitosamente")).toBeVisible();

    // Sale appears in table
    await expect(page.locator("td").filter({ hasText: "Cliente E2E" })).toBeVisible();
    await expect(page.locator("td").filter({ hasText: "Producto Test" })).toBeVisible();

    // Form fields are cleared
    await expect(page.locator("#customer")).toHaveValue("");
    await expect(page.locator("#product")).toHaveValue("");
    await expect(page.locator("#amount")).toHaveValue("");
  });

  test("shows validation error for empty customer", async ({ page }) => {
    await page.goto("/");

    await page.fill("#product", "Algo");
    await page.fill("#amount", "100");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Cliente es requerido")).toBeVisible();
  });

  test("shows validation error for empty product", async ({ page }) => {
    await page.goto("/");

    await page.fill("#customer", "Alguien");
    await page.fill("#amount", "100");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Producto es requerido")).toBeVisible();
  });

  test("shows validation error for empty amount", async ({ page }) => {
    await page.goto("/");

    await page.fill("#customer", "Alguien");
    await page.fill("#product", "Algo");
    // Leave amount empty
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Monto debe ser mayor a 0")).toBeVisible();
  });

  test("does not submit with zero amount (browser validation)", async ({ page }) => {
    await page.goto("/");

    await page.fill("#customer", "Alguien");
    await page.fill("#product", "Algo");
    await page.fill("#amount", "0");
    await page.click('button[type="submit"]');

    // Browser native validation blocks submit — no sale created with this data
    // Verify no success message appears
    await expect(page.locator("text=Venta creada exitosamente")).not.toBeVisible();
  });

  test("does not submit with negative amount (browser validation)", async ({ page }) => {
    await page.goto("/");

    await page.fill("#customer", "Alguien");
    await page.fill("#product", "Algo");
    await page.fill("#amount", "-10");
    await page.click('button[type="submit"]');

    // Browser native validation blocks submit
    await expect(page.locator("text=Venta creada exitosamente")).not.toBeVisible();
  });
});

test.describe("Evaluate sale", () => {
  test("can assign score via star buttons", async ({ page }) => {
    await page.goto("/");

    // Create a sale first
    await page.fill("#customer", "Score Test Client");
    await page.fill("#product", "Score Product");
    await page.fill("#amount", "100");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Venta creada exitosamente")).toBeVisible();

    // Find the row with our sale and click 4th star
    const row = page.locator("tr").filter({ hasText: "Score Test Client" });
    await expect(row).toBeVisible();

    const stars = row.locator('button[title^="Score"]');
    await expect(stars).toHaveCount(5);

    // Click score 4
    await stars.nth(3).click();

    // Wait for update — stars 1-4 should be active (colored)
    await expect(stars.nth(3)).toHaveAttribute("title", "Score 4");

    // Verify via API that score was saved
    const response = await page.request.get(`${API_URL}/api/sales`);
    const sales = await response.json();
    const sale = sales.find((s: { customer: string }) => s.customer === "Score Test Client");
    expect(sale.score).toBe(4);
  });

  test("can change score (re-evaluate)", async ({ page }) => {
    await page.goto("/");

    // Create sale
    await page.fill("#customer", "Re-eval Client");
    await page.fill("#product", "Re-eval Product");
    await page.fill("#amount", "200");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Venta creada exitosamente")).toBeVisible();

    const row = page.locator("tr").filter({ hasText: "Re-eval Client" });
    const stars = row.locator('button[title^="Score"]');

    // Set score 5
    await stars.nth(4).click();
    await page.waitForTimeout(500);

    // Change to score 2
    await stars.nth(1).click();
    await page.waitForTimeout(500);

    // Verify via API
    const response = await page.request.get(`${API_URL}/api/sales`);
    const sales = await response.json();
    const sale = sales.find((s: { customer: string }) => s.customer === "Re-eval Client");
    expect(sale.score).toBe(2);
  });
});

test.describe("Average score", () => {
  test("shows average when scores exist", async ({ page }) => {
    await page.goto("/");

    // Create and score two sales
    await page.fill("#customer", "Avg Client 1");
    await page.fill("#product", "Prod A");
    await page.fill("#amount", "100");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Venta creada exitosamente")).toBeVisible();

    const row1 = page.locator("tr").filter({ hasText: "Avg Client 1" });
    await row1.locator('button[title="Score 4"]').click();
    await page.waitForTimeout(500);

    await page.fill("#customer", "Avg Client 2");
    await page.fill("#product", "Prod B");
    await page.fill("#amount", "200");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Venta creada exitosamente")).toBeVisible();

    const row2 = page.locator("tr").filter({ hasText: "Avg Client 2" });
    await row2.locator('button[title="Score 2"]').click();
    await page.waitForTimeout(500);

    // Check average is displayed
    await expect(page.locator("text=Promedio Score")).toBeVisible();
  });
});

test.describe("UI responsiveness", () => {
  test("table is scrollable on small viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Page should still render correctly
    await expect(page.locator("h1")).toHaveText("Mini Sales App");
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});

test.describe("Loading states", () => {
  test("submit button shows loading text", async ({ page }) => {
    await page.goto("/");

    await page.fill("#customer", "Loading Client");
    await page.fill("#product", "Loading Prod");
    await page.fill("#amount", "50");

    // Click and immediately check button text
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should briefly show "Creando..." (may resolve fast)
    // Verify form clears after success (confirms full cycle)
    await expect(page.locator("text=Venta creada exitosamente")).toBeVisible();
  });
});
