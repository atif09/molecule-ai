import React from 'react';

const ProbabilityBar = ({ label, probability, pass, badgeText, barColor }) => {
  const passColor  = '#15803d';
  const failColor  = '#dc2626';
  const currentColor = barColor || (pass ? passColor : failColor);

  const badgeStyle = {
    background: pass ? '#f0fdf4' : '#fef2f2',
    color: pass ? passColor : failColor,
    border: `1px solid ${pass ? '#bbf7d0' : '#fecaca'}`,
  };

  return (
    <div className="w-full">
      {(label || badgeText) && (
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs text-gray-600 font-medium">{label}</span>
          <span
            className="font-mono text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 border"
            style={badgeStyle}
          >
            {badgeText}
          </span>
        </div>
      )}
      <div className="h-1.5 bg-gray-100 border border-gray-200">
        <div
          className="h-full transition-all duration-600"
          style={{ width: `${Math.min(probability * 100, 100)}%`, backgroundColor: currentColor }}
        />
      </div>
    </div>
  );
};

export default ProbabilityBar;
