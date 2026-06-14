import React, { useState } from 'react';

// BOILED-Egg model — Daina & Zoete, 2016
const PLOT = { w: 400, h: 280, ml: 48, mr: 20, mt: 20, mb: 44 };
const X_RANGE = [0, 200];
const Y_RANGE = [-4, 8];

function toSvgX(tpsa) {
  const frac = (tpsa - X_RANGE[0]) / (X_RANGE[1] - X_RANGE[0]);
  return PLOT.ml + frac * (PLOT.w - PLOT.ml - PLOT.mr);
}
function toSvgY(logp) {
  const frac = (logp - Y_RANGE[0]) / (Y_RANGE[1] - Y_RANGE[0]);
  return PLOT.h - PLOT.mb - frac * (PLOT.h - PLOT.mt - PLOT.mb);
}
const scaleX = (v) => (v / (X_RANGE[1] - X_RANGE[0])) * (PLOT.w - PLOT.ml - PLOT.mr);
const scaleY = (v) => (v / (Y_RANGE[1] - Y_RANGE[0])) * (PLOT.h - PLOT.mt - PLOT.mb);

const HIA = { cx: 71.3, cy: 2.4, rx: 71, ry: 3.1 };
const BBB = { cx: 38.1, cy: 1.8, rx: 40, ry: 1.8 };

function isInsideEllipse(tpsa, logp, e) {
  const dx = (tpsa - e.cx) / e.rx;
  const dy = (logp - e.cy) / e.ry;
  return dx * dx + dy * dy <= 1;
}

const XTicks = [0, 50, 100, 150, 200];
const YTicks = [-4, -2, 0, 2, 4, 6, 8];

