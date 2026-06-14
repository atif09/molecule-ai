import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as $3Dmol from '3dmol';

const PHARMACOPHORE_MAP = {
  O:  { group: 'H-Bond Acceptor', detail: 'Oxygen accepts H-bonds via lone pairs', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  N:  { group: 'H-Bond Donor / Acceptor', detail: 'Nitrogen donates or accepts H-bonds', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  F:  { group: 'Halogen / H-Bond Acceptor', detail: 'Fluorine increases metabolic stability', color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
  Cl: { group: 'Halogen Bond Donor', detail: 'Chlorine engages in halogen bonding with targets', color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
  Br: { group: 'Halogen Bond Donor', detail: 'Bromine is a strong halogen bond donor', color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
  I:  { group: 'Halogen Bond Donor', detail: 'Iodine — strongest halogen bond donor', color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
  S:  { group: 'Sulfur Center', detail: 'May form covalent bonds with cysteine residues', color: '#eab308', bg: '#fefce8', border: '#fef08a' },
  P:  { group: 'Phosphorus Center', detail: 'Often found in phosphate mimetics', color: '#eab308', bg: '#fefce8', border: '#fef08a' },
  C:  { group: 'Hydrophobic Carbon', detail: 'Contributes to hydrophobic pocket interactions', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
  H:  { group: 'Hydrogen', detail: 'May donate H-bonds if on N or O', color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb' },
};

function getElementsInSdf(sdfData) {
  const found = new Set();
  const lines = sdfData.split('\n');
  const atomCount = parseInt((lines[3] || '').substring(0, 3).trim(), 10) || 0;
  for (let i = 4; i < 4 + atomCount && i < lines.length; i++) {
    const parts = lines[i].trim().split(/\s+/);
    if (parts.length >= 4) found.add(parts[3]);
  }
  return found;
}

const LEGEND = [
  { color: 'bg-blue-500', label: 'H-Bond Acceptor/Donor', elems: 'N, O' },
  { color: 'bg-green-500', label: 'Halogen Bond Donor', elems: 'F, Cl, Br, I' },
  { color: 'bg-yellow-500', label: 'Reactive Center', elems: 'S, P' },
];

const MoleculeViewer3D = ({ sdfData, isLoading }) => {
  const viewerRef = useRef(null);
  const viewerInstanceRef = useRef(null);
  const containerRef = useRef(null);
  const [showPharmacophores, setShowPharmacophores] = useState(false);
  const [presentElems, setPresentElems] = useState(new Set());
  const [tooltip, setTooltip] = useState(null); // { x, y, elem, info }

  const applyStyles = useCallback((viewer, pharmOn) => {
    viewer.setStyle({}, {
      stick: { radius: 0.15, colorscheme: 'Jmol' },
      sphere: { scale: 0.25, colorscheme: 'Jmol' }
    });
    viewer.removeAllLabels();

    if (pharmOn) {
      // Blue glow — H-bond donors/acceptors
      ['O', 'N'].forEach(elem => {
        viewer.addStyle({ elem }, { sphere: { color: '#3b82f6', opacity: 0.4, radius: 0.7 } });
      });
      // Green glow — halogens
      ['F', 'Cl', 'Br', 'I'].forEach(elem => {
        viewer.addStyle({ elem }, { sphere: { color: '#22c55e', opacity: 0.4, radius: 0.7 } });
      });
      // Yellow glow — S/P
      ['S', 'P'].forEach(elem => {
        viewer.addStyle({ elem }, { sphere: { color: '#eab308', opacity: 0.4, radius: 0.7 } });
      });
    }

    viewer.render();
  }, []);

  useEffect(() => {
    let observer = null;
    if (!viewerRef.current || !sdfData || isLoading) return;

    while (viewerRef.current.firstChild) {
      viewerRef.current.removeChild(viewerRef.current.firstChild);
    }

    const viewer = $3Dmol.createViewer(viewerRef.current, { backgroundColor: '#ffffff' });
    viewerInstanceRef.current = viewer;

    try {
      viewer.addModel(sdfData, 'sdf');
      applyStyles(viewer, false);
      viewer.zoomTo();
      viewer.render();
      viewer.spin('y', 0.5);

      setPresentElems(getElementsInSdf(sdfData));

      // Stop spin on mouseenter so hover events work, resume on mouseleave
      const canvasEl = viewerRef.current;
      const onMouseEnter = () => viewer.stopAnimate();
      const onMouseLeave = () => {
        setTooltip(null);
        viewer.spin('y', 0.5);
      };
      const onMouseMove = (e) => {
        const rect = canvasEl.getBoundingClientRect();
        setTooltip(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
      };
      canvasEl.addEventListener('mouseenter', onMouseEnter);
      canvasEl.addEventListener('mouseleave', onMouseLeave);
      canvasEl.addEventListener('mousemove', onMouseMove);

      // Hover — works once spin is stopped
      viewer.setHoverable({}, true,
        (atom, v, event) => {
          const info = PHARMACOPHORE_MAP[atom.elem];
          if (!info || !canvasEl) return;
          const rect = canvasEl.getBoundingClientRect();
          const x = (event?.clientX ?? 0) - rect.left;
          const y = (event?.clientY ?? 0) - rect.top;
          setTooltip({ x, y, elem: atom.elem, info });
        },
        () => setTooltip(null)
      );
      viewer.render();

      observer = new ResizeObserver(() => { viewer.resize(); viewer.render(); });
      observer.observe(viewerRef.current);
    } catch (err) {
      console.error('3Dmol error:', err);
    }

    return () => {
      if (observer) observer.disconnect();
      viewer.clear();
      viewerInstanceRef.current = null;
      setShowPharmacophores(false);
      setTooltip(null);
    };
  }, [sdfData, isLoading, applyStyles]);

  useEffect(() => {
    const viewer = viewerInstanceRef.current;
    if (viewer) applyStyles(viewer, showPharmacophores);
  }, [showPharmacophores, applyStyles]);

  if (isLoading) {
    return (
      <div className="w-full h-[280px] bg-gray-50 border border-gray-200 animate-pulse flex items-center justify-center">
        <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">Initialising 3D environment...</span>
      </div>
    );
  }

  if (!sdfData) {
    return (
      <div className="w-full h-[280px] bg-gray-50 border border-gray-200 flex items-center justify-center">
        <span className="text-[13px] text-gray-400 font-medium">3D structure unavailable</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Viewer with hover tooltip */}
      <div ref={containerRef} className="relative w-full h-[280px] bg-white overflow-hidden border border-gray-200">
        <div ref={viewerRef} className="w-full h-full" />

        {/* Hover tooltip */}
        {tooltip && (
          <div
            className="absolute pointer-events-none z-20 transition-opacity duration-150"
            style={{ left: tooltip.x + 14, top: tooltip.y - 60 }}
          >
            {/* Arrow */}
            <div className="relative">
              <div
                className="px-3 py-2 border text-left shadow-md"
                style={{
                  background: tooltip.info.bg,
                  borderColor: tooltip.info.border,
                  minWidth: 180,
                }}
              >
                <div className="font-mono text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: tooltip.info.color }}>
                  {tooltip.elem} · {tooltip.info.group}
                </div>
                <div className="font-mono text-[10px] text-gray-500 leading-relaxed">
                  {tooltip.info.detail}
                </div>
              </div>
              {/* Arrow tip pointing down-left */}
              <div
                className="absolute -bottom-[6px] left-3 w-3 h-3 rotate-45 border-b border-r"
                style={{ background: tooltip.info.bg, borderColor: tooltip.info.border }}
              />
            </div>
          </div>
        )}

        {/* Hint text when pharmacophores off */}
        {!showPharmacophores && (
          <div className="absolute bottom-2 left-2 pointer-events-none">
            <span className="font-mono text-[9px] text-gray-300 uppercase tracking-widest">Hover atoms to identify groups</span>
          </div>
        )}
      </div>

      {/* Controls row */}
      <div className="flex items-start justify-between mt-2 gap-4">
        {/* Legend */}
        <div className="flex flex-col gap-1.5">
          {showPharmacophores
            ? LEGEND.filter(l => l.elems.split(', ').some(e => presentElems.has(e))).map(l => (
                <div key={l.label} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${l.color}`} />
                  <span className="font-mono text-[10px] text-gray-700 font-semibold">{l.label}</span>
                  <span className="font-mono text-[10px] text-gray-400">{l.elems}</span>
                </div>
              ))
            : <span className="font-mono text-[10px] text-gray-400">Toggle pharmacophore highlights to see binding-relevant regions</span>
          }
        </div>

        <button
          onClick={() => setShowPharmacophores(v => !v)}
          className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border transition-colors shrink-0 ${
            showPharmacophores
              ? 'bg-black text-white border-black'
              : 'bg-white text-black border-black hover:bg-black hover:text-white'
          }`}
        >
          {showPharmacophores ? 'Hide Pharmacophores' : 'Show Pharmacophores'}
        </button>
      </div>
    </div>
  );
};

export default MoleculeViewer3D;
