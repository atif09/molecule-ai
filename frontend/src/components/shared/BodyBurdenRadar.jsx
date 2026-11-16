import React, { useState } from 'react';
import { TAG_LABEL } from './polyTheme.js';

// Geometry mirrors LipinskiRadarChart.jsx (viewBox 400, centre 200/200, radius 140, rings 0.33/0.66/1.0)
const CX = 200;
const CY = 200;
const MAXR = 140;
const RINGS = [0.33, 0.66, 1.0];

const getXY = (angle, r) => {
  const rad = (angle * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
};

const BodyBurdenRadar = ({ burden }) => {
  const [hovered, setHovered] = useState(null);
  const n = burden.length;
  const axes = burden.map((b, i) => ({ ...b, angle: -90 + (i * 360) / n }));
  const poly = axes.map((a) => getXY(a.angle, (a.score / 100) * MAXR)).map((p) => `${p.x},${p.y}`).join(' ');
  const top = [...burden].sort((a, b) => b.score - a.score).filter((b) => b.score > 0).slice(0, 3);
  const hv = hovered != null ? axes[hovered] : null;
  const tipLines = hv
    ? (hv.contributors.length
        ? hv.contributors.map((c) => `${c.drug} — ${TAG_LABEL[c.tag] || c.tag}`)
        : ['No contributors'])
    : [];
  const tipW = 230;
  const tipH = 22 + tipLines.length * 13;
  const tipX = CX - tipW / 2;

  return (
    <div className="bg-white border border-black p-5 h-full flex flex-col">
      <p className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold">03 · Body Burden</p>
      <p className="font-mono text-[11px] text-gray-400 mt-0.5 mb-3">Organ systems loaded by the combination</p>

      <div className="w-full max-w-[360px] mx-auto">
        <svg viewBox="-40 -10 480 420" className="w-full overflow-visible">
          {RINGS.map((lvl) => (
            <polygon key={lvl} fill="none" stroke="#e5e7eb" strokeWidth="1"
              points={axes.map((a) => getXY(a.angle, lvl * MAXR)).map((p) => `${p.x},${p.y}`).join(' ')} />
          ))}
          {axes.map((a) => {
            const e = getXY(a.angle, MAXR);
            return <line key={a.system} x1={CX} y1={CY} x2={e.x} y2={e.y} stroke="#e5e7eb" strokeWidth="1" />;
          })}
          <polygon points={poly} fill="rgba(220,38,38,0.12)" stroke="#dc2626" strokeWidth="2" />
          {axes.map((a) => {
            const p = getXY(a.angle, (a.score / 100) * MAXR);
            return <circle key={a.system} cx={p.x} cy={p.y} r="4" fill="#dc2626" stroke="white" strokeWidth="2" />;
          })}
          {axes.map((a, i) => {
            const p = getXY(a.angle, MAXR + 28);
            const end = getXY(a.angle, MAXR + 20);
            const anchor = Math.abs(p.x - CX) < 8 ? 'middle' : p.x > CX ? 'start' : 'end';
            return (
              <g key={a.system} style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
                <line x1={CX} y1={CY} x2={end.x} y2={end.y} stroke="transparent" strokeWidth="28" />
                <text x={p.x} y={p.y - 2} textAnchor={anchor} fill="#111827" fontSize="12" fontWeight="600" fontFamily="monospace">
                  {a.system.toUpperCase()}
                </text>
                <text x={p.x} y={p.y + 12} textAnchor={anchor} fill="#6b7280" fontSize="11" fontFamily="monospace">{a.score}</text>
              </g>
            );
          })}
          {hv && (
            <g pointerEvents="none">
              <rect x={tipX} y={CY - tipH / 2} width={tipW} height={tipH} fill="white" stroke="#d1d5db" />
              <text x={tipX + 6} y={CY - tipH / 2 + 14} fontSize="10" fontWeight="bold" fontFamily="monospace" fill="#111827">
                {hv.label}: {hv.score}
              </text>
              {tipLines.map((l, i) => (
                <text key={i} x={tipX + 6} y={CY - tipH / 2 + 28 + i * 13} fontSize="9" fontFamily="monospace" fill="#374151">{l}</text>
              ))}
            </g>
          )}
        </svg>
      </div>

      <div className="mt-2 space-y-2">
        {top.length === 0 && <p className="font-mono text-xs text-gray-400">No organ-system load from curated data.</p>}
        {top.map((b) => (
          <div key={b.system}>
            <div className="flex justify-between font-mono text-[11px] text-gray-600 mb-1">
              <span>{b.label}</span><span className="font-bold">{b.score}</span>
            </div>
            <div className="h-1.5 bg-gray-100 border border-gray-200">
              <div className="h-full" style={{ width: `${b.score}%`, backgroundColor: '#dc2626' }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-auto pt-3 font-mono text-[11px] text-gray-400">relative index, not dose-adjusted</p>
    </div>
  );
};

export default BodyBurdenRadar;
