# Domino Multiplayer Game — QA Test Cases

> **Purpose**: Manual QA test cases to verify application functionality against requirements.
> **Legend**: Priority — **P0** Critical | **P1** High | **P2** Medium | **P3** Low

---

## 1. Home Screen

### TC-1.1 — Display Elements (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open the application URL in a browser | Home screen loads with "Create Game" button, "Join Game" input, player name input, and language switcher |
| 2 | Verify page title and branding | Page shows Domino game title/logo |

### TC-1.2 — Player Name Persistence (P2)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter a display name (e.g., "Alice") | Name appears in the input field |
| 2 | Refresh the page | Name is preserved from localStorage |
| 3 | Change the name to "Bob" and refresh | "Bob" now appears; previous name overwritten |

### TC-1.3 — Create Game Requires Name (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Clear the player name field | Name field is empty |
| 2 | Click "Create Game" | Error is shown; game is NOT created |
| 3 | Enter a valid name and click "Create Game" | Game is created; user enters lobby screen |

### TC-1.4 — Join Game Requires Name and Code (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Leave name empty, enter a join code, click "Join" | Error is shown |
| 2 | Enter a name, leave join code empty, click "Join" | Error is shown or join button is disabled |
| 3 | Enter a name and an invalid/non-existent code, click "Join" | Error message displayed (e.g., "Game not found") |
| 4 | Enter a name and a valid join code, click "Join" | User enters the game lobby |

### TC-1.5 — Spectate Game (P2)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter a valid join code and click "Spectate" | User enters spectator view; no player hand visible |
| 2 | Enter an invalid join code and click "Spectate" | Error message displayed |

### TC-1.6 — Game Settings on Create (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Create Game" and inspect settings | Options for target score (50/100/150/200), max players (2-6), and turn timer (Unlimited/30s/60s/90s) are visible |
| 2 | Set target score to 150, max players to 3, timer to 30s | Settings are accepted |
| 3 | Create the game | Lobby reflects the chosen settings |

---

## 2. Lobby Screen

### TC-2.1 — Lobby Display (P0)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create a game; observe lobby | Join code is displayed, player list shows host, game settings visible, "Start Game" button visible (host only) |
| 2 | Verify join code format | 6-character alphanumeric code (excludes I, O, 0, 1) |

### TC-2.2 — Copy Join Code (P2)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click the join code in the lobby | Code is copied to clipboard (toast or visual confirmation) |

### TC-2.3 — Join Code / Link Sharing (P1) [Req F-03]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Copy join code from host's lobby | Code is available |
| 2 | Open another browser/tab, enter the code and a name, click "Join" | Second player appears in the lobby player list |
| 3 | Verify host sees the new player | Host's lobby updates in real-time |

### TC-2.4 — Add Computer Player (P0) [Req F-05]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | As host, click "Add Computer" with Easy difficulty | An Easy bot appears in the player list with CPU indicator |
| 2 | Add Medium and Hard difficulty bots | Bots appear with respective difficulty labels |
| 3 | Verify total players do not exceed max players setting | "Add Computer" disabled when lobby is full |

### TC-2.5 — Remove Computer Player (P1) [Req F-06]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | As host, click remove/kick on a computer player in the lobby | Computer player is removed from the player list |
| 2 | Verify other players remain unaffected | Player list updates correctly |

### TC-2.6 — Kick Human Player (P1) [Req F-08]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Have a second human player join the lobby | Player appears in list |
| 2 | As host, click kick on the human player | Player is removed from lobby; kicked player sees home screen or error |
| 3 | Verify notification is displayed | "Player was removed" notification shown |

### TC-2.7 — Non-Host Cannot Manage Lobby (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Join a game as a non-host player | Lobby screen loads |
| 2 | Verify no "Add Computer", "Kick", or "Start Game" buttons are shown | Only host sees host-specific controls |

### TC-2.8 — Start Game Requires Minimum Players (P0) [Req F-07]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create a game with only the host (1 player) | "Start Game" button is disabled or shows message |
| 2 | Add 1 computer player (total: 2 players) | "Start Game" button becomes enabled |
| 3 | Click "Start Game" | Game transitions to playing phase |

