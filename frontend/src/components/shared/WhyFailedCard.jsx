import React from 'react';

const WhyFailedCard = ({ failureReasons, grade }) => {
  if (!failureReasons?.length || !['C', 'D'].includes(grade)) return null;

  return (
    <div className="border border-red-200 bg-red-50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        <h3 className="font-mono text-xs uppercase tracking-widest text-red-700 font-semibold">
          Why this molecule failed
        </h3>
        <span className="ml-auto font-mono text-xs bg-red-100 text-red-700 px-2 py-0.5 border border-red-200 font-bold">
          Grade {grade}
        </span>
      </div>

      <div className="space-y-3">
        {failureReasons.map((f, i) => (
          <div key={i} className="border border-red-200 bg-white p-3">
            <p className="font-mono text-sm font-bold text-red-800 mb-0.5">{f.issue}</p>
            <p className="font-mono text-xs text-gray-600 mb-2">{f.reason}</p>
            <div className="flex items-start gap-1.5">
              <span className="font-mono text-[11px] text-green-700 uppercase tracking-widest mt-0.5 font-semibold flex-shrink-0">Fix →</span>
              <p className="font-mono text-xs text-green-700">{f.fix}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WhyFailedCard;
