import React from 'react';
import { ZONE_COLOR, ZONE_LABEL } from './polyTheme.js';

const yn = (v) => (v ? 'Yes' : 'No');

const MedicationTable = ({ medications }) => (
  <div className="bg-white border border-black p-5 w-full">
    <p className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold">07 · Medications</p>
    <p className="font-mono text-[11px] text-gray-400 mt-0.5 mb-4">ADMET score is a model estimate, not clinical evidence.</p>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-mono text-xs min-w-[760px]">
        <thead>
          <tr className="text-left text-gray-500 uppercase tracking-widest border-b border-black">
            {['#', 'Name', 'Class', 'BOILED-Egg', 'ADMET', 'Narrow TI', 'Beers flag', 'In KB'].map((h) => (
              <th key={h} className="p-2 font-semibold whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {medications.map((m) => (
            <tr key={m.index} className="border-b border-gray-100 align-top">
              <td className="p-2 font-bold">{m.index}</td>
              <td className="p-2">
                <span className="font-bold text-black">{m.name}</span>
                {m.input.trim().toLowerCase() !== m.name && <span className="block text-gray-400">{m.input}</span>}
              </td>
              <td className="p-2 text-gray-600">{m.drug_class ? m.drug_class.replace(/_/g, ' ') : '—'}</td>
              <td className="p-2 whitespace-nowrap">
                <span className="inline-block w-2 h-2 mr-1.5" style={{ background: ZONE_COLOR[m.boiled_egg.zone], borderRadius: '50%' }} />
                {ZONE_LABEL[m.boiled_egg.zone]}
              </td>
              <td className="p-2">{m.admet.overall_admet_score.toFixed(0)}</td>
              <td className="p-2">{m.in_kb ? yn(m.narrow_therapeutic_index) : '—'}</td>
              <td className="p-2 text-gray-600 max-w-[16rem]">{m.beers_flag || '—'}</td>
              <td className={`p-2 font-bold ${m.in_kb ? 'text-green-700' : 'text-amber-700'}`}>{yn(m.in_kb)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default MedicationTable;
