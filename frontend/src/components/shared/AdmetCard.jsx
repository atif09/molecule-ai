import React from 'react';

const GRADE = {
  A: { text: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', bar: '#15803d' },
  B: { text: '#b45309', bg: '#fffbeb', border: '#fde68a', bar: '#d97706' },
  C: { text: '#c2410c', bg: '#fff7ed', border: '#fed7aa', bar: '#ea580c' },
  D: { text: '#dc2626', bg: '#fef2f2', border: '#fecaca', bar: '#dc2626' },
};

const getGrade = (score) => {
  if (score >= 80) return GRADE.A;
  if (score >= 60) return GRADE.B;
  if (score >= 40) return GRADE.C;
  return GRADE.D;
};

const getGradeLetter = (score) => {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
};

const ADMET_LABELS = [
  { key: 'absorption',   label: 'Absorption' },
  { key: 'distribution', label: 'Distribution' },
  { key: 'metabolism',   label: 'Metabolism' },
  { key: 'excretion',    label: 'Excretion' },
];

const AdmetCard = ({ admet }) => {
  const score = admet.overall_admet_score || 0;
  const g = getGrade(score);
  const gradeLetter = getGradeLetter(score);
  const isToxic = !admet.toxicity?.pass;
  const passCount = ADMET_LABELS.filter(p => admet[p.key]?.pass).length;

  return (
    <div className="bg-white border border-black p-6 w-full h-full flex flex-col">
      <span className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold block mb-5">
        03 · ADMET Profile
      </span>

      {/* Score + grade */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-1">Overall Score</p>
          <p className="text-5xl font-bold text-black leading-none">{score.toFixed(0)}</p>
          <p className="font-mono text-[11px] text-gray-400 mt-1">out of 100</p>
        </div>
        <span
          className="font-mono text-sm font-bold uppercase tracking-widest px-4 py-2 border mb-1"
          style={{ color: g.text, background: g.bg, borderColor: g.border }}
        >
          Grade {gradeLetter}
        </span>
      </div>

      {/* Score bar */}
      <div className="h-1.5 bg-gray-100 border border-gray-200 mb-5">
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: g.bar }}
        />
      </div>

      {/* Two key stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`border p-3 ${isToxic ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          <span className="font-mono text-[11px] text-gray-500 uppercase tracking-widest block mb-1">Toxicity</span>
          <span className={`font-mono text-base font-bold ${isToxic ? 'text-red-600' : 'text-green-700'}`}>
            {isToxic ? 'TOXIC' : 'SAFE'}
          </span>
        </div>
        <div className={`border p-3 ${passCount >= 3 ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
          <span className="font-mono text-[11px] text-gray-500 uppercase tracking-widest block mb-1">Passing</span>
          <span className={`font-mono text-base font-bold ${passCount >= 3 ? 'text-green-700' : 'text-amber-700'}`}>
            {passCount} / 4
          </span>
        </div>
      </div>

      {/* Property grid */}
      <div className="grid grid-cols-2 gap-2 mt-auto">
        {ADMET_LABELS.map(({ key, label }) => {
          const d = admet[key];
          if (!d) return null;
          return (
            <div key={key} className={`flex items-center justify-between border px-3 py-2 ${
              d.pass ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}>
              <span className="font-mono text-[11px] text-gray-600">{label}</span>
              <span className={`font-mono text-[11px] font-bold uppercase ${d.pass ? 'text-green-700' : 'text-red-600'}`}>
                {d.pass ? 'Pass' : 'Fail'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdmetCard;