### TC-2.9 — Player List Shows Correct Indicators (P2) [Req F-11]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create lobby with host + 1 human + 1 bot | Player list shows host badge, human/computer indicators |
| 2 | Verify names and roles are correct | Each entry shows accurate player info |

### TC-2.10 — Max Players Enforced (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create game with maxPlayers = 2 | Lobby allows max 2 players |
| 2 | Host + 1 player join; a third player tries to join | Third player receives "Game is full" error |

---

## 3. Gameplay — Tile Dealing & Round Start

### TC-3.1 — Tile Deal: 2-4 Players (P0) [Req: Deal rule]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start a game with 2 players | Each player receives 7 tiles; boneyard = 28 - 14 = 14 |
| 2 | Start a game with 3 players | Each player receives 7 tiles; boneyard = 28 - 21 = 7 |
| 3 | Start a game with 4 players | Each player receives 7 tiles; boneyard = 28 - 28 = 0 |

### TC-3.2 — Tile Deal: 5-6 Players (P0) [Req: Deal rule]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start a game with 5 players | Each receives 5 tiles; boneyard = 28 - 25 = 3 |
| 2 | Start a game with 6 players | Each receives 5 tiles; boneyard = 28 - 30 — **INVALID**: max tiles = 28, so verify 5 tiles not possible for 6 players or adjusted handling |

### TC-3.3 — First Move: Highest Double (P0) [Req: First move rule]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start round 1 with multiple players | The player holding the highest double (6-6 > 5-5 > … > 0-0) goes first |
| 2 | If no player has a double, verify behavior | Fallback logic: first player in order or re-deal |

### TC-3.4 — Subsequent Rounds: Winner Starts (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete round 1; note the winner | Winner identified |
| 2 | Start round 2 | The round 1 winner takes the first turn |

### TC-3.5 — Round Number Display (P2)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start a game and play through rounds | Round number increments and is visible on the game board |

---

## 4. Gameplay — Tile Placement

### TC-4.1 — Valid Tile Placement (P0) [Req G-04]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On your turn, select a tile that matches one open end of the board | Valid placement positions are highlighted (left/right markers) |
| 2 | Click on a highlighted end to place the tile | Tile is placed; board updates; turn advances |

### TC-4.2 — Playable Tiles Highlighted (P0) [Req G-03a]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On your turn, observe your hand | Playable tiles have a green border/glow |
| 2 | Non-playable tiles | Are dimmed/faded, clearly differentiated |

### TC-4.3 — Invalid Placement Rejected (P0) [Req NF-05]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Attempt to place a tile that doesn't match either open end (via direct API/socket if UI prevents it) | Server rejects the move; error returned |
| 2 | Attempt to play on someone else's turn | Server rejects; error returned |

### TC-4.4 — First Tile: Any Tile Valid (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On the very first move of a round (empty board), select any tile | All tiles in hand are highlighted as playable |
| 2 | Place the tile | Board shows the first tile; left and right ends are set |

### TC-4.5 — Tile Matches Both Ends (P2)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Board has same value on both ends (e.g., left=3, right=3) | Player can choose either end for a matching tile |
| 2 | Select a tile matching value 3 | Both left and right markers shown |
| 3 | Choose one end | Tile placed on chosen end |

### TC-4.6 — Last Tile Auto-Play (P1) [Req G-04]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Player has exactly 1 tile remaining and it is playable | Single click/tap plays the tile automatically (no end selection needed) |
| 2 | Round ends immediately after placement | Round summary shown |

### TC-4.7 — Double Tile Placement (P2)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Place a double tile (e.g., [3|3]) | Tile renders correctly (potentially vertical orientation on board) |
| 2 | Board ends update correctly | Both ends remain consistent with game logic |

---

## 5. Gameplay — Drawing & Passing

### TC-5.1 — Draw from Boneyard (P0) [Req G-05]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On your turn with no valid moves and boneyard > 0 | Draw button is available |
| 2 | Click "Draw" | A tile is added to your hand; boneyard count decreases by 1 |
| 3 | If drawn tile is playable | It can be played immediately |
| 4 | If drawn tile is not playable | Turn passes to next player |

### TC-5.2 — Cannot Draw from Empty Boneyard (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Boneyard is empty (0 tiles) | Draw button is not available or disabled |
| 2 | Player has no valid moves | "Pass Turn" button is shown instead |

