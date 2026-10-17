import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';

/** Move up / move down / remove buttons for an item in an ordered list. */
export default function RowControls({
  index,
  count,
  label,
  removeLabel,
  onMove,
  onRemove
}: {
  index: number;
  count: number;
  label: string;
  removeLabel: string;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="row-controls">
      <button
        className="icon-button"
        disabled={index === 0}
        aria-label={'Move ' + label + ' up'}
        onClick={() => onMove(-1)}
      >
        <ArrowUp size={16} />
      </button>
      <button
        className="icon-button"
        disabled={index === count - 1}
        aria-label={'Move ' + label + ' down'}
        onClick={() => onMove(1)}
      >
        <ArrowDown size={16} />
      </button>
      <button className="icon-button danger" aria-label={removeLabel} onClick={onRemove}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}

/** Returns a copy of the list with the item at `index` swapped with its neighbour. */
export function moved<T>(list: T[], index: number, direction: -1 | 1) {
  const next = [...list];
  [next[index], next[index + direction]] = [next[index + direction], next[index]];
  return next;
}