const BoiledEggPlot = ({ descriptors }) => {
  const [hovered, setHovered] = useState(false);
  const tpsa = descriptors?.TPSA ?? 0;
  const logp = descriptors?.LogP ?? 0;

  const inBBB = isInsideEllipse(tpsa, logp, BBB);
  const inHIA = isInsideEllipse(tpsa, logp, HIA);

  let zone, dotColor, zoneDesc, zoneBadgeStyle;
  if (inBBB) {
    zone = 'BBB Penetrant';
    dotColor = '#d97706';
    zoneDesc = 'Likely to cross the blood-brain barrier — suitable for CNS drugs';
    zoneBadgeStyle = { color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a' };
  } else if (inHIA) {
    zone = 'Orally Absorbed';
    dotColor = '#374151';
    zoneDesc = 'Good intestinal absorption predicted — suitable for oral dosing';
    zoneBadgeStyle = { color: '#374151', background: '#f9fafb', border: '1px solid #d1d5db' };
  } else {
    zone = 'Poor Bioavailability';
    dotColor = '#dc2626';
    zoneDesc = 'Outside drug-like space — poor oral or CNS bioavailability predicted';
    zoneBadgeStyle = { color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca' };
  }

  const dotX = toSvgX(Math.min(Math.max(tpsa, X_RANGE[0]), X_RANGE[1]));
  const dotY = toSvgY(Math.min(Math.max(logp, Y_RANGE[0]), Y_RANGE[1]));

  return (
    <div className="border border-black bg-white p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold">
            BOILED-Egg Model
          </p>
          <p className="font-mono text-[11px] text-gray-400 mt-0.5">
            Bioavailability & BBB Prediction
          </p>
        </div>
        <span
          className="font-mono text-xs font-bold px-3 py-1 border"
          style={zoneBadgeStyle}
        >
          {zone}
        </span>
      </div>

      <svg width="100%" viewBox={`0 0 ${PLOT.w} ${PLOT.h}`} className="overflow-visible">
        {/* Plot background */}
        <rect
          x={PLOT.ml} y={PLOT.mt}
          width={PLOT.w - PLOT.ml - PLOT.mr}
          height={PLOT.h - PLOT.mt - PLOT.mb}
          fill="#f9fafb"
        />
        {/* Border */}
        <rect
          x={PLOT.ml} y={PLOT.mt}
          width={PLOT.w - PLOT.ml - PLOT.mr}
          height={PLOT.h - PLOT.mt - PLOT.mb}
          fill="none" stroke="#e5e7eb" strokeWidth="1"
        />

        {/* Grid lines */}
        {XTicks.map(v => (
          <line key={`xg${v}`}
            x1={toSvgX(v)} y1={PLOT.mt}
            x2={toSvgX(v)} y2={PLOT.h - PLOT.mb}
            stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="3,3"
          />
        ))}
        {YTicks.map(v => (
          <line key={`yg${v}`}
            x1={PLOT.ml} y1={toSvgY(v)}
            x2={PLOT.w - PLOT.mr} y2={toSvgY(v)}
            stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="3,3"
          />
        ))}

        {/* HIA ellipse (egg white zone) */}
        <ellipse
          cx={toSvgX(HIA.cx)} cy={toSvgY(HIA.cy)}
          rx={scaleX(HIA.rx)} ry={scaleY(HIA.ry)}
          fill="rgba(0,0,0,0.04)"
          stroke="rgba(0,0,0,0.20)"
          strokeWidth="1.5"
        />

        {/* BBB ellipse (yolk zone) */}
        <ellipse
          cx={toSvgX(BBB.cx)} cy={toSvgY(BBB.cy)}
          rx={scaleX(BBB.rx)} ry={scaleY(BBB.ry)}
          fill="rgba(217,119,6,0.15)"
          stroke="rgba(180,83,9,0.45)"
          strokeWidth="1.5"
        />

        {/* X ticks */}
        {XTicks.map(v => (
          <g key={`xt${v}`}>
            <line x1={toSvgX(v)} y1={PLOT.h - PLOT.mb} x2={toSvgX(v)} y2={PLOT.h - PLOT.mb + 4} stroke="#9ca3af" strokeWidth="1" />
            <text x={toSvgX(v)} y={PLOT.h - PLOT.mb + 14} textAnchor="middle" fill="#6b7280" fontSize="9" fontFamily="monospace">{v}</text>
          </g>
        ))}

        {/* Y ticks */}
        {YTicks.map(v => (
          <g key={`yt${v}`}>
            <line x1={PLOT.ml - 4} y1={toSvgY(v)} x2={PLOT.ml} y2={toSvgY(v)} stroke="#9ca3af" strokeWidth="1" />
            <text x={PLOT.ml - 7} y={toSvgY(v) + 3} textAnchor="end" fill="#6b7280" fontSize="9" fontFamily="monospace">{v}</text>
          </g>
        ))}

        {/* Axis labels */}
        <text x={PLOT.ml + (PLOT.w - PLOT.ml - PLOT.mr) / 2} y={PLOT.h - 4} textAnchor="middle" fill="#6b7280" fontSize="10" fontFamily="monospace">
          TPSA (Å²)
        </text>
        <text
          x={10}
          y={PLOT.mt + (PLOT.h - PLOT.mt - PLOT.mb) / 2}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="10"
          fontFamily="monospace"
          transform={`rotate(-90, 10, ${PLOT.mt + (PLOT.h - PLOT.mt - PLOT.mb) / 2})`}
        >
          LogP
        </text>

        {/* Zone labels */}
        <text x={toSvgX(130)} y={toSvgY(4.5)} textAnchor="middle" fill="rgba(0,0,0,0.25)" fontSize="8" fontFamily="monospace">HIA</text>
        <text x={toSvgX(38)} y={toSvgY(3.0)} textAnchor="middle" fill="rgba(180,83,9,0.55)" fontSize="8" fontFamily="monospace">BBB</text>

        {/* Molecule dot */}
        <circle
          cx={dotX} cy={dotY} r={7}
          fill={dotColor}
          stroke="white"
          strokeWidth="2"
          style={{ cursor: 'pointer', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        />

        {/* Tooltip */}
        {hovered && (
          <g>
            <rect x={dotX + 10} y={dotY - 24} width={116} height={38} fill="white" stroke="#d1d5db" strokeWidth="1" />
            <text x={dotX + 16} y={dotY - 9} fill="#111827" fontSize="9" fontFamily="monospace">TPSA: {tpsa.toFixed(1)} Å²</text>
            <text x={dotX + 16} y={dotY + 5} fill="#111827" fontSize="9" fontFamily="monospace">LogP: {logp.toFixed(2)}</text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-4 text-[11px] font-mono text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 border border-gray-300 bg-gray-100 inline-block" />
          HIA zone (oral absorption)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 border border-amber-400 bg-amber-100 inline-block" />
          BBB zone (CNS penetrant)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 inline-block border border-gray-300" style={{ background: dotColor }} />
          This molecule
        </div>
      </div>

      <p className="mt-3 font-mono text-xs text-gray-500 border-t border-gray-100 pt-3">
        {zoneDesc}
      </p>
    </div>
  );
};

export default BoiledEggPlot;
