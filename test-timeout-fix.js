// Test: verify that when a player's turn timer expires, the game auto-plays for them
const { io } = require('socket.io-client');

const URL = 'http://localhost:3001';
let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; console.log(`  ✅ ${msg}`); }
  else { failed++; console.error(`  ❌ FAIL: ${msg}`); }
}

function connect() {
  return io(URL, { transports: ['websocket'], forceNew: true });
}

function trackState(socket) {
  const h = { state: null, notifications: [] };
  socket.on('game:state', (s) => { h.state = s; });
  socket.on('game:notification', (n) => { h.notifications.push(n); });
  return h;
}

function emit(socket, event, data) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout on ${event}`)), 5000);
    if (data !== undefined) {
      socket.emit(event, data, (res) => { clearTimeout(timer); resolve(res); });
    } else {
      socket.emit(event, (res) => { clearTimeout(timer); resolve(res); });
    }
  });
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitUntil(fn, timeout = 15000, interval = 200) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (fn()) return true;
    await sleep(interval);
  }
  return false;
}

async function runTest() {
  console.log('\n=== Turn Timer Auto-Play Test ===\n');

  // Create a 2-player game with a very short timer (we use 5s for testing)
  // But the server minimum is likely configurable. Let's use the game settings.
  const p1 = connect();
  const h1 = trackState(p1);
  await new Promise(r => p1.on('connect', r));

  const p2 = connect();
  const h2 = trackState(p2);
  await new Promise(r => p2.on('connect', r));

  // Create game with short timer for fast test
  const createRes = await emit(p1, 'game:create', {
    playerName: 'Alice',
    settings: { targetScore: 200, maxPlayers: 2, turnTimeSeconds: 5 }
  });
  assert(createRes.success, 'Game created');
  const joinCode = createRes.joinCode;
  const p1Id = createRes.playerId;

  const joinRes = await emit(p2, 'game:join', { joinCode, playerName: 'Bob' });
  assert(joinRes.success, 'Bob joined');
  const p2Id = joinRes.playerId;

  // Start the game
  const startRes = await emit(p1, 'game:start');
  assert(startRes.success, 'Game started');

  await waitUntil(() => h1.state?.phase === 'playing');
  assert(h1.state.phase === 'playing', 'Phase: playing');

  // Determine current player
  const currentId = h1.state.players[h1.state.currentPlayerIndex]?.id;
  console.log(`  Current turn: ${currentId === p1Id ? 'Alice' : 'Bob'}`);

  // The player whose turn it is will NOT make any move.
  // Wait for the timer to expire (30s) + a few seconds buffer.
  console.log('  Waiting for 5s timer to expire...');
  
  const initialTurnPlayer = h1.state.currentPlayerIndex;
  const initialBoardLen = h1.state.board.length;
  
  // Log timer ticks
  p1.on('game:turnTimer', (s) => { process.stdout.write(`  [timer: ${s}s] `); });
  
  // Wait up to 15 seconds for the turn to change (timer = 5s)
  const turnChanged = await waitUntil(() => {
    if (!h1.state || h1.state.phase !== 'playing') return true; // round ended
    // Turn changed if index moved or board has more tiles
    return h1.state.currentPlayerIndex !== initialTurnPlayer || h1.state.board.length > initialBoardLen;
  }, 15000, 500);

  assert(turnChanged, 'Turn changed after timer expired (not stuck)');

  // Check that a timeout notification was sent
  const timeoutNotif = h1.notifications.find(n => n.message?.includes('timed out'));
  assert(!!timeoutNotif, 'Timeout notification received');

  // Check that either a tile was placed or a tile was drawn (auto-play happened)
  const afterTimeoutNotifs = h1.notifications.filter(n => 
    n.type === 'tile-placed' || n.type === 'tile-drawn' || n.type === 'turn-passed'
  );
  assert(afterTimeoutNotifs.length > 0, `Auto-action taken: ${afterTimeoutNotifs.map(n=>n.type).join(', ')}`);

  // Verify the game didn't get stuck — phase should still be playing or round ended
  assert(
    h1.state.phase === 'playing' || h1.state.phase === 'round-summary' || h1.state.phase === 'game-over',
    `Game continued (phase: ${h1.state.phase})`
  );

  // Cleanup
  p1.emit('game:leave');
  p2.emit('game:leave');
  await sleep(500);
  p1.disconnect();
  p2.disconnect();

  console.log(`\n${'='.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`${'='.repeat(40)}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTest().catch(err => {
  console.error('Test crashed:', err);
  process.exit(1);
});
