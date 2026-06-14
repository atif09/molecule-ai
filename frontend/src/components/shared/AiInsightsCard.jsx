import React from 'react';

const AiInsightsCard = ({ aiInterpretation, processingTime }) => {
  return (
    <div className="bg-white border border-black p-8 w-full">
      <div className="flex items-center justify-between mb-6">
        <span className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold">
          06 · AI Synthesis Insights
        </span>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-black rounded-full" />
          <span className="font-mono text-xs text-gray-500">
            Processed in {processingTime || 0}ms
          </span>
        </div>
      </div>

      <div className="border-l-4 border-black pl-6 py-1">
        <p className="text-base leading-relaxed text-gray-700 italic">
          "{aiInterpretation?.interpretation || aiInterpretation || 'Analysis complete. Generating structural insights...'}"
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Primary Recommendation', value: 'Advance to Docking' },
          { label: 'Optimization Path', value: 'Reduce polar surface area' },
          { label: 'Risk Assessment', value: 'Minor hERG liability detected' },
        ].map(({ label, value }) => (
          <div key={label} className="p-4 border border-gray-200 bg-gray-50">
            <span className="font-mono text-[11px] text-gray-500 uppercase tracking-widest font-semibold block mb-1">{label}</span>
            <p className="font-mono text-sm text-black font-medium">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AiInsightsCard;
