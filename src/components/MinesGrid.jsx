import Tile from './Tile';

export default function MinesGrid({ revealedTiles, mineHits, onTileClick, disabled, gridSize = 25 }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: gridSize }, (_, i) => {
        let state = 'hidden';
        if (mineHits.includes(i)) state = 'mine';
        else if (revealedTiles.includes(i)) state = 'safe';

        return (
          <Tile
            key={i}
            index={i}
            state={state}
            onClick={onTileClick}
            disabled={disabled || state !== 'hidden'}
          />
        );
      })}
    </div>
  );
}
