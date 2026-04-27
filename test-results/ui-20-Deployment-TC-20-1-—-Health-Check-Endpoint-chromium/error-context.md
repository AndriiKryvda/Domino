# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui.spec.ts >> 20. Deployment >> TC-20.1 — Health Check Endpoint
- Location: tests\ui.spec.ts:868:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 429
```

# Test source

```ts
  770 | });
  771 | 
  772 | // ===========================================================================
  773 | // 17. INTERNATIONALIZATION
  774 | // ===========================================================================
  775 | 
  776 | test.describe('17. Internationalization', () => {
  777 |   test('TC-17.1 — Language Switcher', async ({ context }) => {
  778 |     const page = await openHome(context);
  779 | 
  780 |     // Ensure we start with English
  781 |     await page.evaluate(() => { localStorage.removeItem('domino_lang'); });
  782 |     await page.reload();
  783 |     await page.waitForSelector('.home-screen', { timeout: 10_000 });
  784 | 
  785 |     // Should default to English
  786 |     await expect(page.locator('.home-title')).toContainText('Domino');
  787 | 
  788 |     // The lang-switcher IS a <button> with text "EN"
  789 |     const langBtn = page.locator('button.lang-switcher');
  790 |     await expect(langBtn).toBeVisible();
  791 |     await expect(langBtn).toHaveText('EN');
  792 | 
  793 |     // Switch to Ukrainian
  794 |     await langBtn.click();
  795 |     await expect(page.locator('.home-title')).toContainText('Доміно', { timeout: 3000 });
  796 |     await expect(langBtn).toHaveText('UA');
  797 | 
  798 |     // Switch back to English
  799 |     await langBtn.click();
  800 |     await expect(page.locator('.home-title')).toContainText('Domino', { timeout: 3000 });
  801 |     await expect(langBtn).toHaveText('EN');
  802 | 
  803 |     await page.close();
  804 |   });
  805 | });
  806 | 
  807 | // ===========================================================================
  808 | // 18. SECURITY
  809 | // ===========================================================================
  810 | 
  811 | test.describe('18. Security', () => {
  812 |   test('TC-18.2 — XSS Prevention', async ({ context }) => {
  813 |     const page = await openHome(context);
  814 |     // Server sanitizes names by stripping HTML tags: <[^>]*> removed
  815 |     // So '<img onerror=alert>' becomes '' which defaults to 'Player'
  816 |     // This verifies the server-side XSS protection works
  817 |     const xssName = '<img onerror=alert>';
  818 |     await setName(page, xssName);
  819 |     await page.getByRole('button', { name: 'Create Game' }).click();
  820 |     await page.waitForSelector('.lobby-screen');
  821 | 
  822 |     // Server strips HTML tags — name becomes 'Player' (fallback)
  823 |     const playerText = await page.locator('.player-name').first().innerText();
  824 |     // Should NOT contain raw HTML (tags stripped by server)
  825 |     expect(playerText).not.toContain('<img');
  826 |     // Verify no injected HTML elements in the name container
  827 |     const imgCount = await page.locator('.player-name img').count();
  828 |     expect(imgCount).toBe(0);
  829 |     // Name should be sanitized to 'Player' (the default fallback)
  830 |     expect(playerText).toContain('Player');
  831 | 
  832 |     await page.close();
  833 |   });
  834 | });
  835 | 
  836 | // ===========================================================================
  837 | // 19. LIFECYCLE EDGE CASES
  838 | // ===========================================================================
  839 | 
  840 | test.describe('19. Lifecycle Edge Cases', () => {
  841 |   test('TC-19.1 — Leave During Lobby', async ({ context }) => {
  842 |     const host = await openHome(context);
  843 |     const code = await createGame(host, 'Host');
  844 | 
  845 |     const player2 = await openHome(context);
  846 |     await joinGame(player2, 'Player2', code);
  847 |     await expect(host.locator('.player-item')).toHaveCount(2, { timeout: 5000 });
  848 | 
  849 |     // Player2 leaves
  850 |     await player2.getByRole('button', { name: 'Leave' }).click();
  851 |     await expect(player2.locator('.home-screen')).toBeVisible({ timeout: 5000 });
  852 |     await expect(host.locator('.player-item')).toHaveCount(1, { timeout: 5000 });
  853 | 
  854 |     await host.close();
  855 |     await player2.close();
  856 |   });
  857 | });
  858 | 
  859 | // ===========================================================================
  860 | // 20. DEPLOYMENT — Health Check
  861 | // ===========================================================================
  862 | 
  863 | test.describe('20. Deployment', () => {
  864 |   test('TC-20.1 — Health Check Endpoint', async ({ request }) => {
  865 |     const resp = await request.get('/api/health');
  866 |     expect(resp.status()).toBe(200);
  867 |   });
  868 | });
  869 | 
      |                           ^ Error: expect(received).toBe(expected) // Object.is equality
```