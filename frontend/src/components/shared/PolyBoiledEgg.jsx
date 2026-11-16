import React, { useState } from 'react';
import { ZONE_COLOR, ZONE_LABEL } from './polyTheme.js';

// Geometry copied from BoiledEggPlot.jsx (Daina & Zoete, 2016). Not imported on purpose.
const PLOT = { w: 400, h: 280, ml: 48, mr: 20, mt: 20, mb: 44 };
const X_RANGE = [0, 200];
const Y_RANGE = [-4, 8];

const toSvgX = (tpsa) => PLOT.ml + ((tpsa - X_RANGE[0]) / (X_RANGE[1] - X_RANGE[0])) * (PLOT.w - PLOT.ml - PLOT.mr);
const toSvgY = (logp) => PLOT.h - PLOT.mb - ((logp - Y_RANGE[0]) / (Y_RANGE[1] - Y_RANGE[0])) * (PLOT.h - PLOT.mt - PLOT.mb);
const scaleX = (v) => (v / (X_RANGE[1] - X_RANGE[0])) * (PLOT.w - PLOT.ml - PLOT.mr);
const scaleY = (v) => (v / (Y_RANGE[1] - Y_RANGE[0])) * (PLOT.h - PLOT.mt - PLOT.mb);

const HIA = { cx: 71.3, cy: 2.4, rx: 71, ry: 3.1 };
const BBB = { cx: 38.1, cy: 1.8, rx: 40, ry: 1.8 };
const XTicks = [0, 50, 100, 150, 200];
const YTicks = [-4, -2, 0, 2, 4, 6, 8];
const clamp = (v, [lo, hi]) => Math.min(Math.max(v, lo), hi);

const R = 8;