### TC-5.3 — Pass Turn (P0) [Req G-05a]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | No valid moves AND boneyard is empty | "Pass Turn" button appears |
| 2 | Click "Pass Turn" | Turn passes to next player; activity log shows pass |

### TC-5.4 — Cannot Pass with Valid Moves (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Player has valid moves available | No "Pass" button visible |
| 2 | Attempt to pass via direct socket event | Server rejects the action |

### TC-5.5 — Cannot Pass When Boneyard Has Tiles (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Player has no valid moves but boneyard > 0 | Must draw; "Pass" is not available |

### TC-5.6 — Boneyard Count Display (P1) [Req G-09]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | During game, observe boneyard count | Count is visible and shows remaining tiles |
| 2 | After a draw | Count decrements by 1 |

---

## 6. Gameplay — Turn Management

### TC-6.1 — Turn Indicator (P0) [Req G-08]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | During gameplay, check the scoreboard/player list | Current player's turn is visually highlighted |
| 2 | After a move, turn advances | Next player is highlighted |

### TC-6.2 — Clockwise Turn Order (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start a 4-player game; note player order | Turns proceed clockwise through the player list |
| 2 | After player 4 plays | Turn wraps to player 1 |

### TC-6.3 — Turn Timer Countdown (P1) [Req G-07]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create game with 30s timer | Timer visible during each turn |
| 2 | Observe countdown | Timer decrements each second |
| 3 | Timer reaches < 10 seconds | Timer turns red / pulses for urgency |

### TC-6.4 — Turn Timer Expiry: Auto-Draw (P0) [Req G-07]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Player's turn; timer runs out; boneyard has tiles; player has no valid moves | Game auto-draws a tile for the player |
| 2 | If auto-drawn tile is playable | It may be auto-played or turn passes |

### TC-6.5 — Turn Timer Expiry: Auto-Pass (P0) [Req G-07]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Player's turn; timer runs out; boneyard is empty; no valid moves | Game auto-passes for the player |
| 2 | Notification shown | "{name}'s turn timed out" in activity log |

### TC-6.6 — Unlimited Timer (P2)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create game with "Unlimited" timer setting | No timer displayed during turns |
| 2 | Player can take as long as needed | No auto-action occurs |

### TC-6.7 — Only Current Player Can Act (P0)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | As a non-current player, try clicking tiles or draw button | Actions are disabled or rejected |

---

## 7. Round End & Scoring

### TC-7.1 — Round Won by Empty Hand (P0)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | A player places their last tile | Round ends immediately |
| 2 | Round summary displayed | Winner is the player who emptied hand; points = sum of all opponents' remaining pips |

### TC-7.2 — Blocked Game (P0) [Req: Blocked game rule]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | No player can move; boneyard is empty | Round ends automatically |
| 2 | Round summary displayed | Player with lowest remaining pip total wins |
| 3 | Winner scores sum of all opponents' remaining pips | Score calculated correctly |

### TC-7.3 — Blocked Game Tie (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Blocked game; multiple players tied for lowest pips | Round is a draw |
| 2 | Round summary shows "Draw" | No points awarded |

### TC-7.4 — Round Summary Display (P1) [Req G-11]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Round ends | Overlay shows: winner/draw, points scored, remaining tiles per player, pip counts, cumulative scores |
| 2 | Host sees "Next Round" button | Non-host does not see this button |

### TC-7.5 — Next Round Transition (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Host clicks "Next Round" on round summary | New round starts with fresh tile deal |
| 2 | Round number increments | Score carries over; hands are re-dealt |

### TC-7.6 — Scoring Accuracy (P0)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Round ends; manually count remaining pips for all opponents | Score matches sum of opponents' pips |
| 2 | Cumulative score in scoreboard updates correctly | Previous + new points = displayed total |

---

## 8. Game End

### TC-8.1 — Game Ends at Target Score (P0)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | A player reaches or exceeds the target score (e.g., 100 points) | Game ends after the round |
| 2 | Game over screen is displayed | Winner announced, final rankings/leaderboard shown |

### TC-8.2 — Game Over Display (P1) [Req G-11]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Game ends | Overlay shows: winner with trophy, final rankings with scores for all players |
| 2 | Options available | "Back to Home" or similar navigation |

