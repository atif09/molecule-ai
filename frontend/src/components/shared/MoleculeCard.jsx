import React, { useState, useEffect } from 'react';
import MoleculeViewer3D from './MoleculeViewer3D';
import { API_BASE } from '../../config';

const MoleculeCard = ({ moleculeData }) => {
  const [sdfData, setSdfData] = useState(null);
  const [is3DLoading, setIs3DLoading] = useState(false);

  useEffect(() => {
    if (moleculeData?.canonical_smiles) {
      fetch3DStructure(moleculeData.canonical_smiles);
    }
  }, [moleculeData?.canonical_smiles]);

  const fetch3DStructure = async (smiles) => {
    setIs3DLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/structure/3d`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smiles }),
      });
      if (response.ok) {
        const data = await response.json();
        setSdfData(data.sdf || '');
      }
    } catch (error) {
      console.error('Failed to fetch 3D structure:', error);
    } finally {
      setIs3DLoading(false);
    }
  };

  return (
    <div className="bg-white border border-black p-6 flex flex-col flex-1 h-full">
      <div className="flex items-center justify-between mb-6">
        <span className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold">01 · Molecular Identity</span>
        <span className="w-8 h-8 border border-black flex items-center justify-center text-gray-400">
          <span className="material-symbols-outlined text-[18px]">fingerprint</span>
        </span>
      </div>

      <div className="flex-1 space-y-5">
        {/* SMILES */}
        <div>
          <label className="font-mono text-xs text-gray-500 mb-2 block uppercase tracking-widest font-semibold">SMILES Notation</label>
          <div className="bg-gray-50 border border-gray-200 p-3 font-mono text-xs text-gray-700 break-all leading-relaxed">
            {moleculeData?.canonical_smiles || 'N/A'}
          </div>
        </div>

        {/* 3D viewer */}
        <div>
          <label className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2 block">
            3D Conformation
          </label>
          <div className="group relative border border-black bg-white hover:bg-gray-50 transition-colors duration-300 overflow-hidden">
            <MoleculeViewer3D sdfData={sdfData} isLoading={is3DLoading} />
            {sdfData && !is3DLoading && (
              <div className="absolute inset-0 bg-gray-100/0 group-hover:bg-gray-100/20 transition-colors duration-300 pointer-events-none" />
            )}
          </div>
        </div>

        {/* Molecular weight bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold">Molecular Weight</label>
            <span className="font-mono text-xs text-black font-bold">
              {moleculeData?.molecular_weight ? `${moleculeData.molecular_weight.toFixed(1)} g/mol` : '—'}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 border border-gray-200">
            <div
              className="h-full bg-black transition-all duration-1000"
              style={{ width: `${Math.min((moleculeData?.molecular_weight || 0) / 5, 100)}%` }}
            />
          </div>
        </div>

        {/* QED + SA Score */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-mono text-[11px] text-gray-500 uppercase tracking-widest font-semibold">QED Score</label>
              <span className="font-mono text-xs text-black font-bold">{(moleculeData?.qed_score || 0).toFixed(2)}</span>
            </div>
            <div className="h-1.5 bg-gray-100 border border-gray-200">
              <div
                className="h-full bg-black transition-all duration-1000"
                style={{ width: `${(moleculeData?.qed_score || 0) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-mono text-[11px] text-gray-500 uppercase tracking-widest font-semibold">SA Score</label>
              <span className="font-mono text-xs text-black font-bold">{(moleculeData?.sa_score || 0).toFixed(1)}</span>
            </div>
            <div className="h-1.5 bg-gray-100 border border-gray-200">
              <div
                className="h-full bg-gray-500 transition-all duration-1000"
                style={{ width: `${(10 - (moleculeData?.sa_score || 5)) * 10}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <button className="mt-6 w-full border border-black py-2.5 text-black font-mono text-xs tracking-widest hover:bg-black hover:text-white transition-all uppercase font-bold">
        Run Structural Audit
      </button>
    </div>
  );
};

export default MoleculeCard;
