# Domino Multiplayer Game — Requirements

## 1. Overview

A real-time multiplayer Domino game with a self-hosted server (Linux) and a responsive web client that works on both desktop and mobile browsers. Players create/join games, play against each other and/or computer-controlled opponents.

---

## 2. Game Rules (Classic Draw Domino)

| Rule | Detail |
|------|--------|
| **Tile set** | Standard double-six set (28 tiles: [0\|0] through [6\|6]) |
| **Players** | 2–6 (any mix of human and computer) |
| **Deal** | 2–4 players → 7 tiles each; 5–6 players → 5 tiles each |
| **First move** | The player holding the highest double starts (first round). Subsequent rounds: the winner of the previous round starts |
| **Play direction** | Clockwise |
| **Placement** | A tile is placed at either open end of the chain if one of its halves matches the open end value |
| **Drawing** | If a player cannot play, they draw one tile from the boneyard (if tiles remain). If the drawn tile is playable, it may be played immediately; otherwise the turn passes |
| **Blocked game** | If no player can move and the boneyard is empty, the round ends. The player with the lowest pip total on remaining tiles wins the round. Tie → the round is a draw (no points awarded) |
| **Round scoring** | Winner scores the sum of pips on all opponents' remaining tiles |
| **Game end** | First player to reach **100 points** wins (configurable when creating the game) |

---

## 3. Functional Requirements

### 3.1 Lobby & Game Lifecycle

| ID | Requirement |
|----|-------------|
| F-01 | A player can **create a new game**, becoming the game host |
| F-02 | The host sets game options: target score (default 100), number of players (2–6) |
| F-03 | Creating a game produces a **shareable join code / link** that other players use to join |
| F-03a | After creating a game, the host can **see the join code** in the lobby and **copy it** with a single click/tap |
| F-04 | Any player with the join code/link can **join a game** before it starts |
| F-05 | The host can **add computer players** to fill empty slots (easy / medium / hard difficulty) |
| F-06 | The host can **remove computer players** before the game starts |
| F-07 | The host can **start the game** once at least 2 players (human + computer combined) are present |
| F-08 | The host can **kick a player** from the lobby before the game starts |
| F-09 | A player can **leave a game** at any time; their seat is replaced by a computer player if the round is in progress |
| F-10 | When all human players leave, the game is terminated and cleaned up |
| F-11 | The lobby shows a **player list** with names, ready status, and human/computer indicator |
| F-12 | Any user can **spectate** a game by opening its link; spectators see the board and all played tiles but **not** any player's hand |
| F-13 | Spectators see a **read-only view**: tile chain, scoreboard, turn indicator, boneyard count, and opponent tile counts |
| F-14 | The spectator count is displayed in the game UI |
| F-15 | A disconnected player has a **grace period of 60 seconds** to reconnect; during the grace period a computer takes their turns |
| F-16 | If the player reconnects within the grace period, they **resume control** of their seat and tiles |
| F-17 | If the grace period expires, the seat is **permanently replaced** by a computer player (medium difficulty) |

### 3.2 Gameplay

| ID | Requirement |
|----|-------------|
| G-01 | Each player sees **only their own tiles**; opponent tile counts are visible |
| G-02 | The **tile chain** (board) is visible to all players and scrollable/zoomable |
| G-03 | Valid placement positions are **highlighted** when a player selects a tile |
| G-03a | On the player's turn, **playable tiles are highlighted** with a green border/glow; **non-playable tiles are dimmed**, making it immediately clear which tiles can be placed |
| G-04 | A player can **place a tile** by dragging it to a valid end or tapping/clicking a valid end. When the player has their **last tile**, it is **auto-played** with a single click (no end selection needed since the round ends) |
| G-05 | A player can **draw from the boneyard** (if available) when they cannot play |
| G-05a | When a player has **no valid moves and the boneyard is empty**, a **"Pass Turn" button** is shown so they can skip immediately without waiting for the timer |
| G-06 | The game **auto-draws** a tile for the player if no valid play exists and the boneyard is not empty (optional setting; default: manual draw) |
| G-07 | A **turn timer** (configurable: 30s / 60s / 90s / unlimited) forces play; on timeout the game auto-draws or passes |
| G-08 | The current player's turn is **visually indicated** |
| G-09 | **Boneyard count** (remaining tiles) is displayed |
| G-10 | An **activity log** is displayed on the game board (top-right, collapsible) showing all game events: tile placements, draws, passes, player joins/leaves, round results |
| G-11 | After each round, a **round summary** shows tiles left per player, points scored, and cumulative scores |
| G-11 | After the final round, a **game summary / leaderboard** is shown |
| G-12 | Computer players make moves with a short artificial delay (1–2 seconds) to feel natural |
| G-13 | When a computer player has **no valid moves and the boneyard is empty**, it **passes immediately** (no artificial delay) |

### 3.3 Computer Player AI