### TC-8.3 — Different Target Scores (P2) [Req F-02]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create game with target score 50 | Game ends when a player reaches 50 points |
| 2 | Create game with target score 200 | Game ends when a player reaches 200 points |

---

## 9. Computer Player AI

### TC-9.1 — Easy AI: Random Play (P1) [Req A-01]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start game with Easy bot | Bot plays valid tiles (seemingly random) |
| 2 | Observe several turns | Bot does not always pick optimal tile; makes valid moves |

### TC-9.2 — Medium AI: Future Options (P2) [Req A-02]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start game with Medium bot | Bot plays valid tiles |
| 2 | Observe strategy over multiple rounds | Bot tends to keep diverse tiles, maintaining future options |

### TC-9.3 — Hard AI: Strategic Play (P2) [Req A-03]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start game with Hard bot | Bot plays valid tiles |
| 2 | Observe strategy | Bot prefers high-pip tiles, attempts blocking, plays strategically |

### TC-9.4 — AI Move Delay (P1) [Req G-12]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Observe computer player's turn | Bot waits 1-2 seconds before playing (natural feel) |
| 2 | Move is visible after the delay | Tile appears on board with brief pause |

### TC-9.5 — AI Immediate Pass When Blocked (P1) [Req G-13]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Bot has no valid moves AND boneyard is empty | Bot passes immediately (no artificial delay) |
| 2 | Activity log shows pass | "{BotName} passed" appears immediately |

### TC-9.6 — AI Draws When Blocked (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Bot has no valid moves; boneyard has tiles | Bot draws a tile |
| 2 | If drawn tile is playable | Bot plays it immediately (after delay) |

---

## 10. Player Disconnect & Reconnect

### TC-10.1 — Disconnect During Game (P0) [Req F-15]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | During a game, close a player's browser tab / disconnect network | Server detects disconnect |
| 2 | Other players see notification | "{name} disconnected" in activity log |
| 3 | Grace period (60s) starts | Disconnected player's turns are handled by a computer |

### TC-10.2 — Reconnect Within Grace Period (P0) [Req F-16]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Disconnect a player | Grace period starts |
| 2 | Reopen the game within 60 seconds (same browser with session data) | Player is reconnected automatically |
| 3 | Player resumes control | "{name} reconnected" notification; player can play their tiles |

### TC-10.3 — Grace Period Expires (P0) [Req F-17]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Disconnect a player; wait >60 seconds | Grace period expires |
| 2 | Player's seat is permanently replaced | Bot takes over (medium difficulty); name becomes "Bot (OriginalName)" |
| 3 | Notification shown | "{name} is now controlled by computer" |

### TC-10.4 — Leave During Game (P1) [Req F-09]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | During a game, click "Leave" | Player leaves the game |
| 2 | Seat is replaced by a computer player | Bot continues in their place |

### TC-10.5 — All Humans Leave (P1) [Req F-10]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | All human players leave or disconnect (grace expired) | Game is terminated and cleaned up |
| 2 | Spectators (if any) see game ended | No ghost games remain on server |

### TC-10.6 — Session Persistence for Reconnect (P2)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Join a game, note sessionStorage has gameId + playerId | Session data stored |
| 2 | Refresh the page | Automatic reconnect attempt using stored session |
| 3 | Successful reconnect | Player resumes without re-entering code |

---

## 11. Spectator Mode

### TC-11.1 — Join as Spectator (P1) [Req F-12]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter valid game code and click "Spectate" | Spectator view loads |
| 2 | Verify board is visible | Tile chain, scoreboard, turn indicator, boneyard count, opponent tile counts visible |
| 3 | Verify player hands are NOT visible | Spectator cannot see any player's tiles |

### TC-11.2 — Spectator Read-Only (P1) [Req F-13]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | As spectator, verify no action controls | No draw button, no pass button, no tile interaction |
| 2 | Spectator sees real-time updates | Board updates as players place tiles |

### TC-11.3 — Spectator Count Display (P1) [Req F-14]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | One spectator joins | Spectator count shows 1 |
| 2 | Second spectator joins | Count updates to 2 |
| 3 | A spectator leaves | Count decrements |

