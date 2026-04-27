import React from 'react';
import { Tile } from './types';

interface DominoTileProps {
  tile: Tile;
  onBoard?: boolean;
  vertical?: boolean;
  selected?: boolean;
  playable?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const dotPositions: Record<number, [number, number][]> = {
  0: [],
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
};

function DominoHalf({ value, size }: { value: number; size: number }) {
  const dots = dotPositions[value] || [];
  const dotSize = size > 36 ? 7 : 5;
  return (
    <div className="domino-half" style={{ width: size, height: size }}>
      {dots.map(([x, y], i) => (
        <div
          key={i}
          className="dot"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            width: dotSize,
            height: dotSize,
          }}
        />
      ))}
    </div>
  );
}

const DominoTile: React.FC<DominoTileProps> = ({ tile, onBoard = false, vertical = false, selected = false, playable = false, disabled = false, onClick }) => {
  const size = onBoard ? 32 : 44;
  const isDouble = tile.left === tile.right;
  const cls = `domino-tile${onBoard ? ' on-board' : ''}${onBoard && (isDouble || vertical) ? ' double' : ''}${selected ? ' selected' : ''}${playable ? ' playable' : ''}${disabled ? ' disabled' : ''}`;

  return (
    <div className={cls} onClick={onClick} title={`[${tile.left}|${tile.right}]`}>
      <DominoHalf value={tile.left} size={size} />
      <div className="domino-divider" />
      <DominoHalf value={tile.right} size={size} />
    </div>
  );
};

export default DominoTile;
