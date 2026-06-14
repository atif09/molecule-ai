import React, { useState, useEffect } from 'react';

const STATUS_CONFIG = {
  pass:  { icon: '✓', color: 'text-green-700',  bg: 'bg-green-50  border border-green-200' },
  fail:  { icon: '✗', color: 'text-red-600',    bg: 'bg-red-50    border border-red-200'   },
  retry: { icon: '↻', color: 'text-amber-700',  bg: 'bg-amber-50  border border-amber-200' },
};

const ReasoningTraceCard = ({ steps }) => {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    setVisible(0);
    if (!steps?.length) return;
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setVisible(i);
      if (i >= steps.length) clearInterval(interval);
    }, 550);
    return () => clearInterval(interval);
  }, [steps]);

  if (!steps?.length) return null;

  return (
    <div className="border border-black bg-white p-5">
      <div className="flex items-center gap-2 mb-5">
        <span className="w-2 h-2 rounded-full bg-black" />
        <p className="font-mono text-xs uppercase tracking-widest text-gray-500 font-semibold">
          AI Reasoning Trace
        </p>
        <span className="ml-auto font-mono text-[11px] text-gray-400">
          {steps.length} steps
        </span>
      </div>

      <div className="space-y-2">
        {steps.slice(0, visible).map((s, i) => {
          const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.pass;
          return (
            <div
              key={i}
              className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300"
            >
              <span className={`shrink-0 w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5 ${cfg.bg} ${cfg.color}`}>
                {cfg.icon}
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-mono text-[11px] text-gray-400 mr-2">
                  {String(s.step).padStart(2, '0')}
                </span>
                <span className="font-mono text-xs text-gray-700">
                  {s.action}
                </span>
              </div>
              <span className={`shrink-0 font-mono text-[11px] uppercase tracking-widest font-semibold ${cfg.color}`}>
                {s.status}
              </span>
            </div>
          );
        })}

        {visible < steps.length && (
          <div className="flex items-center gap-3 pl-9">
            <span className="font-mono text-xs text-gray-400 animate-pulse">
              █ processing...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReasoningTraceCard;