### TC-11.4 — Spectator Sees Activity Log (P2)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | As spectator, observe activity log | All game events visible (tile placements, draws, passes, etc.) |

### TC-11.5 — Spectator During Round Summary / Game Over (P2)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | As spectator when round ends | Round summary visible |
| 2 | When game ends | Game over / leaderboard visible |

---

## 12. Activity Log

### TC-12.1 — Activity Log Events (P1) [Req G-10]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Player places a tile | Log shows "{name} played [X|Y]" |
| 2 | Player draws a tile | Log shows "{name} drew a tile" |
| 3 | Player passes | Log shows "{name} passed" |
| 4 | Player joins/leaves | Log shows join/leave message |
| 5 | Round starts/ends | Log shows round events |
| 6 | Game ends | Log shows "{name} won the game!" |

### TC-12.2 — Activity Log Collapsible (P2) [Req G-10]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click collapse button on activity log | Log panel collapses |
| 2 | Click expand / reopen | Log panel expands with history intact |

### TC-12.3 — Activity Log Draggable (P3)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Drag the activity log header | Log panel moves to new position |

### TC-12.4 — Activity Log Auto-Scroll (P3)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Multiple events occur | Log auto-scrolls to show latest entry |

---

## 13. Notifications & Real-Time Updates

### TC-13.1 — Real-Time Board Updates (P0) [Req N-01]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Player A places a tile | Player B sees the tile appear on the board in real-time (<200ms on LAN) |
| 2 | Player draws | Other players see opponent tile count change |

### TC-13.2 — Turn Notification (P1) [Req N-02]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Turn advances to a player | "Your turn" visual notification appears |

### TC-13.3 — Player Join/Leave Notifications (P1) [Req N-02]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Player joins game | Notification: "{name} joined the game" |
| 2 | Player leaves / is kicked | Notification: "{name} left the game" / "{name} was removed" |

### TC-13.4 — Round/Game End Notifications (P1) [Req N-02]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Round ends | Notification: "{name} won the round (+X pts)" or "Round ended in a draw" |
| 2 | Game ends | Notification: "{name} won the game!" |

---

## 14. Opponent Visibility

### TC-14.1 — Own Tiles Visible Only (P0) [Req G-01]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | During gameplay, inspect your hand | Your tiles are face-up and visible |
| 2 | Inspect opponent areas | Only tile COUNT is shown; tiles are NOT visible |

### TC-14.2 — Opponent Tile Count (P1) [Req G-01]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Observe scoreboard during game | Each opponent shows their remaining tile count |
| 2 | After opponent draws | Their count increases by 1 |
| 3 | After opponent plays | Their count decreases by 1 |

---

## 15. Board Rendering & Interaction

### TC-15.1 — Snake Board Layout (P1) [Req G-02]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Place several tiles | Board renders as a horizontal snake, wrapping to new rows at screen edge |
| 2 | Board scrolls/pans when chain is long | User can navigate the full tile chain |

### TC-15.2 — Board Pannable and Zoomable (P2) [Req NF-13]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On desktop, scroll/drag to pan the board | Board viewport moves |
| 2 | On mobile, use pinch-to-zoom / touch gestures | Board zooms in/out smoothly |

### TC-15.3 — Left/Right Placement Markers (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select a playable tile in hand | Left and/or right placement markers appear on the board ends |
| 2 | Click a marker to place | Tile is placed on the chosen end |

---

## 16. Responsive Design & Mobile

### TC-16.1 — Desktop Layout (P1) [Req NF-10]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open app at ≥1024px width | Full desktop layout: board centered, hand at bottom, scoreboard visible |

### TC-16.2 — Tablet Layout (P2) [Req NF-10]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open app at 768-1023px width | Responsive layout adapts; all elements accessible |

### TC-16.3 — Mobile Layout (P1) [Req NF-10]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open app at <768px width | Mobile layout: hand in scrollable strip at bottom |
| 2 | All game actions are accessible | Tap to select tile, tap valid end to place |

### TC-16.4 — Touch Controls (P1) [Req NF-11]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On mobile, tap a tile in hand | Tile is selected (highlighted) |
| 2 | Tap a valid board end marker | Tile is placed correctly |
| 3 | Tap draw button | Draws a tile from boneyard |

