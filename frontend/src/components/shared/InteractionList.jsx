import React, { useState } from 'react';
import SevBadge from './SevBadge.jsx';

const FILTERS = ['all', 'major', 'moderate', 'minor'];

const InteractionList = ({ interactions, coverageGap, focusId }) => {
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState({}); // id -> bool; undefined => default (major open)

  const count = (f) => (f === 'all' ? interactions.length : interactions.filter((i) => i.severity === f).length);
  const focused = interactions.find((i) => i.id === focusId);
  // A cell click must always be able to reveal its finding, even under another filter.
  const activeFilter = focused && filter !== 'all' && focused.severity !== filter ? 'all' : filter;
  const visible = interactions.filter((i) => activeFilter === 'all' || i.severity === activeFilter);
  const isOpen = (i) => (i.id === focusId ? true : open[i.id] ?? i.severity === 'major');

  return (
    <div className="bg-white border border-black p-5 w-full">
      <p className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold">06 · Interaction Findings</p>
      <p className="font-mono text-[11px] text-gray-400 mt-0.5 mb-4">From curated rules and structure checks only. Nothing is predicted by AI.</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 border font-mono text-xs uppercase transition-all ${
              activeFilter === f ? 'bg-black text-white border-black' : 'bg-white border-gray-200 text-gray-500 hover:border-black hover:text-black'
            }`}
          >
            {f} ({count(f)})
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="border border-dashed border-gray-300 p-6">
          <p className="font-mono text-xs text-gray-500 font-semibold">No interactions found among the curated rules.</p>
          <p className="font-mono text-xs text-gray-400 mt-2">
            {coverageGap
              ? 'Some medicines have no curated data, so only structure-based checks were applied. No findings does not mean safe.'
              : 'This is a small curated list. No findings does not mean safe.'}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {visible.map((f) => {
          const expanded = isOpen(f);
          const focusedNow = f.id === focusId;
          return (
            <div
              key={f.id}
              id={`finding-${f.id}`}
              className="bg-white"
              style={{ border: `${focusedNow ? 3 : 1}px solid #000` }}
            >
              <button
                className="w-full text-left p-4 flex flex-wrap items-center gap-2"
                onClick={() => setOpen({ ...open, [f.id]: !expanded })}
                aria-expanded={expanded}
              >
                <SevBadge severity={f.severity} />
                <span className="font-mono text-sm font-bold text-black flex-1 min-w-[12rem]">{f.title}</span>
                <span className="flex gap-1">
                  {f.drugs.map((d) => (
                    <span key={d} className="px-2 py-0.5 bg-white border border-gray-200 font-mono text-xs text-gray-500">{d}</span>
                  ))}
                </span>
                <span className="font-mono text-[11px] text-gray-400 uppercase">Evidence: {f.evidence}</span>
                <span className="font-mono text-xs text-gray-400">{expanded ? '−' : '+'}</span>
              </button>
              {expanded && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3 grid gap-3 font-mono text-xs text-gray-700">
                  <div><p className="text-gray-400 uppercase tracking-widest mb-1">Mechanism</p>{f.mechanism}</div>
                  <div><p className="text-gray-400 uppercase tracking-widest mb-1">Consequence</p>{f.consequence}</div>
                  <div><p className="text-gray-400 uppercase tracking-widest mb-1">What to ask your doctor or pharmacist</p>{f.action}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InteractionList;
