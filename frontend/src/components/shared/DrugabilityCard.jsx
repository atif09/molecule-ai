import React from 'react';
import DrugabilityGauge from './DrugabilityGauge';

const GRADE = {
  A: { text: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  B: { text: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  C: { text: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
  D: { text: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

const DrugabilityCard = ({ druggability }) => {
  const { druggability_score: score, grade, interpretation, recommendation } = druggability;
  const s = GRADE[grade] || GRADE.A;

  return (
    <div className="bg-white border border-black p-6 w-full h-full flex flex-col">
      <span className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold block mb-5">
        04 · Druggability
      </span>

      <div className="flex flex-col items-center flex-1 justify-center">
        <DrugabilityGauge score={score} grade={grade} />

        <span
          className="mt-4 font-mono text-sm font-bold uppercase tracking-widest px-4 py-1.5 border"
          style={{ color: s.text, background: s.bg, borderColor: s.border }}
        >
          Grade {grade}
        </span>

        <p className="text-sm text-gray-600 italic text-center mt-4 leading-relaxed px-2">
          {interpretation}
        </p>
      </div>

      <div className="mt-5 border-t border-gray-100 pt-4">
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Recommendation</p>
        <p className="font-mono text-xs text-gray-600 leading-relaxed">{recommendation}</p>
      </div>
    </div>
  );
};

export default DrugabilityCard;
