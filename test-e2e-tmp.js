// End-to-end test: simulates two human players + bot playing a full game
const { io } = require('socket.io-client');

const URL = 'http://localhost:3001';
let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; console.log(`  ??? ${msg}`); }
  else { failed++; console.error(`  ??? FAIL: ${msg}`); }
}

function connect() {
  return io(URL, { transports: ['websocket'], forceNew: true });
}

function trackState(socket) {
  const h = { state: null, roundResult: null, gameResult: null, notifications: [] };
  socket.on('game:state', (s) => { h.state = s; });
  socket.on('game:spectatorState', (s) => { h.state = s; });
  socket.on('game:roundResult', (r) => { h.roundResult = r; });
  socket.on('game:gameResult', (r) => { h.gameResult = r; });
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

async function waitUntil(fn, timeout = 10000, interval = 200) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (fn()) return true;
    await sleep(interval);
  }
  return false;
}

async function runTests() {
  console.log('\n=== Domino Game E2E Test ===\n');

  // --- TEST 1: Create game ---
  console.log('Test 1: Create a game');
  const p1 = connect();
  const h1 = trackState(p1);
  await new Promise(r => p1.on('connect', r));
  assert(p1.connected, 'Player 1 connected');

  const createRes = await emit(p1, 'game:create', {
    playerName: 'Alice',
    settings: { targetScore: 50, maxPlayers: 4, turnTimeSeconds: 30 }
  });
  assert(createRes.success, 'Game created');
  assert(createRes.joinCode && createRes.joinCode.length === 6, `Join code: ${createRes.joinCode}`);
  const joinCode = createRes.joinCode;
  const p1Id = createRes.playerId;
  const gameId = createRes.gameId;

  await waitUntil(() => h1.state !== null);
  assert(h1.state.phase === 'lobby', 'Phase: lobby');
  assert(h1.state.players.length === 1, '1 player in lobby');
  assert(h1.state.players[0].isHost, 'Alice is host');

  // --- TEST 2: Join ---
  console.log('\nTest 2: Bob joins');
  const p2 = connect();
  const h2 = trackState(p2);
  await new Promise(r => p2.on('connect', r));
  const joinRes = await emit(p2, 'game:join', { joinCode, playerName: 'Bob' });
  assert(joinRes.success, 'Bob joined');
  const p2Id = joinRes.playerId;

  await waitUntil(() => h2.state && h2.state.players.length === 2);
  assert(h2.state.players.length === 2, '2 players in lobby');

  // --- TEST 3: Add bot ---
  console.log('\nTest 3: Add bot');
  const addRes = await emit(p1, 'game:addComputer', { difficulty: 'medium' });
  assert(addRes.success, 'Bot added');
  await waitUntil(() => h1.state.players.length === 3);
  assert(h1.state.players.some(p => p.isComputer), 'Bot is present');

  // --- TEST 4: Auth checks ---
  console.log('\nTest 4: Non-host cannot start');
  const badStart = await emit(p2, 'game:start');
  assert(!badStart.success, 'Rejected: non-host start');

  // --- TEST 5: Start game ---
  console.log('\nTest 5: Start game');
  const startRes = await emit(p1, 'game:start');
  assert(startRes.success, 'Game started');
  await waitUntil(() => h1.state.phase === 'playing');
  assert(h1.state.phase === 'playing', 'Phase: playing');
  assert(h1.state.hand.length > 0, `Alice: ${h1.state.hand.length} tiles`);
  assert(h1.state.roundNumber === 1, 'Round 1');
  await waitUntil(() => h2.state.phase === 'playing');
  assert(h2.state.hand.length > 0, `Bob: ${h2.state.hand.length} tiles`);

  // --- TEST 6: Spectator ---
  console.log('\nTest 6: Spectator');
  const spec = connect();
  const hs = trackState(spec);
  await new Promise(r => spec.on('connect', r));
  const specRes = await emit(spec, 'game:spectate', { joinCode });
  assert(specRes.success, 'Spectator joined');
  await waitUntil(() => hs.state !== null);
  assert(hs.state.phase === 'playing', 'Spectator sees playing');

  // --- TEST 7: Play a full round ---
  console.log('\nTest 7: Play round 1');
  let moveCount = 0;

  while (moveCount < 200) {
    moveCount++;
    await sleep(150);

    if (h1.state.phase !== 'playing') {
      break;
    }

    const cur = h1.state.players[h1.state.currentPlayerIndex]?.id;

    if (cur === p1Id) {
      const s = h1.state;
      if (s.validMoves.length > 0) {
        const m = s.validMoves[0];
        const r = await emit(p1, 'game:placeTile', { tileId: m.tileId, end: m.end });
      } else if (s.boneyardCount > 0) {
        await emit(p1, 'game:draw');
      } else {
        await emit(p1, 'game:pass');
      }
    } else if (cur === p2Id) {
      const s = h2.state;
      if (s.validMoves.length > 0) {
        const m = s.validMoves[0];
        const r = await emit(p2, 'game:placeTile', { tileId: m.tileId, end: m.end });
      } else if (s.boneyardCount > 0) {
        await emit(p2, 'game:draw');
      } else {
        await emit(p2, 'game:pass');
      }
    }
    // else: bot turn ??? just wait
  }

  await waitUntil(() => h1.roundResult !== null, 10000);
  const rr = h1.roundResult;
  assert(rr !== null, 'Round result received');
  if (rr) {
    assert(rr.playerResults.length === 3, '3 players in round result');
    console.log(`    Winner: ${rr.winnerName || 'draw'} (+${rr.pointsScored} pts)`);
    for (const r of rr.playerResults) {
      console.log(`      ${r.playerName}: ${r.remainingTiles.length} tiles, ${r.pipCount} pips, score ${r.totalScore}`);
    }
  }

  assert(
    h1.state.phase === 'round-summary' || h1.state.phase === 'game-over',
    `Phase: ${h1.state.phase}`
  );

  // --- TEST 8: Next round ---
  console.log('\nTest 8: Next round');
  if (h1.state.phase === 'round-summary') {
    h1.roundResult = null;
    p1.emit('game:nextRound');
    await waitUntil(() => h1.state.phase === 'playing', 5000);
    assert(h1.state.phase === 'playing', 'Round 2 started');
    assert(h1.state.roundNumber === 2, `Round ${h1.state.roundNumber}`);
    assert(h1.state.hand.length > 0, `Alice: ${h1.state.hand.length} tiles in R2`);
  } else {
    console.log('    Game over ??? skipping');
  }

  // --- TEST 9: Reconnection ---
  console.log('\nTest 9: Reconnection');
  p2.disconnect();
  await sleep(1000);

  const p2r = connect();
  const h2r = trackState(p2r);
  await new Promise(r => p2r.on('connect', r));
  const recon = await emit(p2r, 'game:reconnect', { gameId, playerId: p2Id });
  assert(recon.success, 'Bob reconnected');
  await waitUntil(() => h2r.state !== null, 3000);
  assert(h2r.state !== null, 'Bob got state after reconnect');

  // --- TEST 10: Leave mid-game ---
  console.log('\nTest 10: Bob leaves');
  p2r.emit('game:leave');
  await sleep(1000);
  const bob = h1.state.players.find(p => p.name.includes('Bob'));
  assert(bob?.isComputer, 'Bob replaced by computer');

  // --- TEST 11: Activity log ---
  console.log('\nTest 11: Notifications');
  assert(h1.notifications.length > 0, `${h1.notifications.length} notifications`);
  const types = [...new Set(h1.notifications.map(n => n.type))];
  console.log(`    Types: ${types.join(', ')}`);
  assert(types.includes('tile-placed'), 'Has tile-placed');
  assert(types.includes('round-ended'), 'Has round-ended');

  // --- Cleanup ---
  console.log('\nCleanup');
  p1.emit('game:leave');
  spec.disconnect();
  await sleep(300);
  p1.disconnect();
  p2r.disconnect();

  console.log(`\n${'='.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`${'='.repeat(40)}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test crashed:', err);
  process.exit(1);
});