| ID | Requirement |
|----|-------------|
| A-01 | **Easy** — picks a random valid tile |
| A-02 | **Medium** — prefers tiles that keep the most future options open |
| A-03 | **Hard** — uses a greedy heuristic: considers pip count, opponent tile count, and blocking potential |

### 3.4 Communication & Notifications

| ID | Requirement |
|----|-------------|
| N-01 | Real-time updates via **WebSockets** (tile placements, draws, turn changes, player join/leave) |
| N-02 | **Visual notifications** for: your turn, player joined/left, round ended, game ended |
| N-03 | Optional **sound effects** for tile placement, drawing, turn alert (mutable) |
| N-04 | When a player's turn starts, the client plays a short **beep** (toggleable in settings) |
| N-04a | The turn-alert beep toggle is shown as an **icon button** (not text) in the **top-right** area of the game UI, with clear on/off visual states |

---

## 4. Non-Functional Requirements

### 4.1 Architecture

| ID | Requirement |
|----|-------------|
| NF-01 | **Server**: Node.js (TypeScript) with Express + Socket.IO |
| NF-02 | **Client**: Single-page application (React + TypeScript) served by the same server |
| NF-03 | All game state lives **in server memory** (no database required); games are ephemeral |
| NF-04 | Client–server protocol uses **Socket.IO events** with JSON payloads |
| NF-05 | The server validates every move; **the client is never trusted** |

### 4.2 Deployment & Hosting

| ID | Requirement |
|----|-------------|
| NF-06 | Runs on a **Linux machine** with Node.js 18+ |
| NF-07 | Single command to build and start: `npm run build && npm start` |
| NF-08 | Configurable via **environment variables**: port (default 3000), log level |
| NF-09 | Provides a **Dockerfile** for optional containerised deployment |

### 4.3 Responsiveness & Mobile Support

| ID | Requirement |
|----|-------------|
| NF-10 | Responsive layout: **desktop** (≥ 1024px), **tablet** (768–1023px), **mobile** (< 768px) |
| NF-11 | Touch-friendly controls: tap to select tile, tap a valid end to place |
| NF-12 | On mobile, the player's hand is displayed in a **scrollable strip** at the bottom |
| NF-13 | The board is **pannable and zoomable** via touch gestures |
| NF-14 | Works on modern browsers: Chrome, Firefox, Safari, Edge (last 2 versions) |

### 4.4 Performance & Scalability

| ID | Requirement |
|----|-------------|
| NF-15 | Support at least **10 concurrent games** on modest hardware (1 CPU, 1 GB RAM) |
| NF-16 | Turn state broadcast latency < **200 ms** on LAN |
| NF-17 | Idle games with no human activity for **30 minutes** are auto-terminated |

### 4.5 Security

| ID | Requirement |
|----|-------------|
| NF-18 | No authentication required — players identify by a self-chosen display name |
| NF-19 | Join codes are **random, non-guessable** (e.g., 6-character alphanumeric) |
| NF-20 | Server validates all inputs; **no raw HTML/JS** from players is rendered (XSS prevention) |
| NF-21 | Rate limiting on game creation and join requests to prevent abuse |

---

## 5. User Interface Screens

| Screen | Key Elements |
|--------|-------------|
| **Home** | "Create Game" button, "Join Game" (enter code) input, player name input |
| **Lobby** | Player list, game settings, add computer player button, share link/code, start button (host only) |
| **Game Board** | Tile chain (center), player's hand (bottom), opponent tile counts, boneyard count, scoreboard, current turn indicator, draw button, spectator count |
| **Spectator View** | Same as Game Board but without player hand; read-only, no action controls |
| **Round Summary** | Points scored, remaining tiles per player, cumulative scores, "Next Round" button |
| **Game Over** | Final leaderboard, "Play Again" / "Back to Home" buttons |

---

## 6. Technology Stack Summary

| Layer | Technology |
|-------|-----------|
| Server runtime | Node.js 18+ (TypeScript) |
| HTTP framework | Express |
| Real-time | Socket.IO |
| Client framework | React 18+ (TypeScript) |
| Client build | Vite |
| Styling | CSS Modules or Tailwind CSS |
| Tile rendering | SVG (scalable, crisp on all resolutions) |
| Containerisation | Docker (optional) |

---

## 7. Design Decisions (Resolved)

| # | Question | Decision |
|---|----------|----------|
| 1 | Tile rendering style | **Clean flat style with subtle drop shadows** — lightweight, scales well on all devices |
| 2 | Chat | **Not included** — out of scope |
| 3 | Spectators | **Yes** — any user can open a game link to watch (read-only, no hands visible) |
| 4 | Reconnection | **Yes** — 60-second grace period; computer takes turns meanwhile; player resumes on reconnect |
| 5 | Variants | **Classic draw domino only** — block domino may be added later as an extension |
| 6 | Persistent stats | **No** — games are ephemeral, no database required |

---

*Please review and confirm to begin implementation.*
