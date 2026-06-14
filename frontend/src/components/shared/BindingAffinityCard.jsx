import React from 'react';

const STRENGTH = {
  Strong:   { text: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  Moderate: { text: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  Weak:     { text: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

const BindingAffinityCard = ({ bindingAffinity }) => {
  const { pkd, binding_strength, confidence_interval, percentile_rank } = bindingAffinity;
  const [low, high] = confidence_interval || [0, 0];
  const s = STRENGTH[binding_strength] || STRENGTH.Moderate;

  const rankColor = percentile_rank >= 75 ? '#15803d' : percentile_rank >= 50 ? '#b45309' : '#dc2626';
  const rankBg   = percentile_rank >= 75 ? '#f0fdf4' : percentile_rank >= 50 ? '#fffbeb' : '#fef2f2';
  const rankBd   = percentile_rank >= 75 ? '#bbf7d0' : percentile_rank >= 50 ? '#fde68a' : '#fecaca';

  return (
    <div className="bg-white border border-black p-6 w-full flex-1 flex flex-col h-full">
      <span className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold block mb-6">
        02 · Binding Affinity
      </span>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <p className="text-[60px] font-extrabold text-black leading-none mb-1 tracking-tighter">
          {pkd.toFixed(1)}
        </p>
        <span className="font-mono text-sm text-gray-500">pKd (Predicted)</span>

        <span
          className="mt-4 font-mono text-xs font-bold uppercase tracking-widest px-3 py-1 border"
          style={{ color: s.text, background: s.bg, borderColor: s.border }}
        >
          {binding_strength}
        </span>
      </div>

      <div className="h-px bg-gray-100 my-5" />

      <div className="space-y-4 w-full">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold">Confidence Interval</span>
          <span className="font-mono text-sm text-black font-bold">[{low.toFixed(2)} – {high.toFixed(2)}]</span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold">Percentile Rank</span>
            <span
              className="font-mono text-xs font-bold px-2 py-0.5 border"
              style={{ color: rankColor, background: rankBg, borderColor: rankBd }}
            >
              {percentile_rank}th
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 border border-gray-200">
            <div
              className="h-full transition-all duration-700"
              style={{ width: `${percentile_rank}%`, backgroundColor: rankColor }}
            />
          </div>
        </div>
      </div>

      <p className="font-mono text-xs text-gray-400 italic mt-5 text-center">
        Higher pKd = stronger predicted binding
      </p>
    </div>
  );
};

export default BindingAffinityCard;