### TC-16.5 — Mobile Hand Scrollable Strip (P2) [Req NF-12]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On mobile with 7 tiles, observe hand area | Tiles rendered in a horizontally scrollable strip at the bottom |
| 2 | Swipe left/right | Can scroll through all tiles |

### TC-16.6 — Cross-Browser Compatibility (P2) [Req NF-14]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open in Chrome (latest 2 versions) | All features work correctly |
| 2 | Open in Firefox (latest 2 versions) | All features work correctly |
| 3 | Open in Safari (latest 2 versions) | All features work correctly |
| 4 | Open in Edge (latest 2 versions) | All features work correctly |

---

## 17. Internationalization (i18n)

### TC-17.1 — Language Switcher (P2)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click language toggle (EN/UA) | UI text switches to the selected language |
| 2 | Switch to Ukrainian | All labels, buttons, and messages are in Ukrainian |
| 3 | Switch back to English | All labels, buttons, and messages are in English |

### TC-17.2 — Language Persistence (P3)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Switch language to Ukrainian | Language changes |
| 2 | Refresh the page | Ukrainian language persists (stored in localStorage) |

### TC-17.3 — Dynamic Messages Localized (P2)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | In Ukrainian mode, observe activity log | Notifications (tile placed, drew, passed) appear in Ukrainian |
| 2 | Round summary messages | Localized correctly |

---

## 18. Server Validation & Security

### TC-18.1 — Server Validates All Moves (P0) [Req NF-05]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send a `game:placeTile` event with a tile not in the player's hand | Server rejects with error |
| 2 | Send a `game:placeTile` event on wrong player's turn | Server rejects with error |
| 3 | Send `game:draw` when boneyard is empty | Server rejects with error |
| 4 | Send `game:pass` when valid moves exist | Server rejects with error |

### TC-18.2 — XSS Prevention (P0) [Req NF-20]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter a player name with HTML/JS: `<script>alert('xss')</script>` | Name is rendered as text, not executed |
| 2 | Enter special characters in name: `<b>Bold</b>` | Rendered as plain text, no HTML interpretation |

### TC-18.3 — Join Code Non-Guessable (P1) [Req NF-19]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create multiple games | Each has a unique 6-char alphanumeric join code |
| 2 | Codes do not follow predictable pattern | Random and non-sequential |

### TC-18.4 — Rate Limiting (P2) [Req NF-21]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send >60 HTTP requests within 1 minute | Rate limit kicks in; subsequent requests get 429 status |

### TC-18.5 — Host-Only Actions Enforced (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Non-host sends `game:start` socket event | Server rejects: "Only the host can start the game" |
| 2 | Non-host sends `game:addComputer` | Server rejects |
| 3 | Non-host sends `game:kickPlayer` | Server rejects |
| 4 | Non-host sends `game:nextRound` | Server rejects or ignores |

---

## 19. Game Lifecycle Edge Cases

### TC-19.1 — Leave During Lobby (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Join a game, then click "Leave" from the lobby | Player removed from lobby list; returns to home screen |
| 2 | Other players see updated list | Notification: "{name} left the game" |

### TC-19.2 — Host Leaves During Lobby (P2)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Host leaves the lobby | Observe behavior: either new host assigned or game terminated |

### TC-19.3 — Idle Game Auto-Termination (P2) [Req NF-17]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create a game and leave it idle (no activity) for 30+ minutes | Game is auto-terminated by server cleanup |

### TC-19.4 — Multiple Rounds Cumulative Scoring (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Play 3+ rounds | Scores accumulate correctly across rounds |
| 2 | Verify scoreboard after each round | Total = sum of all round scores |

### TC-19.5 — Game with All Computer Players (P2)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start a game, then all humans leave | Game is terminated (no human audience) |

---

## 20. Deployment & Infrastructure

### TC-20.1 — Health Check Endpoint (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send GET request to `/api/health` | Returns 200 OK response |

### TC-20.2 — Build and Start (P1) [Req NF-07]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Run `npm run build && npm start` | Application builds and starts without errors |
| 2 | Open browser to configured port (default 3000) | Home screen loads correctly |

