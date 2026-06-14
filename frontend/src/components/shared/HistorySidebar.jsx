import React from 'react';

const toSubscript = (str) => {
  if (!str) return '';
  return str.replace(/\d/g, d => '₀₁₂₃₄₅₆₇₈₉'[d]);
};

const getRelativeTime = (timestamp) => {
  const now = new Date();
  const then = new Date(timestamp);
  const diffInSeconds = Math.floor((now - then) / 1000);
  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const GRADE_STYLE = {
  A: 'bg-green-50 text-green-700 border-green-200',
  B: 'bg-amber-50 text-amber-700 border-amber-200',
  C: 'bg-orange-50 text-orange-700 border-orange-200',
  D: 'bg-red-50 text-red-600 border-red-200',
};

const GradeBadge = ({ grade }) => (
  <span className={`px-2 py-0.5 text-[11px] font-bold border font-mono ${GRADE_STYLE[grade] || GRADE_STYLE.C}`}>
    {grade}
  </span>
);

const HistorySidebar = ({ history, isOpen, onClose, onSelect, onClear }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const getScoreColor = (score, thresholds) => {
    if (score >= thresholds[0]) return 'text-green-700';
    if (score >= thresholds[1]) return 'text-amber-700';
    return 'text-orange-600';
  };

  const getStrengthColor = (strength) => {
    const s = strength?.toLowerCase();
    if (s === 'strong') return 'text-green-700';
    if (s === 'moderate') return 'text-amber-700';
    return 'text-red-600';
  };

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[99] transition-opacity duration-300 pointer-events-auto"
          onClick={onClose}
        />
      )}

      <aside className={`fixed top-0 right-0 h-screen z-[100] bg-white border-l border-black shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col overflow-hidden
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        w-full md:w-[320px]`}
      >
        {/* Header */}
        <header className="h-[56px] flex items-center justify-between px-5 border-b border-black shrink-0">
          <div className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="font-semibold text-sm text-black">Analysis History</span>
          </div>
          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <button
                onClick={onClear}
                title="Clear history"
                className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-6 3v10m4-10v10"/>
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-400 hover:border-black hover:text-black transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200 mb-3">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <p className="font-medium text-sm text-gray-400">No molecules analyzed yet</p>
              <p className="text-xs text-gray-300 mt-1">Analyze a molecule to see history here</p>
            </div>
          ) : (
            <div className="py-2">
              <div className="px-5 py-3 font-mono text-[11px] text-gray-400 uppercase tracking-widest font-semibold">
                This session · {history.length} molecule{history.length !== 1 ? 's' : ''}
              </div>

              {history.map((entry, idx) => (
                <div
                  key={entry.id}
                  onClick={() => onSelect(entry)}
                  className="mx-4 mb-3 bg-white border border-black p-4 cursor-pointer hover:bg-gray-50 active:scale-[0.98] transition-all relative"
                >
                  {idx === 0 && (
                    <span className="absolute top-2 right-2 font-mono text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                      LATEST
                    </span>
                  )}

                  {/* Top row */}
                  <div className="flex justify-between items-start pr-10">
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-black truncate pr-2">{entry.molecule_name}</h4>
                      <p className="font-mono text-[11px] text-gray-400 mt-0.5">{toSubscript(entry.molecular_formula)}</p>
                    </div>
                    <GradeBadge grade={entry.grade} />
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-1.5 mt-3">
                    <div className="border border-gray-100 bg-gray-50 p-2 text-center">
                      <div className="font-mono text-sm font-bold text-black leading-none">{entry.pkd?.toFixed(1) || '—'}</div>
                      <div className="font-mono text-[10px] text-gray-400 mt-1 uppercase">pKd</div>
                    </div>
                    <div className="border border-gray-100 bg-gray-50 p-2 text-center">
                      <div className={`font-mono text-sm font-bold leading-none ${getScoreColor(entry.overall_admet_score, [80, 60])}`}>
                        {entry.overall_admet_score}%
                      </div>
                      <div className="font-mono text-[10px] text-gray-400 mt-1 uppercase">ADMET</div>
                    </div>
                    <div className="border border-gray-100 bg-gray-50 p-2 text-center">
                      <div className={`font-mono text-sm font-bold leading-none ${getScoreColor(entry.druggability_score, [70, 50])}`}>
                        {entry.druggability_score}
                      </div>
                      <div className="font-mono text-[10px] text-gray-400 mt-1 uppercase">Score</div>
                    </div>
                  </div>

                  {/* Bottom row */}
                  <div className="mt-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[11px] font-semibold ${getStrengthColor(entry.binding_strength)}`}>
                        {entry.binding_strength}
                      </span>
                      <span className="text-gray-200">·</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${entry.lipinski_pass ? 'bg-green-500' : 'bg-red-400'}`} />
                      <span className="font-mono text-[11px] text-gray-500 font-semibold">L5</span>
                    </div>
                    <span className="font-mono text-[11px] text-gray-400">{getRelativeTime(entry.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="shrink-0 border-t border-black px-5 py-4 flex justify-between items-center bg-gray-50">
          <span className="font-mono text-[11px] text-gray-400">Stored locally</span>
          {history.length > 0 && (
            <button
              onClick={onClear}
              className="font-mono text-[11px] text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear all
            </button>
          )}
        </footer>
      </aside>
    </>
  );
};

export default HistorySidebar;
