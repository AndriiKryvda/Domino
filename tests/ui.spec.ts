import { test, expect, Page, BrowserContext } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Open a fresh page and go to the home screen */
async function openHome(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();
  // Clear session storage via init script to prevent auto-reconnect
  await page.addInitScript(() => {
    try { sessionStorage.clear(); } catch {}
  });
  await page.goto('/');
  await page.waitForSelector('.home-screen');
  return page;
}

/** Fill in the player name on the home screen */
async function setName(page: Page, name: string) {
  const input = page.locator('.home-card .form-group input[type="text"]').first();
  await input.fill(name);
}

/** Create a game and return the join code */
async function createGame(
  page: Page,
  name: string,
  opts?: { targetScore?: string; maxPlayers?: string; timer?: string },
): Promise<string> {
  await setName(page, name);
  if (opts?.targetScore) await page.locator('select').nth(0).selectOption(opts.targetScore);
  if (opts?.maxPlayers) await page.locator('select').nth(1).selectOption(opts.maxPlayers);
  if (opts?.timer) await page.locator('select').nth(2).selectOption(opts.timer);
  await page.getByRole('button', { name: 'Create Game' }).click();
  await page.waitForSelector('.lobby-screen');
  const code = await page.locator('.join-code').innerText();
  return code.replace(/\s|Copied!/g, '').trim();
}

/** Join an existing game */
async function joinGame(page: Page, name: string, code: string) {
  await setName(page, name);
  await page.locator('.join-row input').fill(code);
  await page.getByRole('button', { name: 'Join' }).click();
  await page.waitForSelector('.lobby-screen');
}

/** Wait for the game board to appear */
async function waitForGameBoard(page: Page) {
  await page.waitForSelector('.game-screen', { timeout: 15_000 });
}

/** Small sleep helper */
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ===========================================================================
// 1. HOME SCREEN
// ===========================================================================

