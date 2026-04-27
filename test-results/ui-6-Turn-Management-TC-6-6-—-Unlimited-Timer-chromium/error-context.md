# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui.spec.ts >> 6. Turn Management >> TC-6.6 — Unlimited Timer
- Location: tests\ui.spec.ts:422:7

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
  10  |   // Clear session storage via init script to prevent auto-reconnect
> 11  |   await page.addInitScript(() => {
      |              ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  12  |     try { sessionStorage.clear(); } catch {}
  13  |   });
  14  |   await page.goto('/');
  15  |   await page.waitForSelector('.home-screen');
  16  |   return page;
  17  | }
  18  | 
  19  | /** Fill in the player name on the home screen */
  20  | async function setName(page: Page, name: string) {
  21  |   const input = page.locator('.home-card .form-group input[type="text"]').first();
  22  |   await input.fill(name);
  23  | }
  24  | 
  25  | /** Create a game and return the join code */
  26  | async function createGame(
  27  |   page: Page,
  28  |   name: string,
  29  |   opts?: { targetScore?: string; maxPlayers?: string; timer?: string },
  30  | ): Promise<string> {
  31  |   await setName(page, name);
  32  |   if (opts?.targetScore) await page.locator('select').nth(0).selectOption(opts.targetScore);
  33  |   if (opts?.maxPlayers) await page.locator('select').nth(1).selectOption(opts.maxPlayers);
  34  |   if (opts?.timer) await page.locator('select').nth(2).selectOption(opts.timer);
  35  |   await page.getByRole('button', { name: 'Create Game' }).click();
  36  |   await page.waitForSelector('.lobby-screen');
  37  |   const code = await page.locator('.join-code').innerText();
  38  |   return code.replace(/\s|Copied!/g, '').trim();
  39  | }
  40  | 
  41  | /** Join an existing game */
  42  | async function joinGame(page: Page, name: string, code: string) {
  43  |   await setName(page, name);
  44  |   await page.locator('.join-row input').fill(code);
  45  |   await page.getByRole('button', { name: 'Join' }).click();
  46  |   await page.waitForSelector('.lobby-screen');
  47  | }
  48  | 
  49  | /** Wait for the game board to appear */
  50  | async function waitForGameBoard(page: Page) {
  51  |   await page.waitForSelector('.game-screen', { timeout: 15_000 });
  52  | }
  53  | 
  54  | /** Small sleep helper */
  55  | function sleep(ms: number) {
  56  |   return new Promise((r) => setTimeout(r, ms));
  57  | }
  58  | 
  59  | // ===========================================================================
  60  | // 1. HOME SCREEN
  61  | // ===========================================================================
  62  | 
  63  | test.describe('1. Home Screen', () => {
  64  |   test('TC-1.1 — Display Elements', async ({ context }) => {
  65  |     const page = await openHome(context);
  66  |     await expect(page.locator('.home-title')).toBeVisible();
  67  |     await expect(page.getByRole('button', { name: 'Create Game' })).toBeVisible();
  68  |     await expect(page.locator('.join-row input')).toBeVisible();
  69  |     await expect(page.locator('.home-card .form-group input[type="text"]').first()).toBeVisible();
  70  |     await expect(page.locator('.lang-switcher')).toBeVisible();
  71  |     await page.close();
  72  |   });
  73  | 
  74  |   test('TC-1.3 — Create Game Requires Name', async ({ context }) => {
  75  |     const page = await openHome(context);
  76  |     // Clear name and try to create
  77  |     const nameInput = page.locator('.home-card .form-group input[type="text"]').first();
  78  |     await nameInput.fill('');
  79  |     await page.getByRole('button', { name: 'Create Game' }).click();
  80  |     // Should see error, stay on home screen
  81  |     await expect(page.locator('.home-screen')).toBeVisible();
  82  |     // Now enter name → should succeed
  83  |     await nameInput.fill('TestPlayer');
  84  |     await page.getByRole('button', { name: 'Create Game' }).click();
  85  |     await page.waitForSelector('.lobby-screen');
  86  |     await page.close();
  87  |   });
  88  | 
  89  |   test('TC-1.4 — Join Game Requires Name and Code', async ({ context }) => {
  90  |     const page = await openHome(context);
  91  |     // No name, no code
  92  |     const joinBtn = page.getByRole('button', { name: 'Join' });
  93  |     await joinBtn.click();
  94  |     await expect(page.locator('.home-screen')).toBeVisible();
  95  | 
  96  |     // Name but invalid code
  97  |     await setName(page, 'Alice');
  98  |     await page.locator('.join-row input').fill('ZZZZZZ');
  99  |     await joinBtn.click();
  100 |     // Should still be on home or show error
  101 |     await sleep(1000);
  102 |     const onLobby = await page.locator('.lobby-screen').isVisible().catch(() => false);
  103 |     // Expect NOT on lobby (invalid code)
  104 |     if (!onLobby) {
  105 |       await expect(page.locator('.home-screen')).toBeVisible();
  106 |     }
  107 |     await page.close();
  108 |   });
  109 | 
  110 |   test('TC-1.6 — Game Settings on Create', async ({ context }) => {
  111 |     const page = await openHome(context);
```