### TC-20.3 — Docker Build & Run (P2) [Req NF-09]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Run `docker build -t domino .` | Image builds successfully |
| 2 | Run `docker run -p 3000:3000 domino` | Container starts; app accessible on port 3000 |

### TC-20.4 — Environment Variable: Port (P2) [Req NF-08]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set `PORT=4000` environment variable | App starts on port 4000 |
| 2 | Default (no PORT set) | App starts on port 3000 |

### TC-20.5 — SPA Routing (P2)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate directly to a deep URL (e.g., `/game/ABC123`) | Server serves index.html (SPA fallback) |
| 2 | Client-side routing handles the route | Correct view rendered |

---

## 21. Performance

### TC-21.1 — Multiple Concurrent Games (P2) [Req NF-15]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create 10 simultaneous games with 2+ players each | All games function correctly |
| 2 | Play moves in different games concurrently | No interference between games; responses < 200ms |

### TC-21.2 — Broadcast Latency (P2) [Req NF-16]
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Place a tile and measure time until opponent sees it | < 200ms on LAN |

---

## 22. Scoreboard

### TC-22.1 — Scoreboard Visibility (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | During gameplay, observe scoreboard | All players listed with names, scores, and tile counts |
| 2 | After a round | Scores update correctly |

### TC-22.2 — Scoreboard Player Indicators (P2)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Observe human players in scoreboard | Show as human (no CPU badge) |
| 2 | Observe computer players | Show CPU/bot indicator |
| 3 | Observe disconnected player | Show offline/disconnected indicator |

---

## 23. Error Handling

### TC-23.1 — Connection Lost Toast (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Temporarily lose network connection | Toast/notification shows connection lost |
| 2 | Connection restored | Toast disappears; state refreshed |

### TC-23.2 — Error Toast Auto-Dismiss (P2)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Trigger an error (e.g., invalid join code) | Error toast appears |
| 2 | Wait ~3 seconds | Toast auto-dismisses |

### TC-23.3 — Graceful Error on Invalid Actions (P1)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Attempt to join a game that already started | Error message: "Game already in progress" or similar |
| 2 | Attempt to join a full game | Error message: "Game is full" |

---

## Summary

| Section | Test Cases | P0 | P1 | P2 | P3 |
|---------|-----------|----|----|----|----|
| 1. Home Screen | 6 | 0 | 3 | 2 | 0 |
| 2. Lobby Screen | 10 | 2 | 5 | 2 | 0 |
| 3. Tile Dealing & Round Start | 5 | 3 | 1 | 1 | 0 |
| 4. Tile Placement | 7 | 2 | 2 | 2 | 0 |
| 5. Drawing & Passing | 6 | 2 | 3 | 0 | 0 |
| 6. Turn Management | 7 | 2 | 2 | 1 | 0 |
| 7. Round End & Scoring | 6 | 3 | 2 | 0 | 0 |
| 8. Game End | 3 | 1 | 1 | 1 | 0 |
| 9. Computer Player AI | 6 | 0 | 3 | 2 | 0 |
| 10. Disconnect & Reconnect | 6 | 3 | 1 | 1 | 0 |
| 11. Spectator Mode | 5 | 0 | 3 | 2 | 0 |
| 12. Activity Log | 4 | 0 | 1 | 1 | 2 |
| 13. Notifications & Real-Time | 4 | 1 | 3 | 0 | 0 |
| 14. Opponent Visibility | 2 | 1 | 1 | 0 | 0 |
| 15. Board Rendering | 3 | 0 | 2 | 1 | 0 |
| 16. Responsive & Mobile | 6 | 0 | 2 | 4 | 0 |
| 17. i18n | 3 | 0 | 0 | 2 | 1 |
| 18. Server Validation & Security | 5 | 2 | 2 | 1 | 0 |
| 19. Lifecycle Edge Cases | 5 | 0 | 2 | 3 | 0 |
| 20. Deployment & Infrastructure | 5 | 0 | 2 | 3 | 0 |
| 21. Performance | 2 | 0 | 0 | 2 | 0 |
| 22. Scoreboard | 2 | 0 | 1 | 1 | 0 |
| 23. Error Handling | 3 | 0 | 2 | 1 | 0 |
| **TOTAL** | **111** | **22** | **44** | **33** | **3** |
