import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Tile } from './types';
import DominoTile from './DominoTile';

interface SnakeBoardProps {
  board: Tile[];
  leftMarker?: React.ReactNode;
  rightMarker?: React.ReactNode;
}

// Tile dimensions on board (including border ~4px)
const TILE_W = 70;   // normal tile width (horizontal: two 32px halves + divider + border)
const TILE_H = 38;   // normal tile height
const DBL_W = 38;    // double tile width (vertical orientation)
const DBL_H = 70;    // double tile height
const GAP = 3;       // gap between tiles
const ROW_GAP = 10;  // vertical gap between rows when wrapping

interface TileLayout {
  tile: Tile;
  x: number;
  y: number;
  rotated: boolean; // true = non-double tile rendered vertically as a turn piece
}

function computeLayout(tiles: Tile[], containerWidth: number): { positions: TileLayout[]; totalWidth: number; totalHeight: number } {
  if (tiles.length === 0 || containerWidth < 200) {
    return { positions: [], totalWidth: 0, totalHeight: 0 };
  }

  const margin = 20;
  const positions: TileLayout[] = [];
  let cursor = margin;
  let y = margin;
  let direction = 1; // 1 = LTR, -1 = RTL
  let maxY = 0;
  let wrapped = false;

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const isDouble = tile.left === tile.right;
    const horizW = isDouble ? DBL_W : TILE_W;
    const horizH = isDouble ? DBL_H : TILE_H;

    // Would placing this tile horizontally overflow?
    let wouldOverflow: boolean;
    if (direction === 1) {
      wouldOverflow = cursor + horizW > containerWidth - margin;
    } else {
      wouldOverflow = cursor - horizW < margin;
    }

    if (wouldOverflow && i > 0) {
      // Place this tile as a vertical TURN piece at the edge
      wrapped = true;

      // Turn tile dimensions (rotated non-doubles become 38w×70h, doubles stay 38w×70h)
      const turnW = isDouble ? DBL_W : TILE_H; // 38
      const turnH = isDouble ? DBL_H : TILE_W; // 70

      let tileX: number;
      if (direction === 1) {
        // Turning at right edge — place at the cursor (or clip to fit)
        tileX = Math.min(cursor, containerWidth - margin - turnW);
      } else {
        // Turning at left edge — place at left margin
        tileX = Math.max(margin, cursor - turnW);
      }

      positions.push({ tile, x: tileX, y, rotated: !isDouble });
      maxY = Math.max(maxY, y + turnH);

      // Next row starts below the turn tile, going in the opposite direction
      y += turnH + GAP;
      direction *= -1;
      if (direction === 1) {
        // LTR: start from the turn tile's left edge
        cursor = tileX;
      } else {
        // RTL: start from the turn tile's right edge
        cursor = tileX + turnW;
      }

      continue;
    }

    // Normal horizontal placement
    let tileX: number;
    if (direction === 1) {
      tileX = cursor;
      cursor += horizW + GAP;
    } else {
      tileX = cursor - horizW;
      cursor -= (horizW + GAP);
    }

    // Center doubles vertically in the row
    const yOffset = isDouble ? -(DBL_H - TILE_H) / 2 : 0;

    positions.push({ tile, x: tileX, y: y + yOffset, rotated: false });
    maxY = Math.max(maxY, y + yOffset + horizH);
  }

  // If everything fits in a single row, center the chain horizontally
  if (!wrapped && positions.length > 0) {
    const lastPos = positions[positions.length - 1];
    const lastTile = lastPos.tile;
    const lastIsDouble = lastTile.left === lastTile.right;
    const lastTw = lastIsDouble ? DBL_W : TILE_W;
    const leftEdge = positions[0].x;
    const rightEdge = lastPos.x + lastTw;
    const chainWidth = rightEdge - leftEdge;
    const offset = (containerWidth - chainWidth) / 2 - leftEdge;
    if (Math.abs(offset) > 1) {
      for (const p of positions) {
        p.x += offset;
      }
    }
  }

  return {
    positions,
    totalWidth: containerWidth,
    totalHeight: maxY + margin,
  };
}

const SnakeBoard: React.FC<SnakeBoardProps> = ({ board, leftMarker, rightMarker }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  const measure = useCallback(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth);
    }
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measure]);

  const { positions, totalHeight } = computeLayout(board, containerWidth);

  // Find leftmost and rightmost tile positions for markers
  const leftPos = positions.length > 0 ? positions[0] : null;
  const rightPos = positions.length > 0 ? positions[positions.length - 1] : null;

  const markerW = 50;
  const markerH = 38;

  return (
    <div ref={containerRef} className="snake-board-wrapper">
      <div
        className="snake-board"
        style={{ height: Math.max(totalHeight, 120), position: 'relative' }}
      >
        {leftMarker && leftPos && (
          <div
            className="snake-marker"
            style={{
              left: leftPos.x - markerW - GAP,
              top: leftPos.y,
              width: markerW,
              height: markerH,
            }}
          >
            {leftMarker}
          </div>
        )}

        {positions.map((p) => (
          <div
            key={p.tile.id}
            className="snake-tile"
            style={{
              left: p.x,
              top: p.y,
            }}
          >
            <DominoTile tile={p.tile} onBoard vertical={p.rotated} />
          </div>
        ))}

        {rightMarker && rightPos && (
          <div
            className="snake-marker"
            style={{
              left: rightPos.x + (rightPos.rotated || rightPos.tile.left === rightPos.tile.right ? DBL_W : TILE_W) + GAP,
              top: rightPos.y,
              width: markerW,
              height: markerH,
            }}
          >
            {rightMarker}
          </div>
        )}
      </div>
    </div>
  );
};

export default SnakeBoard;