const PolyBoiledEgg = ({ medications, summary }) => {
  const [hovered, setHovered] = useState(null);

  // Clamp to axes, then spread overlapping points deterministically around their shared position.
  const base = medications.map((m) => ({
    m,
    x: toSvgX(clamp(m.boiled_egg.tpsa, X_RANGE)),
    y: toSvgY(clamp(m.boiled_egg.logp, Y_RANGE)),
  }));
  const points = base.map((p) => {
    const group = base.filter((q) => Math.hypot(q.x - p.x, q.y - p.y) < R * 1.6);
    if (group.length === 1) return { ...p, group: [p.m.index], jx: 0, jy: 0 };
    const pos = group.findIndex((q) => q.m.index === p.m.index);
    const angle = (2 * Math.PI * pos) / group.length;
    return {
      ...p,
      group: group.map((q) => q.m.index),
      jx: Math.cos(angle) * R * 0.9,
      jy: Math.sin(angle) * R * 0.9,
    };
  });

  const hp = hovered != null ? points.find((p) => p.m.index === hovered) : null;
  const tipW = 150;
  const tipH = 56 + (hp && hp.group.length > 1 ? 14 : 0);

  return (
    <div className="bg-white border border-black p-5 h-full flex flex-col">
      <p className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold">
        02 · Combined BOILED-Egg
      </p>
      <p className="font-mono text-[11px] text-gray-400 mt-0.5 mb-3">Bioavailability & BBB prediction, all medicines</p>

      <svg width="100%" viewBox={`0 0 ${PLOT.w} ${PLOT.h}`} className="overflow-visible">
        <rect x={PLOT.ml} y={PLOT.mt} width={PLOT.w - PLOT.ml - PLOT.mr} height={PLOT.h - PLOT.mt - PLOT.mb} fill="#f9fafb" />
        <rect x={PLOT.ml} y={PLOT.mt} width={PLOT.w - PLOT.ml - PLOT.mr} height={PLOT.h - PLOT.mt - PLOT.mb} fill="none" stroke="#e5e7eb" strokeWidth="1" />
        {XTicks.map((v) => (
          <line key={`xg${v}`} x1={toSvgX(v)} y1={PLOT.mt} x2={toSvgX(v)} y2={PLOT.h - PLOT.mb} stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="3,3" />
        ))}
        {YTicks.map((v) => (
          <line key={`yg${v}`} x1={PLOT.ml} y1={toSvgY(v)} x2={PLOT.w - PLOT.mr} y2={toSvgY(v)} stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="3,3" />
        ))}
        <ellipse cx={toSvgX(HIA.cx)} cy={toSvgY(HIA.cy)} rx={scaleX(HIA.rx)} ry={scaleY(HIA.ry)} fill="rgba(0,0,0,0.04)" stroke="rgba(0,0,0,0.20)" strokeWidth="1.5" />
        <ellipse cx={toSvgX(BBB.cx)} cy={toSvgY(BBB.cy)} rx={scaleX(BBB.rx)} ry={scaleY(BBB.ry)} fill="rgba(217,119,6,0.15)" stroke="rgba(180,83,9,0.45)" strokeWidth="1.5" />
        {XTicks.map((v) => (
          <g key={`xt${v}`}>
            <line x1={toSvgX(v)} y1={PLOT.h - PLOT.mb} x2={toSvgX(v)} y2={PLOT.h - PLOT.mb + 4} stroke="#9ca3af" strokeWidth="1" />
            <text x={toSvgX(v)} y={PLOT.h - PLOT.mb + 14} textAnchor="middle" fill="#6b7280" fontSize="9" fontFamily="monospace">{v}</text>
          </g>
        ))}
        {YTicks.map((v) => (
          <g key={`yt${v}`}>
            <line x1={PLOT.ml - 4} y1={toSvgY(v)} x2={PLOT.ml} y2={toSvgY(v)} stroke="#9ca3af" strokeWidth="1" />
            <text x={PLOT.ml - 7} y={toSvgY(v) + 3} textAnchor="end" fill="#6b7280" fontSize="9" fontFamily="monospace">{v}</text>
          </g>
        ))}
        <text x={PLOT.ml + (PLOT.w - PLOT.ml - PLOT.mr) / 2} y={PLOT.h - 4} textAnchor="middle" fill="#6b7280" fontSize="10" fontFamily="monospace">TPSA (Å²)</text>
        <text x={10} y={PLOT.mt + (PLOT.h - PLOT.mt - PLOT.mb) / 2} textAnchor="middle" fill="#6b7280" fontSize="10" fontFamily="monospace"
          transform={`rotate(-90, 10, ${PLOT.mt + (PLOT.h - PLOT.mt - PLOT.mb) / 2})`}>LogP</text>
        <text x={toSvgX(130)} y={toSvgY(4.5)} textAnchor="middle" fill="rgba(0,0,0,0.25)" fontSize="8" fontFamily="monospace">HIA</text>
        <text x={toSvgX(38)} y={toSvgY(3.0)} textAnchor="middle" fill="rgba(180,83,9,0.55)" fontSize="8" fontFamily="monospace">BBB</text>

        {points.map((p) => (
          <g
            key={p.m.index}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHovered(p.m.index)}
            onMouseLeave={() => setHovered(null)}
          >
            <circle cx={p.x + p.jx} cy={p.y + p.jy} r={R} fill={ZONE_COLOR[p.m.boiled_egg.zone]} stroke="white" strokeWidth="1.5" />
            <text x={p.x + p.jx} y={p.y + p.jy + 3.5} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="monospace" pointerEvents="none">
              {p.m.index}
            </text>
          </g>
        ))}

        {hp && (
          <g pointerEvents="none">
            <rect x={Math.min(hp.x + hp.jx + 12, PLOT.w - tipW)} y={Math.max(hp.y + hp.jy - tipH / 2, 0)} width={tipW} height={tipH} fill="white" stroke="#d1d5db" strokeWidth="1" />
            {[
              `${hp.m.index}. ${hp.m.name}`,
              `TPSA: ${hp.m.boiled_egg.tpsa.toFixed(1)} Å²`,
              `LogP: ${hp.m.boiled_egg.logp.toFixed(2)}`,
              `Zone: ${ZONE_LABEL[hp.m.boiled_egg.zone]}`,
              ...(hp.group.length > 1 ? [`Overlaps: ${hp.group.join(', ')}`] : []),
            ].map((line, i) => (
              <text
                key={i}
                x={Math.min(hp.x + hp.jx + 12, PLOT.w - tipW) + 6}
                y={Math.max(hp.y + hp.jy - tipH / 2, 0) + 13 + i * 12.5}
                fill={i === 0 ? '#111827' : '#374151'}
                fontSize="9"
                fontFamily="monospace"
                fontWeight={i === 0 ? 'bold' : 'normal'}
              >
                {line}
              </text>
            ))}
          </g>
        )}
      </svg>

      <div className="mt-3 flex flex-wrap gap-4 text-[11px] font-mono text-gray-500">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 border border-gray-300 bg-gray-100 inline-block" />HIA zone</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 border border-amber-400 bg-amber-100 inline-block" />BBB zone</div>
        <div>numbers = medicines</div>
      </div>

      <p className="mt-3 font-mono text-xs text-gray-500 border-t border-gray-100 pt-3">
        {summary.bbb} of {medications.length} medicines are predicted to cross the blood-brain barrier
        · {summary.hia} orally absorbed only · {summary.outside} outside drug-like space
      </p>
    </div>
  );
};

export default PolyBoiledEgg;
