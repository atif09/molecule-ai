import React from 'react';

const DrugabilityGauge = ({ score, grade }) => {
  const gradeColors = {
    A: '#15803d',
    B: '#d97706',
    C: '#ea580c',
    D: '#dc2626',
  };

  const color = gradeColors[grade] || gradeColors.A;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const validScore = typeof score === 'number' && !isNaN(score) ? score : 0;

  return (
    <div className="flex items-center justify-center">
      <svg viewBox="0 0 120 120" width={120} height={120}>
        {/* Track */}
        <circle cx={60} cy={60} r={radius} stroke="#e5e7eb" strokeWidth={8} fill="none" />
        {/* Progress */}
        <circle
          cx={60} cy={60} r={radius}
          strokeWidth={8} fill="none"
          strokeLinecap="butt"
          transform="rotate(-90 60 60)"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - validScore / 100)}
          stroke={color}
          style={{ transition: 'stroke-dashoffset 800ms ease' }}
        />
        {/* Score text */}
        <text
          x={60} y={65}
          textAnchor="middle"
          fontSize={24}
          fontWeight={800}
          fill="#111827"
          fontFamily="Inter, sans-serif"
        >
          {validScore}
        </text>
      </svg>
    </div>
  );
};

export default DrugabilityGauge;
