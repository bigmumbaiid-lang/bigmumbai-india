import { formatMultiplier } from '../utils/money';

export default function MultiplierBar({ multipliers, activeIndex }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {multipliers.map((m, i) => (
        <div
          key={i}
          className={`flex-1 min-w-[60px] text-center rounded-full py-2 text-sm font-bold transition-colors ${
            i === activeIndex
              ? 'bg-emerald-400 text-slate-900'
              : 'bg-slate-700 text-slate-400'
          }`}
        >
          {formatMultiplier(m)}
        </div>
      ))}
    </div>
  );
}
