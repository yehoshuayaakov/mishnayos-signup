import { expect, test, type Page } from "@playwright/test";

const E2E_MANAGE_TOKEN = "e".repeat(64);

type BoardTractate = {
  id: number;
  seder: string;
  name: string;
  chapters: number;
  claimed_by: string | null;
  can_edit: boolean;
  edit_until: string | null;
};

const OPEN: BoardTractate = {
  id: 1,
  seder: "זרעים",
  name: "ברכות",
  chapters: 9,
  claimed_by: null,
  can_edit: false,
  edit_until: null,
};
const TAKEN: BoardTractate = {
  id: 2,
  seder: "זרעים",
  name: "פאה",
  chapters: 8,
  claimed_by: "דוד",
  can_edit: false,
  edit_until: null,
};
const OWNED: BoardTractate = {
  ...TAKEN,
  can_edit: true,
  edit_until: "2099-01-01T00:00:00.000Z",
};

async function mockBoard(page: Page, tractates: BoardTractate[]) {
  await page.route("**/api/campaigns/*/state", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ tractates }),
    });
  });
}

test("claim a free slot and see the name on the board", async ({ page }) => {
  let claimed = false;
  let claimPayload: Record<string, unknown> = {};
  await page.route("**/api/campaigns/*/claim", async (route) => {
    claimed = true;
    claimPayload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
  await mockBoard(page, [OPEN, TAKEN]);
  await page.goto("/e2e");
  await expect(page.getByRole("heading", { name: "בדיקת מערכת" })).toBeVisible();
  await page.getByRole("button", { name: "לקבלת המסכת" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("15 דקות")).toBeVisible();
  await dialog.getByLabel("השם שלכם (חובה)").fill("שרה");
  await dialog.getByRole("button", { name: "קבלת המסכת" }).click();
  expect(claimed).toBe(true);
  expect(claimPayload).toEqual({ id: OPEN.id, name: "שרה" });
  await expect(page.getByText("תודה רבה! המסכת נרשמה על שמכם")).toBeVisible();
});

test("duplicate claim shows the already-taken message", async ({ page }) => {
  await page.route("**/api/campaigns/*/claim", async (route) => {
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({ error: "already_claimed" }),
    });
  });
  await mockBoard(page, [OPEN]);
  await page.goto("/e2e");
  await page.getByRole("button", { name: "לקבלת המסכת" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("השם שלכם (חובה)").fill("שרה");
  await dialog.getByRole("button", { name: "קבלת המסכת" }).click();
  await expect(page.getByText("המסכת הזו נתפסה זה עתה")).toBeVisible();
});

test("AC-BIALA-002 reminder controls and copy are hidden in the claim dialog", async ({
  page,
}) => {
  await mockBoard(page, [OPEN]);
  await page.goto("/e2e");
  await page.getByRole("button", { name: "לקבלת המסכת" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("קבלת תזכורות", { exact: true })).toHaveCount(0);
  await expect(dialog.getByLabel("כתובת אימייל (חובה)")).toHaveCount(0);
  await expect(dialog.getByRole("radio", { name: "שבוע לפני הסיום" })).toHaveCount(0);
  await expect(dialog.getByText("שיחה טלפונית")).toHaveCount(0);
});

test("claim dialog stays usable at phone widths", async ({ page }) => {
  await mockBoard(page, [OPEN]);

  for (const viewport of [
    { width: 320, height: 568 },
    { width: 375, height: 667 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/e2e");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await page.getByRole("button", { name: "לקבלת המסכת" }).click();
    const dialog = page.getByRole("dialog");

    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await expect(dialog.getByText("קבלת תזכורות", { exact: true })).toHaveCount(0);
    await expect(dialog.getByRole("button", { name: "קבלת המסכת" })).toBeInViewport();
    await expect(dialog.getByRole("button", { name: "ביטול" })).toBeInViewport();
  }
});

test("AC-BIALA-006 root redirects to the configured campaign", async ({ page }) => {
  await mockBoard(page, [OPEN]);
  await page.goto("/");
  await expect(page).toHaveURL(/\/e2e$/);
  await expect(page.getByRole("heading", { name: "בדיקת מערכת" })).toBeVisible();
});

test("claimant edit is visible only to its capability and can release without a password", async ({
  page,
}) => {
  let released = false;
  await page.route("**/api/campaigns/*/edit", async (route) => {
    const body = route.request().postDataJSON() as { action?: string };
    released = body.action === "release";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
  await mockBoard(page, [OWNED]);
  await page.goto("/e2e");
  await page.getByRole("button", { name: "עריכה" }).click();
  await expect(page.getByLabel("סיסמת עריכה")).toHaveCount(0);
  await page.getByRole("button", { name: "שחרור" }).click();
  expect(released).toBe(true);
  await expect(page.getByText("המסכת שוחררה")).toBeVisible();
});

test("visitor cannot see another claimant's edit control", async ({ page }) => {
  await mockBoard(page, [TAKEN]);
  await page.goto("/e2e");
  await expect(page.getByRole("button", { name: "עריכה" })).toHaveCount(0);
});

test("organizer editor stays usable at phone widths", async ({ page }) => {
  let saved = false;
  await page.route("**/api/admin/campaigns/1", async (route) => {
    saved = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/admin/campaigns/1");
  await expect(page.getByRole("heading", { name: "פרטי החלוקה" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel("כותרת", { exact: true }).fill("כותרת חדשה");
  await page.getByRole("button", { name: "שמירת פרטים" }).click();
  expect(saved).toBe(true);
  await expect(page.getByText("פרטי החלוקה נשמרו")).toBeVisible();
});

test("manage page can unsubscribe", async ({ page }) => {
  let unsubscribed = false;
  await page.route("**/api/reminders/**", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    unsubscribed = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
  await page.goto(`/reminders/${E2E_MANAGE_TOKEN}`);
  await expect(page.getByRole("heading", { name: "ניהול תזכורות" })).toBeVisible();
  await page.getByTestId("unsubscribe-btn").click();
  expect(unsubscribed).toBe(true);
  await expect(page.getByText("התזכורות בוטלו")).toBeVisible();
});
