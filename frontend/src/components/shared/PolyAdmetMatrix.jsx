import React from 'react';

const COLS = [
  { key: 'absorption', label: 'Absorption', pass: 'Pass', fail: 'Fail' },
  { key: 'distribution', label: 'Distribution', pass: 'Pass', fail: 'Fail' },
  { key: 'metabolism', label: 'Metabolism', pass: 'Pass', fail: 'Fail' },
  { key: 'excretion', label: 'Excretion', pass: 'Pass', fail: 'Fail' },
  { key: 'toxicity', label: 'Toxicity', pass: 'Safe', fail: 'Toxic' },
];

const PolyAdmetMatrix = ({ medications }) => {
  const fails = COLS.map((c) => medications.filter((m) => !m.admet[c.key].pass).length);

  return (
    <div className="bg-white border border-black p-5 h-full flex flex-col">
      <p className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold">05 · Combined ADMET</p>
      <p className="font-mono text-[11px] text-gray-400 mt-0.5 mb-3">Model estimates (trained on synthetic data), not clinical evidence.</p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-[11px]">
          <thead>
            <tr className="text-gray-500 uppercase tracking-widest">
              <th className="text-left p-2 font-semibold">Drug</th>
              {COLS.map((c) => <th key={c.key} className="p-2 font-semibold">{c.label.slice(0, 3)}</th>)}
              <th className="p-2 font-semibold">Score</th>
            </tr>
          </thead>
          <tbody>
            {medications.map((m) => (
              <tr key={m.index}>
                <td className="p-2 text-black whitespace-nowrap"><b>{m.index}</b> {m.name}</td>
                {COLS.map((c) => {
                  const ok = m.admet[c.key].pass;
                  return (
                    <td key={c.key} className="p-1">
                      <div className={`border px-1.5 py-1 text-center font-bold uppercase ${
                        ok ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-600'
                      }`}>
                        {ok ? c.pass : c.fail}
                      </div>
                    </td>
                  );
                })}
                <td className="p-2 text-center font-bold text-black">{m.admet.overall_admet_score.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-black text-gray-600">
              <td className="p-2 uppercase tracking-widest">Fails</td>
              {fails.map((f, i) => (
                <td key={COLS[i].key} className={`p-2 text-center font-bold ${f ? 'text-red-600' : 'text-green-700'}`}>{f}</td>
              ))}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mt-auto pt-3 font-mono text-[11px] text-gray-400">Abs · Dis · Met · Exc · Tox — Safe/Toxic applies to toxicity.</p>
    </div>
  );
};

export default PolyAdmetMatrix;
