# Domino Multiplayer Game

A real-time multiplayer Domino game with a self-hosted server and a responsive web client that works on both desktop and mobile browsers. Players create or join games and play against each other and/or computer-controlled opponents.

## Features

- Classic Draw Domino rules with a standard double-six tile set (28 tiles)
- 2–5 players (any mix of human and AI opponents with easy / medium / hard difficulty)
- Real-time gameplay via WebSockets (Socket.IO)
- Shareable join code/link for inviting players to a game
- Turn timer options: 30s / 60s / 90s / unlimited
- Spectator mode — watch a live game without participating
- Reconnection grace period (60 s) — a computer takes over while you reconnect
- Configurable target score (default: 100 points)
- Multilingual UI (i18n support)
- Fully containerised — runs in Docker

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Client | React, TypeScript, Vite |
| Server | Node.js, Express, Socket.IO, TypeScript |
| Container | Docker (multi-stage build) |

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your Linux host

### Deploy with Docker

```bash
# Clone the repository
git clone https://git.epam.com/andrii_kryvda/domino.git /home/user/Domino
cd /home/user/Domino

# Get latest changes (subsequent updates)
git pull origin main

# Build the Docker image
docker build -t domino-game .

# Run the container
docker run -d -p 3001:3001 --name domino domino-game
```

The game will be available at `http://<your-host-ip>:3001`

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Port the server listens on |
| `LOG_LEVEL` | `info` | Logging verbosity |

## Development

```bash
# Install all dependencies
npm run install:all

# Start server in watch mode
npm run dev:server

# Start client dev server (separate terminal)
npm run dev:client

# Build for production
npm run build
```

## Running Tests

End-to-end tests use [Playwright](https://playwright.dev/):

```bash
npm run test:ui
```

## Useful Docker Commands

```bash
# View logs
docker logs -f domino

# Stop the container
docker stop domino

# Remove and rebuild
docker rm domino
docker build -t domino-game . && docker run -d -p 3001:3001 --name domino domino-game
```

## Project Structure

```
├── client/          # React frontend (Vite)
├── server/          # Node.js backend (Express + Socket.IO)
├── tests/           # Playwright e2e tests
├── Dockerfile       # Multi-stage production build
├── REQUIREMENTS.md  # Full functional requirements
└── TEST_CASES.md    # Test case definitions
```
