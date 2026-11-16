import React, { useState } from 'react';
import { SEV } from './polyTheme.js';

const CELL = 36;

const InteractionMatrix = ({ matrix, medications, onCellClick }) => {
  const [hover, setHover] = useState(null);
  const n = matrix.size;
  const name = (i) => medications[i]?.name ?? `#${i + 1}`;

  return (
    <div className="bg-white border border-black p-5 h-full flex flex-col">
      <p className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold">04 · Interaction Matrix</p>
      <p className="font-mono text-[11px] text-gray-400 mt-0.5 mb-3">Highest severity per drug pair. Click a cell to jump to the finding.</p>

      <div className="overflow-x-auto">
        <table className="border-collapse mx-auto" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ width: CELL, height: CELL }} />
              {Array.from({ length: n }, (_, j) => (
                <th key={j} className="font-mono text-[11px] text-gray-500 font-semibold" style={{ width: CELL, height: CELL }}>{j + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.cells.map((row, i) => (
              <tr key={i}>
                <th className="font-mono text-[11px] text-gray-500 font-semibold" style={{ width: CELL, height: CELL }}>{i + 1}</th>
                {row.map((sev, j) => {
                  if (i === j) {
                    return (
                      <td key={j} className="border border-gray-200 bg-gray-100" style={{ width: CELL, height: CELL }} />
                    );
                  }
                  const s = sev ? SEV[sev] : null;
                  return (
                    <td
                      key={j}
                      className={`border border-gray-200 text-center font-mono text-[10px] font-bold ${sev ? 'cursor-pointer' : ''}`}
                      style={{
                        width: CELL, height: CELL,
                        background: s ? s.bg : '#fff',
                        color: s ? s.text : undefined,
                        boxShadow: hover && hover[0] === i && hover[1] === j ? 'inset 0 0 0 2px #000' : undefined,
                      }}
                      onMouseEnter={() => setHover([i, j])}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => sev && onCellClick(i, j)}
                      title={`${name(i)} × ${name(j)} — ${sev || 'no finding'}`}
                    >
                      {sev ? sev[0].toUpperCase() : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 font-mono text-xs text-gray-600 min-h-[1.25rem]">
        {hover
          ? `${name(hover[0])} × ${name(hover[1])} — ${matrix.cells[hover[0]][hover[1]] || 'no finding'}`
          : ' '}
      </p>

      <div className="mt-2 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
        {medications.map((m, i) => (
          <span key={m.index} className="font-mono text-[11px] text-gray-500">
            <b className="text-black">{i + 1}</b> {m.name}
          </span>
        ))}
      </div>
    </div>
  );
};

export default InteractionMatrix;
