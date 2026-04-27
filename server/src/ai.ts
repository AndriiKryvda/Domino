import { Tile, AIDifficulty, PlacementEnd, ValidMove } from './types';
import { getValidMoves, pipCount, isDouble } from './gameLogic';

export interface AIMove {
  tileId: string;
  end: PlacementEnd;
}

export function computeAIMove(
  hand: Tile[],
  boardLeftEnd: number,
  boardRightEnd: number,
  boardEmpty: boolean,
  difficulty: AIDifficulty,
  opponentTileCounts: number[]
): AIMove | null {
  const validMoves = getValidMoves(hand, boardLeftEnd, boardRightEnd, boardEmpty);
  if (validMoves.length === 0) return null;

  switch (difficulty) {
    case 'easy':
      return easyAI(validMoves);
    case 'medium':
      return mediumAI(hand, validMoves, boardLeftEnd, boardRightEnd, boardEmpty);
    case 'hard':
      return hardAI(hand, validMoves, boardLeftEnd, boardRightEnd, boardEmpty, opponentTileCounts);
  }
}

// Easy: random valid move
function easyAI(validMoves: ValidMove[]): AIMove {
  const move = validMoves[Math.floor(Math.random() * validMoves.length)];
  return { tileId: move.tileId, end: move.end };
}

// Medium: prefer tiles that keep the most future options open
function mediumAI(
  hand: Tile[],
  validMoves: ValidMove[],
  boardLeftEnd: number,
  boardRightEnd: number,
  boardEmpty: boolean
): AIMove {
  let bestMove = validMoves[0];
  let bestScore = -Infinity;

  for (const move of validMoves) {
    const tile = hand.find(t => t.id === move.tileId)!;
    const remainingHand = hand.filter(t => t.id !== move.tileId);

    // Simulate placing the tile
    const { newLeft, newRight } = simulatePlace(tile, move.end, boardLeftEnd, boardRightEnd, boardEmpty);

    // Count how many moves would be available afterward
    const futureMoves = getValidMoves(remainingHand, newLeft, newRight, false);
    const score = futureMoves.length;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return { tileId: bestMove.tileId, end: bestMove.end };
}

// Hard: greedy heuristic considering pip count, future options, and blocking
function hardAI(
  hand: Tile[],
  validMoves: ValidMove[],
  boardLeftEnd: number,
  boardRightEnd: number,
  boardEmpty: boolean,
  opponentTileCounts: number[]
): AIMove {
  let bestMove = validMoves[0];
  let bestScore = -Infinity;

  const minOpponentTiles = Math.min(...opponentTileCounts);

  for (const move of validMoves) {
    const tile = hand.find(t => t.id === move.tileId)!;
    const remainingHand = hand.filter(t => t.id !== move.tileId);

    const { newLeft, newRight } = simulatePlace(tile, move.end, boardLeftEnd, boardRightEnd, boardEmpty);
    const futureMoves = getValidMoves(remainingHand, newLeft, newRight, false);

    let score = 0;

    // Prefer playing high-pip tiles (get rid of points)
    score += pipCount(tile) * 2;

    // Prefer keeping future options
    score += futureMoves.length * 3;

    // Prefer doubles when opponent has few tiles (blocking potential)
    if (isDouble(tile) && minOpponentTiles <= 2) {
      score += 5;
    }

    // Prefer playing tiles whose values appear often in hand (keep variety)
    const leftCount = remainingHand.filter(t => t.left === tile.left || t.right === tile.left).length;
    const rightCount = remainingHand.filter(t => t.left === tile.right || t.right === tile.right).length;
    score += (leftCount + rightCount);

    // If we can empty our hand, that's best
    if (remainingHand.length === 0) {
      score += 100;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return { tileId: bestMove.tileId, end: bestMove.end };
}

function simulatePlace(
  tile: Tile,
  end: PlacementEnd,
  boardLeftEnd: number,
  boardRightEnd: number,
  boardEmpty: boolean
): { newLeft: number; newRight: number } {
  if (boardEmpty) {
    return { newLeft: tile.left, newRight: tile.right };
  }

  if (end === 'left') {
    const newLeft = tile.right === boardLeftEnd ? tile.left : tile.right;
    return { newLeft, newRight: boardRightEnd };
  } else {
    const newRight = tile.left === boardRightEnd ? tile.right : tile.left;
    return { newLeft: boardLeftEnd, newRight };
  }
}
