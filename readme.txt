Domino Game - Deployment Guide
===============================

1. Copy the source code to your Linux machine
----------------------------------------------

Use scp, rsync, or git. Exclude build artifacts:

  # From your Windows machine (PowerShell), using scp:
  scp -r C:\Projects\VibeCoding\Domino user@linux-host:/home/user/Domino

  # Or with rsync (from WSL/Git Bash):
  rsync -av --exclude node_modules --exclude '*/dist' --exclude '*/node_modules' \
    /mnt/c/Projects/VibeCoding/Domino/ user@linux-host:/home/user/Domino/

If using git, just push and clone on the other side:

  # First-time clone:
  git clone https://git.epam.com/andrii_kryvda/domino.git /home/user/Domino

  # Get latest changes (subsequent updates):
  cd /home/user/Domino
  git pull origin main

2. Build the Docker image on the Linux machine
-----------------------------------------------

  cd /home/user/Domino
  docker build -t domino-game .

3. Run the container
--------------------

  docker run -d -p 3001:3001 --name domino domino-game

The game will be available at http://<linux-host-ip>:3001

Useful commands
---------------

  # View logs
  docker logs -f domino

  # Stop
  docker stop domino

  # Remove and rebuild
  docker rm domino
  docker build -t domino-game . && docker run -d -p 3001:3001 --name domino domino-game

Notes
-----
- The Dockerfile is a multi-stage build: it installs dependencies, compiles
  both server and client, then produces a lean production image with only
  the built artifacts.
- No extra setup is needed on the Linux host beyond having Docker installed.
- The server listens on port 3001 by default (configurable via PORT env var).
