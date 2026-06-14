import React, { useRef } from 'react';
import { Editor } from 'ketcher-react';
import { StandaloneStructServiceProvider } from 'ketcher-standalone';
import 'ketcher-react/dist/index.css';

const structServiceProvider = new StandaloneStructServiceProvider();

const StructureDrawer = ({ onClose, onAnalyze }) => {
  const ketcherRef = useRef(null);

  const handleAnalyze = async () => {
    if (!ketcherRef.current) return;
    try {
      const smiles = await ketcherRef.current.getSmiles();
      if (!smiles || smiles.trim() === '') {
        alert('Please draw a molecule first.');
        return;
      }
      onAnalyze(smiles.trim());
      onClose();
    } catch (e) {
      console.error('Failed to get SMILES from Ketcher:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1c1b1d] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col"
        style={{ width: '860px', height: '620px' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-400">
              Structure Drawing Input
            </p>
            <p className="font-mono text-[10px] text-neutral-600 mt-0.5">
              Draw your molecule — SMILES is extracted automatically
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              className="px-6 py-2 bg-white text-black font-mono text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all rounded"
            >
              Analyze →
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-white/20 font-mono text-[11px] uppercase tracking-widest text-neutral-400 hover:text-white hover:border-white/40 transition-all rounded"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Ketcher editor */}
        <div className="flex-1 min-h-0">
          <Editor
            staticResourcesUrl=""
            structServiceProvider={structServiceProvider}
            onInit={(ketcher) => {
              ketcherRef.current = ketcher;
              window._ketcher = ketcher;
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default StructureDrawer;
