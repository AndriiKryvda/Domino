# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui.spec.ts >> 5. Gameplay — Drawing & Passing >> TC-5.6 — Boneyard Count Display
- Location: tests\ui.spec.ts:370:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('.home-screen,.lobby-screen,.game-screen') to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=e1]: Too many requests, please try again later.
```

# Test source

```ts
  1   | import { test, expect, Page, BrowserContext } from '@playwright/test';
  2   | 
  3   | // ---------------------------------------------------------------------------
  4   | // Helpers
  5   | // ---------------------------------------------------------------------------
  6   | 
  7   | /** Open a fresh page and go to the home screen */
  8   | async function openHome(context: BrowserContext): Promise<Page> {
  9   |   const page = await context.newPage();
  10  |   await page.goto('/');
> 11  |   await page.waitForSelector('.home-screen,.lobby-screen,.game-screen', { timeout: 10_000 });
      |              ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  12  |   // If we auto-reconnected to a game, clear session and reload
  13  |   if (await page.locator('.home-screen').isVisible().catch(() => false)) {
  14  |     return page;
  15  |   }
  16  |   // Not on home screen — clear session and reload
  17  |   await page.evaluate(() => { try { sessionStorage.clear(); } catch {} });
  18  |   await page.goto('/');
  19  |   await page.waitForSelector('.home-screen', { timeout: 10_000 });
  20  |   return page;
  21  | }
  22  | 
  23  | /** Fill in the player name on the home screen */
  24  | async function setName(page: Page, name: string) {
  25  |   const input = page.locator('.home-card .form-group input[type="text"]').first();
  26  |   await input.fill(name);
  27  | }
  28  | 
  29  | /** Create a game and return the join code */
  30  | async function createGame(
  31  |   page: Page,
  32  |   name: string,
  33  |   opts?: { targetScore?: string; maxPlayers?: string; timer?: string },
  34  | ): Promise<string> {
  35  |   await setName(page, name);
  36  |   if (opts?.targetScore) await page.locator('select').nth(0).selectOption(opts.targetScore);
  37  |   if (opts?.maxPlayers) await page.locator('select').nth(1).selectOption(opts.maxPlayers);
  38  |   if (opts?.timer) await page.locator('select').nth(2).selectOption(opts.timer);
  39  |   await page.getByRole('button', { name: 'Create Game' }).click();
  40  |   await page.waitForSelector('.lobby-screen');
  41  |   const code = await page.locator('.join-code').innerText();
  42  |   return code.replace(/\s|Copied!/g, '').trim();
  43  | }
  44  | 
  45  | /** Join an existing game */
  46  | async function joinGame(page: Page, name: string, code: string) {
  47  |   await setName(page, name);
  48  |   await page.locator('.join-row input').fill(code);
  49  |   await page.getByRole('button', { name: 'Join' }).click();
  50  |   await page.waitForSelector('.lobby-screen');
  51  | }
  52  | 
  53  | /** Wait for the game board to appear */
  54  | async function waitForGameBoard(page: Page) {
  55  |   await page.waitForSelector('.game-screen', { timeout: 15_000 });
  56  | }
  57  | 
  58  | /** Small sleep helper */
  59  | function sleep(ms: number) {
  60  |   return new Promise((r) => setTimeout(r, ms));
  61  | }
  62  | 
  63  | // ===========================================================================
  64  | // 1. HOME SCREEN
  65  | // ===========================================================================
  66  | 
  67  | test.describe('1. Home Screen', () => {
  68  |   test('TC-1.1 — Display Elements', async ({ context }) => {
  69  |     const page = await openHome(context);
  70  |     await expect(page.locator('.home-title')).toBeVisible();
  71  |     await expect(page.getByRole('button', { name: 'Create Game' })).toBeVisible();
  72  |     await expect(page.locator('.join-row input')).toBeVisible();
  73  |     await expect(page.locator('.home-card .form-group input[type="text"]').first()).toBeVisible();
  74  |     await expect(page.locator('.lang-switcher')).toBeVisible();
  75  |     await page.close();
  76  |   });
  77  | 
  78  |   test('TC-1.3 — Create Game Requires Name', async ({ context }) => {
  79  |     const page = await openHome(context);
  80  |     // Clear name and try to create
  81  |     const nameInput = page.locator('.home-card .form-group input[type="text"]').first();
  82  |     await nameInput.fill('');
  83  |     await page.getByRole('button', { name: 'Create Game' }).click();
  84  |     // Should see error, stay on home screen
  85  |     await expect(page.locator('.home-screen')).toBeVisible();
  86  |     // Now enter name → should succeed
  87  |     await nameInput.fill('TestPlayer');
  88  |     await page.getByRole('button', { name: 'Create Game' }).click();
  89  |     await page.waitForSelector('.lobby-screen');
  90  |     await page.close();
  91  |   });
  92  | 
  93  |   test('TC-1.4 — Join Game Requires Name and Code', async ({ context }) => {
  94  |     const page = await openHome(context);
  95  |     // No name, no code
  96  |     const joinBtn = page.getByRole('button', { name: 'Join' });
  97  |     await joinBtn.click();
  98  |     await expect(page.locator('.home-screen')).toBeVisible();
  99  | 
  100 |     // Name but invalid code
  101 |     await setName(page, 'Alice');
  102 |     await page.locator('.join-row input').fill('ZZZZZZ');
  103 |     await joinBtn.click();
  104 |     // Should still be on home or show error
  105 |     await sleep(1000);
  106 |     const onLobby = await page.locator('.lobby-screen').isVisible().catch(() => false);
  107 |     // Expect NOT on lobby (invalid code)
  108 |     if (!onLobby) {
  109 |       await expect(page.locator('.home-screen')).toBeVisible();
  110 |     }
  111 |     await page.close();
```