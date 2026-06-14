import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './components/shared/Layout';
import HistorySidebar from './components/shared/HistorySidebar';
import LandingPage from './pages/LandingPage';
import SynthesisPage from './pages/SynthesisPage';
import LoadingGrid from './components/shared/LoadingGrid';
import MoleculeCard from './components/shared/MoleculeCard';
import BindingAffinityCard from './components/shared/BindingAffinityCard';
import AdmetCard from './components/shared/AdmetCard';
import DrugabilityCard from './components/shared/DrugabilityCard';
import ChemblCard from './components/shared/ChemblCard';
import AiInsightsCard from './components/shared/AiInsightsCard';
import RepurposingCard from './components/shared/RepurposingCard';
import ResultsGrid from './components/shared/ResultsGrid';
import AnalyzerDashboard from './pages/AnalyzerDashboard';
import AnalyzerDashboardDesktop from './pages/AnalyzerDashboardDesktop';
import MainAnalyzer from './pages/MainAnalyzer';
import MoleculeComparator from './pages/MoleculeComparator';

import { API_BASE as API_BASE_URL } from './config';
import { exportReport } from './utils/exportReport';
import StructureDrawer from './components/shared/StructureDrawer';

const EmptyHero = ({ onAnalyze, isLoading, repurposingMode, setRepurposingMode, value, setValue, onOpenDrawer }) => {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/analyze/molecules`)
      .then(res => res.json())
      .then(data => setSuggestions(data.molecules || []))
      .catch(() => {});
  }, []);

  const submit = () => value.trim() && onAnalyze(value.trim());

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center py-24 px-12 overflow-hidden bg-white">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl w-full">
        <span className="font-mono text-xs text-gray-400 uppercase tracking-[0.3em] mb-5 block font-semibold">
          QSAR Analysis Engine / Awaiting Input
        </span>
        <h1 className="text-5xl font-bold text-black tracking-tighter uppercase mb-3">
          Molecular Intelligence
        </h1>
        <p className="font-mono text-sm text-gray-500 mb-10">
          {repurposingMode
            ? 'Enter a drug molecule to identify potential new disease targets and therapeutic indications'
            : 'Enter a compound name or SMILES notation to begin structural analysis'}
        </p>

        {/* Mode toggle */}
        <div className="mb-8 flex gap-0 border border-black">
          <button
            onClick={() => setRepurposingMode(false)}
            className={`px-6 py-2 font-mono text-xs font-bold uppercase tracking-widest transition-all ${
              !repurposingMode ? 'bg-black text-white' : 'bg-white text-gray-500 hover:text-black'
            }`}
          >
            Analyze Drug
          </button>
          <button
            onClick={() => setRepurposingMode(true)}
            className={`px-6 py-2 font-mono text-xs font-bold uppercase tracking-widest transition-all border-l border-black ${
              repurposingMode ? 'bg-black text-white' : 'bg-white text-gray-500 hover:text-black'
            }`}
          >
            Find Disease Target
          </button>
        </div>

        {/* Draw structure button */}
        <div className="flex items-center gap-3 mb-4 w-full justify-center">
          <button
            onClick={() => onOpenDrawer()}
            className="flex items-center gap-2 px-4 py-2 border border-black font-mono text-xs uppercase tracking-widest text-gray-500 hover:bg-black hover:text-white transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Draw Structure
          </button>
          <span className="font-mono text-xs text-gray-300">or type below</span>
        </div>

        {/* Input box */}
        <div className="w-full flex gap-0 border border-black focus-within:ring-1 focus-within:ring-black">
          <input
            className="flex-1 bg-white text-black font-mono text-sm px-4 py-3.5 outline-none placeholder:text-gray-400 border-0"
            placeholder={repurposingMode ? 'e.g., Imatinib, Aspirin, Metformin...' : 'imatinib · warfarin · amiodarone · CC(=O)Oc1ccccc1C(=O)O'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            autoFocus
          />
          <button
            onClick={submit}
            disabled={isLoading || !value.trim()}
            className="bg-black text-white px-8 py-3.5 font-mono text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed border-l border-black whitespace-nowrap"
          >
            {isLoading ? 'Processing...' : (repurposingMode ? 'Search Targets' : 'Analyze')}
          </button>
        </div>

        {/* Quick select */}
        {!repurposingMode && suggestions.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <span className="font-mono text-xs text-gray-400 uppercase tracking-widest font-semibold self-center mr-1">Quick select:</span>
            {suggestions.map(name => (
              <button
                key={name}
                onClick={() => { setValue(name); onAnalyze(name); }}
                className="px-3 py-1.5 bg-white border border-gray-200 font-mono text-xs text-gray-500 uppercase hover:border-black hover:text-black transition-all whitespace-nowrap"
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AnalysisHeader = ({ data, onNewAnalysis, mode }) => (
  <div className="flex justify-between items-end border-b border-black pb-6 mb-8">
    <div>
      <span className="font-mono text-xs text-gray-500 tracking-widest uppercase font-semibold mb-2 block">
        {mode === 'repurposing' ? 'Repurposing Analysis' : 'Active Analysis'} / Project {String(Date.now()).slice(-4)}
      </span>
      <h1 className="text-3xl font-bold tracking-tight uppercase text-black">
        {data.molecule_name}
        {data.molecular_formula && (
          <span className="text-gray-400 font-mono text-base ml-4">
            {data.molecular_formula}
          </span>
        )}
      </h1>
    </div>
    <div className="flex items-center gap-6">
      {!data.results && (
        <>
          <div className="text-right hidden md:block">
            <p className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold mb-0.5">Molecular Weight</p>
            <p className="font-mono text-sm text-black font-bold">{data.molecular_weight?.toFixed(2)} g/mol</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold mb-0.5">Analysis ID</p>
            <p className="font-mono text-sm text-black font-bold">#MOL-{String(data.molecular_weight).replace('.', '')}</p>
          </div>
        </>
      )}
      <button
        onClick={onNewAnalysis}
        className="px-5 py-2 border border-black font-mono text-xs uppercase tracking-widest text-gray-600 hover:bg-black hover:text-white transition-all font-semibold"
      >
        New Analysis
      </button>
    </div>
  </div>
);

const App = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [repurposingData, setRepurposingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorType, setErrorType] = useState(null);
  const [repurposingMode, setRepurposingMode] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem('mol_history');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const [sideRepurposingData, setSideRepurposingData] = useState(null);

  const handleAnalyze = async (input) => {
    const val = input || inputValue;
    if (!val) return;
    setLoading(true);
    setData(null);
    setRepurposingData(null);
    setSideRepurposingData(null);
    setErrorType(null);

    const endpoint = repurposingMode ? '/api/v1/repurpose/' : '/api/v1/analyze/';
    const fetchOpts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: val }),
    };

    try {
      if (repurposingMode) {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, fetchOpts);
        if (!res.ok) { setErrorType(res.status); return; }
        setRepurposingData(await res.json());
      } else {
        // Fetch analyze + repurpose in parallel for ComparableCard
        const [analyzeRes, repurposeRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/analyze/`, fetchOpts),
          fetch(`${API_BASE_URL}/api/v1/repurpose/`, { ...fetchOpts }),
        ]);

        if (!analyzeRes.ok) { setErrorType(analyzeRes.status); return; }
        const result = await analyzeRes.json();
        setData(result);

        if (repurposeRes.ok) {
          setSideRepurposingData(await repurposeRes.json());
        }

        const newEntry = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          molecule_name: result.molecule_name,
          canonical_smiles: result.canonical_smiles,
          molecular_formula: result.molecular_formula,
          molecular_weight: result.descriptors?.molecular_weight || result.molecular_weight,
          druggability_score: result.druggability?.druggability_score,
          grade: result.druggability?.grade,
          binding_strength: result.binding_affinity?.binding_strength,
          pkd: result.binding_affinity?.pkd,
          lipinski_pass: result.lipinski_pass,
          overall_admet_score: result.admet?.overall_admet_score,
          fullData: result,
        };
        setHistory(prev => {
          const filtered = prev.filter(h =>
            h.molecule_name?.toLowerCase() !== newEntry.molecule_name?.toLowerCase()
          );
          const updated = [newEntry, ...filtered].slice(0, 10);
          try { localStorage.setItem('mol_history', JSON.stringify(updated)); } catch {}
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
      setErrorType(500);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setData(null);
    setRepurposingData(null);
    setErrorType(null);
    setInputValue('');
  };

  const ErrorPanel = ({ type, onDismiss }) => (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-full max-w-md bg-red-50 border border-red-200 p-10 text-center">
        <span className="material-symbols-outlined text-red-500 text-5xl mb-4 block">error_outline</span>
        <h3 className="text-red-700 font-bold uppercase tracking-tight text-xl mb-3">Analysis Failed</h3>
        <p className="font-mono text-xs text-red-500 uppercase tracking-widest mb-8 leading-relaxed">
          {type === 404
            ? 'Molecule not found in PubChem or local database'
            : `Backend error — code ${type}`}
        </p>
        <button
          onClick={onDismiss}
          className="px-8 py-3 border border-red-300 font-mono text-xs uppercase tracking-widest text-red-600 hover:bg-red-600 hover:text-white transition-all font-semibold"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  const mainViewStyle = {
    marginRight: sidebarOpen && window.innerWidth >= 768 ? '320px' : '0',
    transition: 'margin 300ms cubic-bezier(0.16, 1, 0.3, 1)',
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-white border border-black border-r-0 px-2 py-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-gray-50 transition-all group"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-black transition-colors">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span
            className="font-mono text-[10px] font-semibold text-gray-400 group-hover:text-black uppercase tracking-widest transition-colors"
            style={{ writingMode: 'vertical-rl' }}
          >
            HISTORY
          </span>
          {history.length > 0 && (
            <span className="bg-black text-white font-mono text-[10px] font-bold w-4 h-4 flex items-center justify-center">
              {history.length}
            </span>
          )}
        </button>
      )}

      <HistorySidebar 
        history={history}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={(entry) => {
          setData(entry.fullData);
          setInputValue(entry.molecule_name);
          setSidebarOpen(window.innerWidth >= 768);
          navigate('/analyzer');
        }}
        onClear={() => {
          setHistory([]);
          localStorage.removeItem('mol_history');
        }}
      />

      {drawerOpen && (
        <StructureDrawer
          onClose={() => setDrawerOpen(false)}
          onAnalyze={(smiles) => {
            setInputValue(smiles);
            setRepurposingMode(false);
            handleAnalyze(smiles);
          }}
        />
      )}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<AnalyzerDashboardDesktop onOpenHistory={() => setSidebarOpen(true)} />} />
        <Route path="/discovery" element={<MainAnalyzer onOpenHistory={() => setSidebarOpen(true)} />} />
        <Route 
          path="/analyzer" 
          element={
            <Layout onAnalyze={handleAnalyze} isLoading={loading} onOpenHistory={() => setSidebarOpen(true)}>
              <div className="flex-1 overflow-y-auto bg-white relative min-h-0" style={mainViewStyle}>

                <div className="relative z-10 px-8 md:px-12 py-10">
                  {!data && !repurposingData && !loading && !errorType && (
                    <EmptyHero
                      onAnalyze={handleAnalyze}
                      isLoading={loading}
                      repurposingMode={repurposingMode}
                      setRepurposingMode={(mode) => {
                        setRepurposingMode(mode);
                        handleReset();
                      }}
                      value={inputValue}
                      setValue={setInputValue}
                      onOpenDrawer={() => setDrawerOpen(true)}
                    />
                  )}
                  {loading && <div className="animate-pulse"><LoadingGrid /></div>}
                  {data && !loading && (
                    <div>
                      <AnalysisHeader data={data} onNewAnalysis={handleReset} />
                      <ResultsGrid data={data} repurposingData={sideRepurposingData} />
                    </div>
                  )}
                  {repurposingData && !loading && (
                    <div className="max-w-5xl mx-auto">
                      <AnalysisHeader data={repurposingData} onNewAnalysis={handleReset} mode="repurposing" />
                      <RepurposingCard 
                        results={repurposingData.results} 
                        bestTarget={repurposingData.best_target} 
                        moleculeName={repurposingData.molecule_name} 
                      />
                    </div>
                  )}
                  {errorType && !loading && <ErrorPanel type={errorType} onDismiss={handleReset} />}
                </div>

                {data && !loading && (
                  <footer className="fixed bottom-0 right-0 left-20 md:left-64 h-20 bg-white/95 backdrop-blur-xl border-t border-black flex items-center justify-between px-8 md:px-12 z-40" style={mainViewStyle}>
                    <div className="flex gap-8 md:gap-12">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold">Global Stability</span>
                        <span className="font-mono text-sm font-bold text-black uppercase">
                          {data.molecule_name} · Grade {data.druggability?.grade}
                        </span>
                      </div>
                      <div className="hidden md:flex flex-col gap-0.5">
                        <span className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold">Confidence</span>
                        <span className="font-mono text-sm font-bold text-black uppercase">
                          {(data.binding_affinity?.confidence * 100 || 0).toFixed(1)}% Accuracy
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleReset}
                        className="px-6 py-2.5 border border-black font-mono text-xs uppercase font-bold tracking-widest text-black hover:bg-black hover:text-white transition-all"
                      >
                        New Analysis
                      </button>
                      <button
                        onClick={() => exportReport(data)}
                        className="px-8 py-2.5 bg-black text-white font-mono text-xs uppercase font-bold tracking-widest hover:bg-gray-800 transition-colors"
                      >
                        Export Report
                      </button>
                    </div>
                  </footer>
                )}

                {repurposingData && !loading && (
                  <footer className="fixed bottom-0 right-0 left-20 md:left-64 h-20 bg-white/95 backdrop-blur-xl border-t border-black flex items-center justify-between px-8 md:px-12 z-40" style={mainViewStyle}>
                    <div className="flex gap-8 md:gap-12">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold">Highest Potential</span>
                        <span className="font-mono text-sm font-bold text-black uppercase">
                          {repurposingData.best_target.disease} · {repurposingData.best_target.repurposing_score.toFixed(1)}/100
                        </span>
                      </div>
                      <div className="hidden md:flex flex-col gap-0.5">
                        <span className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold">Integration</span>
                        <span className="font-mono text-sm font-bold text-black uppercase">Live ChEMBL Fetch</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleReset}
                        className="px-6 py-2.5 border border-black font-mono text-xs uppercase font-bold tracking-widest text-black hover:bg-black hover:text-white transition-all"
                      >
                        New Search
                      </button>
                      <button className="px-8 py-2.5 bg-white text-black font-mono text-[10px] uppercase font-bold tracking-[0.15em] hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        Download PDF
                      </button>
                    </div>
                  </footer>
                )}
              </div>
            </Layout>
          } 
        />
        <Route path="/analytics" element={<AnalyzerDashboard onOpenHistory={() => setSidebarOpen(true)} />} />
        <Route path="/compare" element={<MoleculeComparator onOpenHistory={() => setSidebarOpen(true)} />} />
        <Route path="/synthesis" element={<SynthesisPage onOpenHistory={() => setSidebarOpen(true)} />} />
      </Routes>
    </div>
  );
};

export default App;