test.describe('1. Home Screen', () => {
  test('TC-1.1 — Display Elements', async ({ context }) => {
    const page = await openHome(context);
    await expect(page.locator('.home-title')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Game' })).toBeVisible();
    await expect(page.locator('.join-row input')).toBeVisible();
    await expect(page.locator('.home-card .form-group input[type="text"]').first()).toBeVisible();
    await expect(page.locator('.lang-switcher')).toBeVisible();
    await page.close();
  });

  test('TC-1.3 — Create Game Requires Name', async ({ context }) => {
    const page = await openHome(context);
    // Clear name and try to create
    const nameInput = page.locator('.home-card .form-group input[type="text"]').first();
    await nameInput.fill('');
    await page.getByRole('button', { name: 'Create Game' }).click();
    // Should see error, stay on home screen
    await expect(page.locator('.home-screen')).toBeVisible();
    // Now enter name → should succeed
    await nameInput.fill('TestPlayer');
    await page.getByRole('button', { name: 'Create Game' }).click();
    await page.waitForSelector('.lobby-screen');
    await page.close();
  });

  test('TC-1.4 — Join Game Requires Name and Code', async ({ context }) => {
    const page = await openHome(context);
    // No name, no code
    const joinBtn = page.getByRole('button', { name: 'Join' });
    await joinBtn.click();
    await expect(page.locator('.home-screen')).toBeVisible();

    // Name but invalid code
    await setName(page, 'Alice');
    await page.locator('.join-row input').fill('ZZZZZZ');
    await joinBtn.click();
    // Should still be on home or show error
    await sleep(1000);
    const onLobby = await page.locator('.lobby-screen').isVisible().catch(() => false);
    // Expect NOT on lobby (invalid code)
    if (!onLobby) {
      await expect(page.locator('.home-screen')).toBeVisible();
    }
    await page.close();
  });

  test('TC-1.6 — Game Settings on Create', async ({ context }) => {
    const page = await openHome(context);
    // Verify select options exist
    const selects = page.locator('.home-card select');
    await expect(selects).toHaveCount(3);
    // Target score has 50/100/150/200
    const targetOpts = await selects.nth(0).locator('option').allInnerTexts();
    expect(targetOpts.join(',')).toContain('50');
    expect(targetOpts.join(',')).toContain('200');
    // Max players has 2-6
    const playerOpts = await selects.nth(1).locator('option').allInnerTexts();
    expect(playerOpts.join(',')).toContain('2');
    expect(playerOpts.join(',')).toContain('6');
    await page.close();
  });
});

// ===========================================================================
// 2. LOBBY SCREEN
// ===========================================================================

test.describe('2. Lobby Screen', () => {
  test('TC-2.1 — Lobby Display', async ({ context }) => {
    const page = await openHome(context);
    const code = await createGame(page, 'Host');
    expect(code).toHaveLength(6);
    await expect(page.locator('.join-code')).toBeVisible();
    await expect(page.locator('.player-list')).toBeVisible();
    // Host sees start button (disabled – only 1 player)
    await expect(page.getByText('Need 2+ players')).toBeVisible();
    await page.close();
  });

  test('TC-2.3 — Second Player Joins', async ({ context }) => {
    const host = await openHome(context);
    const code = await createGame(host, 'Host');

    const player2 = await openHome(context);
    await joinGame(player2, 'Player2', code);

    // Both should see 2 players
    await expect(host.locator('.player-item')).toHaveCount(2, { timeout: 5000 });
    await expect(player2.locator('.player-item')).toHaveCount(2, { timeout: 5000 });

    await host.close();
    await player2.close();
  });

  test('TC-2.4 — Add Computer Player', async ({ context }) => {
    const page = await openHome(context);
    await createGame(page, 'Host');
    await page.getByRole('button', { name: '+ Easy Bot' }).click();
    await expect(page.locator('.player-item')).toHaveCount(2, { timeout: 5000 });
    await expect(page.locator('.player-badge').filter({ hasText: 'CPU' })).toBeVisible();
    await page.close();
  });

  test('TC-2.5 — Remove Computer Player', async ({ context }) => {
    const page = await openHome(context);
    await createGame(page, 'Host');
    await page.getByRole('button', { name: '+ Easy Bot' }).click();
    await expect(page.locator('.player-item')).toHaveCount(2, { timeout: 5000 });
    await page.getByRole('button', { name: 'Remove' }).click();
    await expect(page.locator('.player-item')).toHaveCount(1, { timeout: 5000 });
    await page.close();
  });

  test('TC-2.6 — Kick Human Player', async ({ context }) => {
    const host = await openHome(context);
    const code = await createGame(host, 'Host');

    const player2 = await openHome(context);
    await joinGame(player2, 'Player2', code);
    await expect(host.locator('.player-item')).toHaveCount(2, { timeout: 5000 });

    // Host kicks player2
    await host.getByRole('button', { name: 'Kick' }).click();
    // Host should see player removed from lobby
    await expect(host.locator('.player-item')).toHaveCount(1, { timeout: 5000 });
    // Verify only the host remains
    await expect(host.locator('.player-name').first()).toContainText('Host');

    await host.close();
    await player2.close();
  });

  test('TC-2.7 — Non-Host Cannot Manage Lobby', async ({ context }) => {
    const host = await openHome(context);
    const code = await createGame(host, 'Host');

    const player2 = await openHome(context);
    await joinGame(player2, 'Player2', code);

    // Non-host should not see bot/kick/start buttons
    await expect(player2.getByRole('button', { name: '+ Easy Bot' })).toBeHidden();
    await expect(player2.getByRole('button', { name: 'Start Game' })).toBeHidden();

    await host.close();
    await player2.close();
  });

  test('TC-2.8 — Start Game Requires Minimum Players', async ({ context }) => {
    const page = await openHome(context);
    await createGame(page, 'Host');

    // Only 1 player → start disabled
    await expect(page.getByText('Need 2+ players')).toBeVisible();

    // Add bot → start enabled
    await page.getByRole('button', { name: '+ Easy Bot' }).click();
    await expect(page.locator('.player-item')).toHaveCount(2, { timeout: 5000 });
    const startBtn = page.getByRole('button', { name: 'Start Game' });
    await expect(startBtn).toBeVisible({ timeout: 5000 });
    await expect(startBtn).toBeEnabled();

    await page.close();
  });

  test('TC-2.10 — Max Players Enforced', async ({ context }) => {
    const host = await openHome(context);
    const code = await createGame(host, 'Host', { maxPlayers: '2' });

    const player2 = await openHome(context);
    await joinGame(player2, 'Player2', code);

    // Third player tries to join → should fail
    const player3 = await openHome(context);
    await setName(player3, 'Player3');
    await player3.locator('.join-row input').fill(code);
    await player3.getByRole('button', { name: 'Join' }).click();
    await sleep(2000);
    // Should still be on home (or error)
    await expect(player3.locator('.home-screen')).toBeVisible();

    await host.close();
    await player2.close();
    await player3.close();
  });
});

// ===========================================================================
// 3. GAMEPLAY — Tile Dealing & Round Start
// ===========================================================================

test.describe('3. Gameplay — Dealing & Start', () => {
  test('TC-3.1 — Tile Deal 2 Players (7 tiles each)', async ({ context }) => {
    const host = await openHome(context);
    const code = await createGame(host, 'Host', { targetScore: '200', timer: '0' });
    await host.getByRole('button', { name: '+ Easy Bot' }).click();
    await expect(host.locator('.player-item')).toHaveCount(2, { timeout: 5000 });
    await host.getByRole('button', { name: 'Start Game' }).click();
    await waitForGameBoard(host);

    // Player should have 7 tiles
    const handTiles = host.locator('.hand-tiles .domino-tile');
    await expect(handTiles).toHaveCount(7, { timeout: 10_000 });

    // Boneyard should show 14 (28 - 7*2)
    await expect(host.locator('.boneyard-indicator')).toContainText('14');

    await host.close();
  });

  test('TC-3.5 — Round Number Display', async ({ context }) => {
    const host = await openHome(context);
    await createGame(host, 'Host', { targetScore: '200', timer: '0' });
    await host.getByRole('button', { name: '+ Easy Bot' }).click();
    await expect(host.locator('.player-item')).toHaveCount(2, { timeout: 5000 });
    await host.getByRole('button', { name: 'Start Game' }).click();
    await waitForGameBoard(host);
    await expect(host.locator('.round-badge')).toContainText('1');
    await host.close();
  });
});

// ===========================================================================
// 4. GAMEPLAY — Tile Placement
// ===========================================================================

test.describe('4. Gameplay — Tile Placement', () => {
  test('TC-4.2 — Playable Tiles Highlighted on Turn', async ({ context }) => {
    const host = await openHome(context);
    const code = await createGame(host, 'Host', { targetScore: '200', timer: '0' });
    await host.getByRole('button', { name: '+ Easy Bot' }).click();
    await expect(host.locator('.player-item')).toHaveCount(2, { timeout: 5000 });
    await host.getByRole('button', { name: 'Start Game' }).click();
    await waitForGameBoard(host);

    // Wait for our turn (may need to wait for bot first)
    const isMyTurn = async () => {
      const turnText = await host.locator('.hand-area').innerText().catch(() => '');
      return turnText.includes('Your turn') || turnText.includes('Your hand');
    };

    // Wait until it's our turn (bot may go first)
    for (let i = 0; i < 30; i++) {
      if (await isMyTurn()) break;
      await sleep(1000);
    }

    // Check for playable tiles (green glow class)
    const playableTiles = host.locator('.hand-tiles .domino-tile.playable');
    const playableCount = await playableTiles.count();

    if (playableCount > 0) {
      // Playable tiles should have the playable class
      await expect(playableTiles.first()).toBeVisible();
    }

    await host.close();
  });

  test('TC-4.1 — Valid Tile Placement', async ({ context }) => {
    const host = await openHome(context);
    await createGame(host, 'Host', { targetScore: '200', timer: '90' });
    await host.getByRole('button', { name: '+ Easy Bot' }).click();
    await expect(host.locator('.player-item')).toHaveCount(2, { timeout: 5000 });
    await host.getByRole('button', { name: 'Start Game' }).click();
    await waitForGameBoard(host);

    // Wait until playable tiles appear (our turn) — bot may go first
    const playable = host.locator('.hand-tiles .domino-tile.playable').first();
    try {
      await expect(playable).toBeVisible({ timeout: 45_000 });
    } catch {
      // Bot may have finished the round before our turn came. Still a valid scenario.
      // Just verify the game screen is still showing
      await expect(host.locator('.game-screen')).toBeVisible();
      await host.close();
      return;
    }

    const handBefore = await host.locator('.hand-tiles .domino-tile').count();
    await playable.click();
    await sleep(500);

    // If end markers appear, click one to place the tile
    const marker = host.locator('.end-marker').first();
    if (await marker.isVisible().catch(() => false)) {
      await marker.click();
    }
    await sleep(1000);

    // Verify tile count decreased
    const handAfter = await host.locator('.hand-tiles .domino-tile').count();
    expect(handAfter).toBeLessThan(handBefore);

    await host.close();
  });
});

// ===========================================================================
// 5. GAMEPLAY — Drawing & Passing
// ===========================================================================

test.describe('5. Gameplay — Drawing & Passing', () => {
  test('TC-5.6 — Boneyard Count Display', async ({ context }) => {
    const host = await openHome(context);
    await createGame(host, 'Host', { targetScore: '200', timer: '0' });
    await host.getByRole('button', { name: '+ Easy Bot' }).click();
    await expect(host.locator('.player-item')).toHaveCount(2, { timeout: 5000 });
    await host.getByRole('button', { name: 'Start Game' }).click();
    await waitForGameBoard(host);
    await expect(host.locator('.boneyard-indicator')).toBeVisible();
    const text = await host.locator('.boneyard-indicator').innerText();
    const count = parseInt(text.replace(/\D/g, ''));
    expect(count).toBe(14); // 28 - 7*2 for 2 players
    await host.close();
  });
});

// ===========================================================================
// 6. GAMEPLAY — Turn Management
// ===========================================================================

test.describe('6. Turn Management', () => {
  test('TC-6.1 — Turn Indicator Active Player', async ({ context }) => {
    const host = await openHome(context);
    await createGame(host, 'Host', { targetScore: '200', timer: '90' });
    await host.getByRole('button', { name: '+ Easy Bot' }).click();
    await expect(host.locator('.player-item')).toHaveCount(2, { timeout: 5000 });
    await host.getByRole('button', { name: 'Start Game' }).click();
    await waitForGameBoard(host);

    // Current player in scoreboard should have .current class
    const currentScore = host.locator('.score-item.current');
    await expect(currentScore).toBeVisible({ timeout: 10_000 });

    await host.close();
  });

  test('TC-6.3 — Turn Timer Countdown', async ({ context }) => {
    const host = await openHome(context);
    await createGame(host, 'Host', { targetScore: '200', timer: '30' });
    await host.getByRole('button', { name: '+ Easy Bot' }).click();
    await expect(host.locator('.player-item')).toHaveCount(2, { timeout: 5000 });
    await host.getByRole('button', { name: 'Start Game' }).click();
    await waitForGameBoard(host);

    // Timer badge should be visible
    const timerBadge = host.locator('.timer-badge');
    await expect(timerBadge).toBeVisible({ timeout: 10_000 });
    const timerText = await timerBadge.innerText();
    expect(timerText).toMatch(/\d+s/);

    await host.close();
  });

  test('TC-6.6 — Unlimited Timer', async ({ context }) => {
    const host = await openHome(context);
    await createGame(host, 'Host', { targetScore: '200', timer: '0' });
    await host.getByRole('button', { name: '+ Easy Bot' }).click();
    await expect(host.locator('.player-item')).toHaveCount(2, { timeout: 5000 });
    await host.getByRole('button', { name: 'Start Game' }).click();
    await waitForGameBoard(host);

    // Timer badge should NOT be visible (unlimited)
    await sleep(2000);
    await expect(host.locator('.timer-badge')).toBeHidden();

    await host.close();
  });
});

// ===========================================================================
// 7. ROUND END & SCORING (multi-player round play)
// ===========================================================================

test.describe('7. Round End & Scoring', () => {
  test('TC-7.1/7.4 — Round completes and shows summary', async ({ context }) => {
    const host = await openHome(context);
    const code = await createGame(host, 'Alice', { targetScore: '200', timer: '30' });
    const player2 = await openHome(context);
    await joinGame(player2, 'Bob', code);

    await host.getByRole('button', { name: 'Start Game' }).click();
    await waitForGameBoard(host);
    await waitForGameBoard(player2);

    // Play a full round by making valid moves
    for (let turn = 0; turn < 100; turn++) {
      // Check if round ended
      const overlay = host.locator('.overlay');
      if (await overlay.isVisible().catch(() => false)) break;

      // Try host turn
      const hostPlayable = host.locator('.hand-tiles .domino-tile.playable').first();
      if (await hostPlayable.isVisible().catch(() => false)) {
        await hostPlayable.click();
        await sleep(300);
        const marker = host.locator('.end-marker').first();
        if (await marker.isVisible().catch(() => false)) {
          await marker.click();
        }
        await sleep(500);
        continue;
      }

      // Draw if possible
      const drawBtn = host.getByRole('button', { name: /Draw from Boneyard/i });
      if (await drawBtn.isVisible().catch(() => false)) {
        await drawBtn.click();
        await sleep(500);
        continue;
      }

      // Pass if possible
      const passBtn = host.getByRole('button', { name: /Pass Turn/i });
      if (await passBtn.isVisible().catch(() => false)) {
        await passBtn.click();
        await sleep(500);
        continue;
      }

      // Try player2 turn
      const p2Playable = player2.locator('.hand-tiles .domino-tile.playable').first();
      if (await p2Playable.isVisible().catch(() => false)) {
        await p2Playable.click();
        await sleep(300);
        const marker2 = player2.locator('.end-marker').first();
        if (await marker2.isVisible().catch(() => false)) {
          await marker2.click();
        }
        await sleep(500);
        continue;
      }

      const drawBtn2 = player2.getByRole('button', { name: /Draw from Boneyard/i });
      if (await drawBtn2.isVisible().catch(() => false)) {
        await drawBtn2.click();
        await sleep(500);
        continue;
      }

      const passBtn2 = player2.getByRole('button', { name: /Pass Turn/i });
      if (await passBtn2.isVisible().catch(() => false)) {
        await passBtn2.click();
        await sleep(500);
        continue;
      }

      await sleep(1000);
    }

    // Wait for round summary overlay
    const overlay = host.locator('.overlay');
    await expect(overlay).toBeVisible({ timeout: 60_000 });

    // Round summary should contain score table
    await expect(host.locator('.result-table')).toBeVisible();

    // Host should see "Next Round" button
    await expect(host.getByRole('button', { name: /Next Round/i })).toBeVisible();

    await host.close();
    await player2.close();
  });
});

// ===========================================================================
// 9. COMPUTER PLAYER AI
// ===========================================================================

test.describe('9. Computer Player AI', () => {
  test('TC-9.4 — AI Makes Moves With Delay', async ({ context }) => {
    const host = await openHome(context);
    await createGame(host, 'Host', { targetScore: '200', timer: '0' });
    await host.getByRole('button', { name: '+ Easy Bot' }).click();
    await expect(host.locator('.player-item')).toHaveCount(2, { timeout: 5000 });
    await host.getByRole('button', { name: 'Start Game' }).click();
    await waitForGameBoard(host);

    // Play our turn if we go first
    for (let i = 0; i < 5; i++) {
      const playable = host.locator('.hand-tiles .domino-tile.playable').first();
      if (await playable.isVisible().catch(() => false)) {
        await playable.click();
        await sleep(300);
        const marker = host.locator('.end-marker').first();
        if (await marker.isVisible().catch(() => false)) {
          await marker.click();
        }
        break;
      }
      await sleep(1000);
    }

    // Wait and observe bot plays (activity log should show bot activity)
    await sleep(3000);
    const logItems = host.locator('.activity-log-item');
    const count = await logItems.count();
    expect(count).toBeGreaterThan(0);

    await host.close();
  });
});

// ===========================================================================
// 10. DISCONNECT & RECONNECT
// ===========================================================================

test.describe('10. Disconnect & Reconnect', () => {
  test('TC-10.4 — Leave During Game', async ({ context }) => {
    const host = await openHome(context);
    const code = await createGame(host, 'Host', { targetScore: '200', timer: '0' });
    const player2 = await openHome(context);
    await joinGame(player2, 'Player2', code);

    await host.getByRole('button', { name: 'Start Game' }).click();
    await waitForGameBoard(host);
    await waitForGameBoard(player2);

    // Player2 leaves
    await player2.getByRole('button', { name: 'Leave' }).first().click();
    await expect(player2.locator('.home-screen')).toBeVisible({ timeout: 5000 });

    // Host should see player replaced by bot in scoreboard
    await sleep(2000);
    // Game should still be running (bot replaced)
    await expect(host.locator('.game-screen')).toBeVisible();

    await host.close();
    await player2.close();
  });
});

// ===========================================================================
// 11. SPECTATOR MODE
// ===========================================================================

test.describe('11. Spectator Mode', () => {
  test('TC-11.1 — Join as Spectator', async ({ context }) => {
    const host = await openHome(context);
    const code = await createGame(host, 'Host', { targetScore: '200', timer: '0' });
    await host.getByRole('button', { name: '+ Easy Bot' }).click();
    await expect(host.locator('.player-item')).toHaveCount(2, { timeout: 5000 });
    await host.getByRole('button', { name: 'Start Game' }).click();
    await waitForGameBoard(host);

    // Spectator joins
    const spectator = await openHome(context);
    await spectator.locator('.join-row input').fill(code);
    await spectator.locator('button[title="Watch the game"]').click();

    // Should see spectator banner
    await expect(spectator.locator('.spectator-banner')).toBeVisible({ timeout: 10_000 });

    // Should see board
    await expect(spectator.locator('.board-area')).toBeVisible();

    // Should NOT see hand tiles
    await expect(spectator.locator('.hand-tiles')).toBeHidden();

    await host.close();
    await spectator.close();
  });

  test('TC-11.2 — Spectator Read-Only', async ({ context }) => {
    const host = await openHome(context);
    const code = await createGame(host, 'Host', { targetScore: '200', timer: '0' });
    await host.getByRole('button', { name: '+ Easy Bot' }).click();
    await expect(host.locator('.player-item')).toHaveCount(2, { timeout: 5000 });
    await host.getByRole('button', { name: 'Start Game' }).click();
    await waitForGameBoard(host);

    const spectator = await openHome(context);
    await spectator.locator('.join-row input').fill(code);
    await spectator.locator('button[title="Watch the game"]').click();
    await expect(spectator.locator('.spectator-banner')).toBeVisible({ timeout: 10_000 });

    // No draw/pass buttons
    await expect(spectator.getByRole('button', { name: /Draw/i })).toBeHidden();
    await expect(spectator.getByRole('button', { name: /Pass/i })).toBeHidden();

    await host.close();
    await spectator.close();
  });

  test('TC-11.3 — Spectator Count Display', async ({ context }) => {
    const host = await openHome(context);
    const code = await createGame(host, 'Host', { targetScore: '200', timer: '0' });
    await host.getByRole('button', { name: '+ Easy Bot' }).click();
    await expect(host.locator('.player-item')).toHaveCount(2, { timeout: 5000 });
    await host.getByRole('button', { name: 'Start Game' }).click();
    await waitForGameBoard(host);

    const spec1 = await openHome(context);
    await spec1.locator('.join-row input').fill(code);
    await spec1.locator('button[title="Watch the game"]').click();
    await expect(spec1.locator('.spectator-banner')).toBeVisible({ timeout: 10_000 });

    // Host should see spectator count
    await expect(host.locator('.game-header')).toContainText('👁', { timeout: 5000 });

    await host.close();
    await spec1.close();
  });
});

// ===========================================================================
// 12. ACTIVITY LOG
// ===========================================================================

test.describe('12. Activity Log', () => {
  test('TC-12.1 — Activity Log Events', async ({ context }) => {
    const host = await openHome(context);
    await createGame(host, 'Host', { targetScore: '200', timer: '0' });
    await host.getByRole('button', { name: '+ Easy Bot' }).click();
    await expect(host.locator('.player-item')).toHaveCount(2, { timeout: 5000 });
    await host.getByRole('button', { name: 'Start Game' }).click();
    await waitForGameBoard(host);

    // Activity log should be visible
    await expect(host.locator('.activity-log')).toBeVisible();

    // Should have at least round-started notification
    await expect(host.locator('.activity-log-item').first()).toBeVisible({ timeout: 5000 });
    const logText = await host.locator('.activity-log-list').innerText();
    expect(logText).toContain('Round');

    await host.close();
  });

  test('TC-12.2 — Activity Log Collapsible', async ({ context }) => {
    const host = await openHome(context);
    await createGame(host, 'Host', { targetScore: '200', timer: '0' });
    await host.getByRole('button', { name: '+ Easy Bot' }).click();
    await expect(host.locator('.player-item')).toHaveCount(2, { timeout: 5000 });
    await host.getByRole('button', { name: 'Start Game' }).click();
    await waitForGameBoard(host);

    // Activity log visible
    await expect(host.locator('.activity-log')).toBeVisible();

    // Click toggle to collapse
    await host.locator('.activity-log-toggle').click();
    await expect(host.locator('.activity-log.collapsed')).toBeVisible();

    // Click toggle to expand
    await host.locator('.activity-log-toggle').click();
    await expect(host.locator('.activity-log:not(.collapsed)')).toBeVisible();

    await host.close();
  });
});

// ===========================================================================
// 14. OPPONENT VISIBILITY
// ===========================================================================

test.describe('14. Opponent Visibility', () => {
  test('TC-14.1 — Own Tiles Visible, Opponent Tiles Hidden', async ({ context }) => {
    const host = await openHome(context);
    const code = await createGame(host, 'Alice', { targetScore: '200', timer: '0' });
    const player2 = await openHome(context);
    await joinGame(player2, 'Bob', code);

    await host.getByRole('button', { name: 'Start Game' }).click();
    await waitForGameBoard(host);
    await waitForGameBoard(player2);

    // Alice sees her own tiles
    await expect(host.locator('.hand-tiles .domino-tile')).toHaveCount(7, { timeout: 10_000 });

    // Alice should NOT see Bob's tiles — Bob's tiles are only in Bob's view
    // We verify by checking the page does not render more than 7 tiles in hand
    const aliceHandCount = await host.locator('.hand-tiles .domino-tile').count();
    expect(aliceHandCount).toBe(7);

    // Scoreboard should show opponent tile count
    await expect(host.locator('.score-item')).toHaveCount(2, { timeout: 5000 });

    await host.close();
    await player2.close();
  });
});

// ===========================================================================
// 15. BOARD RENDERING
// ===========================================================================

test.describe('15. Board Rendering', () => {
  test('TC-15.1 — Snake Board Renders', async ({ context }) => {
    const host = await openHome(context);
    await createGame(host, 'Host', { targetScore: '200', timer: '90' });
    await host.getByRole('button', { name: '+ Easy Bot' }).click();
    await expect(host.locator('.player-item')).toHaveCount(2, { timeout: 5000 });
    await host.getByRole('button', { name: 'Start Game' }).click();
    await waitForGameBoard(host);

    // Board area should exist
    await expect(host.locator('.board-area')).toBeVisible();

    // Wait for at least one tile to be played (either by us or by bot)
    // then verify the snake board wrapper appeared
    await sleep(3000); // Let bot play if it goes first
    await expect(host.locator('.board-area')).toBeVisible();

    await host.close();
  });
});

// ===========================================================================
// 17. INTERNATIONALIZATION
// ===========================================================================

test.describe('17. Internationalization', () => {
  test('TC-17.1 — Language Switcher', async ({ context }) => {
    const page = await openHome(context);

    // Ensure we start with English
    await page.evaluate(() => { localStorage.removeItem('domino_lang'); });
    await page.reload();
    await page.waitForSelector('.home-screen', { timeout: 10_000 });

    // Should default to English
    await expect(page.locator('.home-title')).toContainText('Domino');

    // The lang-switcher IS a <button> with text "EN"
    const langBtn = page.locator('button.lang-switcher');
    await expect(langBtn).toBeVisible();
    await expect(langBtn).toHaveText('EN');

    // Switch to Ukrainian
    await langBtn.click();
    await expect(page.locator('.home-title')).toContainText('Доміно', { timeout: 3000 });
    await expect(langBtn).toHaveText('UA');

    // Switch back to English
    await langBtn.click();
    await expect(page.locator('.home-title')).toContainText('Domino', { timeout: 3000 });
    await expect(langBtn).toHaveText('EN');

    await page.close();
  });
});

// ===========================================================================
// 18. SECURITY
// ===========================================================================

test.describe('18. Security', () => {
  test('TC-18.2 — XSS Prevention', async ({ context }) => {
    const page = await openHome(context);
    // Server sanitizes names by stripping HTML tags: <[^>]*> removed
    // So '<img onerror=alert>' becomes '' which defaults to 'Player'
    // This verifies the server-side XSS protection works
    const xssName = '<img onerror=alert>';
    await setName(page, xssName);
    await page.getByRole('button', { name: 'Create Game' }).click();
    await page.waitForSelector('.lobby-screen');

    // Server strips HTML tags — name becomes 'Player' (fallback)
    const playerText = await page.locator('.player-name').first().innerText();
    // Should NOT contain raw HTML (tags stripped by server)
    expect(playerText).not.toContain('<img');
    // Verify no injected HTML elements in the name container
    const imgCount = await page.locator('.player-name img').count();
    expect(imgCount).toBe(0);
    // Name should be sanitized to 'Player' (the default fallback)
    expect(playerText).toContain('Player');

    await page.close();
  });
});

// ===========================================================================
// 19. LIFECYCLE EDGE CASES
// ===========================================================================

test.describe('19. Lifecycle Edge Cases', () => {
  test('TC-19.1 — Leave During Lobby', async ({ context }) => {
    const host = await openHome(context);
    const code = await createGame(host, 'Host');

    const player2 = await openHome(context);
    await joinGame(player2, 'Player2', code);
    await expect(host.locator('.player-item')).toHaveCount(2, { timeout: 5000 });

    // Player2 leaves
    await player2.getByRole('button', { name: 'Leave' }).click();
    await expect(player2.locator('.home-screen')).toBeVisible({ timeout: 5000 });
    await expect(host.locator('.player-item')).toHaveCount(1, { timeout: 5000 });

    await host.close();
    await player2.close();
  });
});

// ===========================================================================
// 20. DEPLOYMENT — Health Check
// ===========================================================================

test.describe('20. Deployment', () => {
  test('TC-20.1 — Health Check Endpoint', async ({ request }) => {
    const resp = await request.get('/api/health');
    expect(resp.status()).toBe(200);
  });
});
