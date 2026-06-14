import React from 'react';

const ComparableCard = ({ repurposingData }) => {
  if (!repurposingData?.results?.length) return null;

  const topMatch = [...repurposingData.results].sort(
    (a, b) => b.tanimoto_similarity - a.tanimoto_similarity
  )[0];

  const similarityPct = Math.round(topMatch.tanimoto_similarity * 100);

  const similarityStyle = similarityPct >= 60
    ? { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', bar: '#15803d' }
    : similarityPct >= 35
    ? { color: '#b45309', bg: '#fffbeb', border: '#fde68a', bar: '#d97706' }
    : { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', bar: '#9ca3af' };

  const confStyle = topMatch.confidence === 'High'
    ? { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' }
    : topMatch.confidence === 'Medium'
    ? { color: '#b45309', bg: '#fffbeb', border: '#fde68a' }
    : { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' };

  return (
    <div className="border border-black bg-white p-5">
      <p className="font-mono text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">
        Most Similar Approved Ligand
      </p>

      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0">
          <p className="font-mono text-base font-bold text-black truncate">{topMatch.name}</p>
          <p className="font-mono text-xs text-gray-500 mt-0.5">{topMatch.disease}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-3xl font-bold" style={{ color: similarityStyle.color }}>
            {similarityPct}%
          </p>
          <p className="font-mono text-[11px] text-gray-400 uppercase tracking-widest">similarity</p>
        </div>
      </div>

      <div className="mt-4 h-1.5 bg-gray-100 border border-gray-200">
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${similarityPct}%`, backgroundColor: similarityStyle.bar }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-mono">
        <span className="bg-gray-50 border border-gray-200 px-2 py-1 text-gray-700">
          pKd {topMatch.pkd.toFixed(2)}
        </span>
        <span className="bg-gray-50 border border-gray-200 px-2 py-1 text-gray-700">
          Score {topMatch.repurposing_score.toFixed(0)}/100
        </span>
        <span className="bg-green-50 border border-green-200 px-2 py-1 text-green-700">
          ChEMBL Validated
        </span>
        <span
          className="px-2 py-1 border font-semibold"
          style={{ color: confStyle.color, background: confStyle.bg, borderColor: confStyle.border }}
        >
          {topMatch.confidence} confidence
        </span>
      </div>
    </div>
  );
};

export default ComparableCard;
