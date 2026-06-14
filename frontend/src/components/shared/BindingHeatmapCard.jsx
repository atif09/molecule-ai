import React, { useEffect, useState } from 'react';
import { API_BASE } from '../../config';

const BindingHeatmapCard = ({ moleculeName }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!moleculeName) return;
    setLoading(true);
    setData(null);
    fetch(`${API_BASE}/api/v1/explain/binding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: moleculeName }),
    })
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [moleculeName]);

  if (loading) {
    return (
      <div className="border border-black bg-white p-5 animate-pulse">
        <p className="font-mono text-xs uppercase tracking-widest text-gray-400 font-semibold mb-4">
          Binding Pocket Fit
        </p>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 border border-gray-200" style={{ width: `${80 - i * 8}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.contributions) return null;

  const top = data.contributions.slice(0, 8);
  const maxPct = Math.max(...top.map(c => c.percentage), 1);

  return (
    <div className="border border-black bg-white p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-gray-500 font-semibold">
            Binding Pocket Fit
          </p>
          <p className="font-mono text-[11px] text-gray-400 mt-0.5">
            Feature importance driving pKd prediction
          </p>
        </div>
        <span className="font-mono text-[11px] text-gray-500 bg-gray-50 border border-gray-200 px-2 py-1">
          RF importances
        </span>
      </div>

      <div className="space-y-3">
        {top.map((c, i) => {
          const isPositive = c.direction === 'positive';
          const barColor  = isPositive ? '#15803d' : '#dc2626';
          const textColor = isPositive ? 'text-green-700' : 'text-red-600';
          const barWidth  = `${(c.percentage / maxPct) * 100}%`;

          return (
            <div key={c.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs text-gray-700">{c.label}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-gray-400">{c.value.toFixed(1)}</span>
                  <span className={`font-mono text-xs font-bold w-10 text-right ${textColor}`}>
                    {c.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 border border-gray-200">
                <div
                  className="h-full transition-all duration-700"
                  style={{ width: barWidth, backgroundColor: barColor, opacity: 0.85 - i * 0.05 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
        <p className="font-mono text-[11px] text-gray-400">
          Fingerprints:{' '}
          <span className="text-gray-600 font-semibold">{data.morgan_fingerprint_total_pct?.toFixed(1)}%</span>
          {' '}of model weight
        </p>
        <div className="flex gap-4 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-green-700">
            <span className="w-2 h-2 bg-green-600 inline-block" />
            positive
          </span>
          <span className="flex items-center gap-1.5 text-red-600">
            <span className="w-2 h-2 bg-red-600 inline-block" />
            negative
          </span>
        </div>
      </div>
    </div>
  );
};

export default BindingHeatmapCard;
