import React from 'react';
import { SEV, LEVEL_SEV } from './polyTheme.js';
import SevBadge from './SevBadge.jsx';

const POLY_LABEL = {
  none: 'Polypharmacy: under 5 medicines',
  polypharmacy: 'Polypharmacy: 5+ medicines',
  hyper_polypharmacy: 'Hyper-polypharmacy: 10+ medicines',
};

const PolyVerdictBanner = ({ overall, regimen }) => {
  const s = SEV[LEVEL_SEV[overall.level]] || SEV.ok;
  return (
    <div className="bg-white border border-black p-6 w-full">
      <span className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold block mb-5">
        01 · Regimen Verdict
      </span>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-4">
          <p className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-1">Safety Score</p>
          <p className="text-5xl font-bold text-black leading-none">{overall.safety_score}</p>
          <p className="font-mono text-[11px] text-gray-400 mt-1">out of 100</p>
          <div className="h-1.5 bg-gray-100 border border-gray-200 mt-4">
            <div className="h-full" style={{ width: `${overall.safety_score}%`, backgroundColor: s.text }} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span
              className="font-mono text-sm font-bold uppercase tracking-widest px-4 py-2 border"
              style={{ color: s.text, background: s.bg, borderColor: s.border }}
            >
              {overall.label}
            </span>
          </div>
        </div>

        <div className="col-span-12 md:col-span-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <SevBadge severity="major">{overall.counts.major} major</SevBadge>
            <SevBadge severity="moderate">{overall.counts.moderate} moderate</SevBadge>
            <SevBadge severity="minor">{overall.counts.minor} minor</SevBadge>
            <span className="px-3 py-0.5 bg-white border border-gray-200 font-mono text-xs text-gray-500 uppercase">
              {POLY_LABEL[regimen.polypharmacy_level] || regimen.polypharmacy_level}
            </span>
          </div>
          <p className="font-mono text-xs text-gray-700 leading-relaxed mb-4">{overall.summary}</p>
          {overall.top_actions.length > 0 && (
            <>
              <p className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-2">Top actions</p>
              <ol className="font-mono text-xs text-gray-700 space-y-1.5 list-decimal list-inside">
                {overall.top_actions.map((a) => <li key={a}>{a}</li>)}
              </ol>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PolyVerdictBanner;
