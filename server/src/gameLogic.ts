import { Tile, PlacementEnd, ValidMove } from './types';

export function createFullSet(): Tile[] {
  const tiles: Tile[] = [];
  for (let left = 0; left <= 6; left++) {
    for (let right = left; right <= 6; right++) {
      tiles.push({ left, right, id: `${left}-${right}` });
    }
  }
  return tiles;
}

export function shuffleTiles(tiles: Tile[]): Tile[] {
  const shuffled = [...tiles];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function tilesPerPlayer(playerCount: number): number {
  return playerCount <= 4 ? 7 : 5;
}

export function dealTiles(playerCount: number): { hands: Tile[][]; boneyard: Tile[] } {
  const tiles = shuffleTiles(createFullSet());
  const perPlayer = tilesPerPlayer(playerCount);
  const hands: Tile[][] = [];
  let idx = 0;
  for (let i = 0; i < playerCount; i++) {
    hands.push(tiles.slice(idx, idx + perPlayer));
    idx += perPlayer;
  }
  return { hands, boneyard: tiles.slice(idx) };
}

export function isDouble(tile: Tile): boolean {
  return tile.left === tile.right;
}

export function pipCount(tile: Tile): number {
  return tile.left + tile.right;
}

export function totalPipCount(tiles: Tile[]): number {
  return tiles.reduce((sum, t) => sum + pipCount(t), 0);
}

export function findHighestDouble(hand: Tile[]): Tile | null {
  let best: Tile | null = null;
  for (const tile of hand) {
    if (isDouble(tile)) {
      if (!best || tile.left > best.left) {
        best = tile;
      }
    }
  }
  return best;
}

export function findStartingPlayer(hands: Tile[][]): number {
  let bestPlayer = 0;
  let bestDouble = -1;
  for (let i = 0; i < hands.length; i++) {
    const highest = findHighestDouble(hands[i]);
    if (highest && highest.left > bestDouble) {
      bestDouble = highest.left;
      bestPlayer = i;
    }
  }
  // If no one has a double, player with highest pip tile goes first
  if (bestDouble === -1) {
    let bestPip = -1;
    for (let i = 0; i < hands.length; i++) {
      for (const tile of hands[i]) {
        const pips = pipCount(tile);
        if (pips > bestPip) {
          bestPip = pips;
          bestPlayer = i;
        }
      }
    }
  }
  return bestPlayer;
}

export function canPlace(tile: Tile, end: PlacementEnd, boardLeftEnd: number, boardRightEnd: number): boolean {
  const target = end === 'left' ? boardLeftEnd : boardRightEnd;
  return tile.left === target || tile.right === target;
}

export function getValidMoves(hand: Tile[], boardLeftEnd: number, boardRightEnd: number, boardEmpty: boolean): ValidMove[] {
  if (boardEmpty) {
    // First tile: any tile can be played
    return hand.map(t => ({ tileId: t.id, end: 'right' as PlacementEnd }));
  }

  const moves: ValidMove[] = [];
  for (const tile of hand) {
    const fitsLeft = canPlace(tile, 'left', boardLeftEnd, boardRightEnd);
    const fitsRight = canPlace(tile, 'right', boardLeftEnd, boardRightEnd);

    if (fitsLeft) {
      moves.push({ tileId: tile.id, end: 'left' });
    }
    if (fitsRight) {
      // Skip right if both board ends are equal AND the tile is a double matching that value
      // (playing such a tile on left vs right is identical)
      const isDuplicate = boardLeftEnd === boardRightEnd && tile.left === tile.right && fitsLeft;
      if (!isDuplicate) {
        moves.push({ tileId: tile.id, end: 'right' });
      }
    }
  }
  return moves;
}

export interface PlaceResult {
  board: Tile[];
  boardLeftEnd: number;
  boardRightEnd: number;
  placedTile: Tile;
}

export function placeTile(
  tile: Tile,
  end: PlacementEnd,
  board: Tile[],
  boardLeftEnd: number,
  boardRightEnd: number
): PlaceResult {
  const newBoard = [...board];

  if (newBoard.length === 0) {
    // First tile
    newBoard.push(tile);
    return {
      board: newBoard,
      boardLeftEnd: tile.left,
      boardRightEnd: tile.right,
      placedTile: tile,
    };
  }

  if (end === 'left') {
    // Orient tile so the matching side faces the board
    const oriented: Tile = tile.right === boardLeftEnd
      ? { ...tile }
      : { left: tile.right, right: tile.left, id: tile.id };
    newBoard.unshift(oriented);
    return {
      board: newBoard,
      boardLeftEnd: oriented.left,
      boardRightEnd,
      placedTile: oriented,
    };
  } else {
    const oriented: Tile = tile.left === boardRightEnd
      ? { ...tile }
      : { left: tile.right, right: tile.left, id: tile.id };
    newBoard.push(oriented);
    return {
      board: newBoard,
      boardLeftEnd,
      boardRightEnd: oriented.right,
      placedTile: oriented,
    };
  }
}
