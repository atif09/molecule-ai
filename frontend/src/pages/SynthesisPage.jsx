import React, { useState } from 'react';
import Layout from '../components/shared/Layout';
import MoleculeViewer3D from '../components/shared/MoleculeViewer3D';
import { API_BASE } from '../config';

/* ─────────────────────────── helpers ─────────────────────────── */
const truncateSmiles = (s, n = 30) => (s?.length > n ? s.slice(0, n) + '…' : s || '—');

/* ─────────────────────────── sub-components ─────────────────────────── */
const InputBar = ({ onPredict, isLoading }) => {
  const [value, setValue] = useState('');
  const submit = () => value.trim() && onPredict(value.trim());

  return (
    <div className="flex gap-0 w-full border border-black">
      <div className="relative flex-1">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none select-none">biotech</span>
        <input
          className="w-full bg-white text-black font-mono text-sm pl-12 pr-4 py-4 outline-none placeholder:text-gray-400 border-0"
          placeholder="aspirin · ibuprofen · CC(=O)Oc1ccccc1C(=O)O"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          autoFocus
        />
      </div>
      <button
        onClick={submit}
        disabled={isLoading || !value.trim()}
        className="px-10 py-4 bg-black text-white font-mono text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap border-l border-black"
      >
        {isLoading ? 'Predicting...' : 'Predict Route'}
      </button>
    </div>
  );
};

const StepsTimeline = ({ steps, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-0 mt-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="relative pl-8 pb-10 border-l border-gray-300">
            <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-gray-200 animate-pulse border-2 border-white" />
            <div className="space-y-2">
              <div className="h-2 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
              <div className="h-2 w-32 bg-gray-200 rounded animate-pulse mt-1" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!steps?.length) return (
    <div className="mt-6 text-center py-8">
      <span className="material-symbols-outlined text-gray-300 text-4xl block mb-3">route</span>
      <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">No route predicted yet</p>
    </div>
  );

  return (
    <div className="space-y-0 mt-2">
      {steps.map((s, idx) => (
        <div
          key={s.step}
          className={`relative pl-9 pb-10 ${idx === steps.length - 1 ? '' : 'border-l-2 border-gray-100'}`}
        >
          <div className={`absolute -left-2 top-0.5 w-4 h-4 rounded-full border-2 border-white ${idx === 0 ? 'bg-black' : 'bg-gray-200'}`} />
          <div className="space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-gray-400 font-semibold">
              Step {String(s.step).padStart(2, '0')}
            </span>
            <p className="text-sm font-bold text-black uppercase tracking-wide leading-tight">
              {s.reaction_type || 'Transformation'}
            </p>
            <p className="font-mono text-xs text-gray-500 leading-relaxed">
              {s.reactants?.length > 0
                ? `${s.reactants.length} precursor${s.reactants.length > 1 ? 's' : ''} → product`
                : truncateSmiles(s.reaction_smiles)}
            </p>
            {/* Confidence bar */}
            <div className="flex items-center gap-3 mt-1">
              <div className="flex-1 h-[2px] bg-gray-100">
                <div
                  className="bg-black h-full transition-all duration-700"
                  style={{ width: `${(s.confidence * 100).toFixed(0)}%` }}
                />
              </div>
              <span className="font-mono text-xs text-gray-500 w-10 text-right font-medium">
                {(s.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const ReactionDetail = ({ step }) => {
  if (!step) return null;
  const parts = step.reaction_smiles?.split('>>') || [];
  const reactants = parts[0]?.split('.') || [];
  const product = parts[1] || '';
  const hasSMILES = !!step.reaction_smiles;
  const hasNamedReactants = step.reactants?.length > 0;

  return (
    <div className="bg-white border border-black p-6 space-y-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-widest text-gray-500 font-semibold">
          Reaction Detail
        </span>
        <span className="font-mono text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5">
          Step {String(step.step).padStart(2, '0')}
        </span>
      </div>

      {/* SMILES-based reactants */}
      {hasSMILES && reactants.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {reactants.map((r, i) => (
            <React.Fragment key={i}>
              <div className="bg-gray-50 border border-gray-200 px-4 py-2.5">
                <span className="font-mono text-[11px] text-gray-400 block mb-0.5">Reactant {i + 1}</span>
                <span className="font-mono text-sm text-black font-medium">{truncateSmiles(r, 22)}</span>
              </div>
              {i < reactants.length - 1 && (
                <span className="material-symbols-outlined text-gray-300">add</span>
              )}
            </React.Fragment>
          ))}
          <span className="material-symbols-outlined text-gray-500">arrow_forward</span>
          <div className="bg-black border border-black px-4 py-2.5">
            <span className="font-mono text-[11px] text-gray-400 block mb-0.5">Product</span>
            <span className="font-mono text-sm text-white font-medium">{truncateSmiles(product, 22)}</span>
          </div>
        </div>
      )}

      {/* Named reactants from fallback */}
      {!hasSMILES && hasNamedReactants && (
        <div className="flex items-center gap-3 flex-wrap">
          {step.reactants.map((r, i) => (
            <React.Fragment key={i}>
              <div className="bg-gray-50 border border-gray-200 px-4 py-2.5">
                <span className="font-mono text-[11px] text-gray-400 block mb-0.5">Precursor {i + 1}</span>
                <span className="font-mono text-sm text-black font-medium">{r}</span>
              </div>
              {i < step.reactants.length - 1 && (
                <span className="material-symbols-outlined text-gray-300">add</span>
              )}
            </React.Fragment>
          ))}
          <span className="material-symbols-outlined text-gray-500">arrow_forward</span>
          <div className="bg-black border border-black px-4 py-2.5">
            <span className="font-mono text-[11px] text-gray-400 block mb-0.5">Product</span>
            <span className="font-mono text-sm text-white font-medium">{step.product || 'Intermediate'}</span>
          </div>
        </div>
      )}

      <div className="flex gap-8 pt-3 border-t border-gray-100">
        <div>
          <span className="font-mono text-xs text-gray-400 uppercase tracking-widest block mb-1">Confidence</span>
          <p className="font-mono text-base text-black font-bold">{(step.confidence * 100).toFixed(1)}%</p>
        </div>
        {step.template_score > 0 && (
          <div>
            <span className="font-mono text-xs text-gray-400 uppercase tracking-widest block mb-1">Template Score</span>
            <p className="font-mono text-base text-black font-bold">{(step.template_score * 100).toFixed(1)}%</p>
          </div>
        )}
        <div>
          <span className="font-mono text-xs text-gray-400 uppercase tracking-widest block mb-1">Type</span>
          <p className="font-mono text-base text-black font-bold">{step.reaction_type}</p>
        </div>
      </div>
    </div>
  );
};

const MetricsPanel = ({ result, isLoading }) => {
  const score = result ? (result.overall_confidence * 100).toFixed(1) : '—';
  const numSteps = result?.num_steps ?? '—';

  return (
    <div className="flex flex-col gap-6">
      {/* Confidence Index */}
      <div className="bg-white border border-black p-6">
        <span className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold block mb-4">Confidence Index</span>
        {isLoading ? (
          <div className="h-12 w-28 bg-gray-100 rounded animate-pulse" />
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold text-black tracking-tighter">{score}</span>
              {result && <span className="font-mono text-xl text-gray-400">%</span>}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${result ? 'bg-black' : 'bg-gray-300'}`} />
              <span className="font-mono text-xs text-gray-600 uppercase tracking-wider font-semibold truncate">
                {result ? (result.status === 'fallback' ? 'Rule-based' : 'IBM RXN AI') : 'Awaiting Input'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Steps count */}
      <div className="p-4 border-l-4 border-black">
        <span className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold block">Synthesis Steps</span>
        {isLoading ? (
          <div className="h-10 w-12 bg-gray-100 rounded animate-pulse mt-3" />
        ) : (
          <>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-4xl font-bold text-black tracking-tighter">{numSteps}</span>
              {result && <span className="font-mono text-sm text-gray-500 uppercase font-bold">steps</span>}
            </div>
            <p className="font-mono text-xs text-gray-500 mt-2 leading-relaxed">
              {result
                ? result.status === 'fallback'
                  ? 'Rule-based retrosynthesis from molecular descriptors.'
                  : 'Retrosynthetic path by IBM RXN neural model.'
                : 'Enter a molecule to predict synthesis route.'}
            </p>
          </>
        )}
      </div>

      {/* Grid of mini metrics */}
      {result && (
        <div className="grid grid-cols-2 gap-px bg-black border border-black">
          {[
            { label: 'Target', value: truncateSmiles(result.target_smiles, 10) },
            { label: 'Status', value: result.status === 'success' ? 'SUCCESS' : result.status?.toUpperCase() },
            { label: 'Time', value: `${result.processing_time_ms?.toFixed(0) || '—'}ms` },
            { label: 'Source', value: result.status === 'fallback' ? 'LOCAL' : 'IBM RXN' },
          ].map(m => (
            <div key={m.label} className="p-4 bg-white">
              <span className="font-mono text-[11px] font-semibold text-gray-500 uppercase tracking-widest block mb-1">{m.label}</span>
              <div className="font-mono text-sm font-bold text-black uppercase leading-none truncate">{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Step confidence sparkline */}
      {result?.steps?.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="font-mono text-xs uppercase tracking-widest text-gray-500 font-semibold">Step Confidence</span>
            <span className="font-mono text-xs text-gray-400">per step</span>
          </div>
          <div className="flex items-end gap-1 h-12 border-b border-l border-black">
            {result.steps.map((s, i) => (
              <div
                key={i}
                style={{ height: `${(s.confidence * 100).toFixed(0)}%` }}
                className="flex-1 bg-black hover:bg-gray-500 transition-colors cursor-default"
                title={`Step ${s.step}: ${(s.confidence * 100).toFixed(1)}%`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="font-mono text-[11px] text-gray-400 uppercase">S1</span>
            <span className="font-mono text-[11px] text-gray-400 uppercase">S{result.steps.length}</span>
          </div>
        </div>
      )}

      {/* Model badge */}
      {result && (
        <div className="border border-black p-4">
          <span className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold block mb-1.5">Model</span>
          <p className="font-mono text-xs text-black font-bold leading-relaxed">{result.model}</p>
        </div>
      )}
    </div>
  );
};

const ErrorPanel = ({ message, onDismiss }) => (
  <div className="flex-1 flex items-center justify-center p-12">
    <div className="w-full max-w-md bg-white border border-black p-8 text-center">
      <span className="material-symbols-outlined text-black text-4xl mb-3 block">error_outline</span>
      <h3 className="text-black font-bold uppercase tracking-tighter text-lg mb-2">Prediction Failed</h3>
      <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-6 leading-relaxed">{message}</p>
      <button
        onClick={onDismiss}
        className="px-6 py-2 border border-black font-mono text-[10px] uppercase tracking-widest text-black hover:bg-black hover:text-white transition-all"
      >
        Try Again
      </button>
    </div>
  </div>
);

/* ─────────────────────────── main page ─────────────────────────── */
const SynthesisPage = ({ onOpenHistory }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedStep, setSelectedStep] = useState(null);
  const [sdfData, setSdfData] = useState(null);

  const handlePredict = async (input) => {
    setLoading(true);
    setResult(null);
    setError(null);
    setSelectedStep(null);
    setSdfData(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/synthesis/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, steps: 3 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || `Error ${res.status}`);
        return;
      }
      setResult(data);
      if (data.steps?.length) setSelectedStep(data.steps[0]);

      if (data.target_smiles) {
        const sRes = await fetch(`${API_BASE}/api/v1/structure/3d`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ smiles: data.target_smiles }),
        });
        if (sRes.ok) {
          const sData = await sRes.json();
          setSdfData(sData.sdf || '');
        }
      }
    } catch {
      setError('Network error — is the backend running on port 8000?');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setSelectedStep(null);
    setSdfData(null);
  };

  return (
    <Layout onOpenHistory={onOpenHistory}>
      <div className="flex-1 flex flex-col overflow-hidden bg-white">

        {/* Top bar */}
        <div className="flex-shrink-0 px-8 py-6 border-b border-black bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-gray-500 font-semibold block mb-1">
                Retrosynthesis Prediction / IBM RXN AI
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-black uppercase">Synthesis Engine</h2>
            </div>
            <div className="flex gap-0 border border-black">
              <div className="px-5 py-3 flex flex-col border-r border-black">
                <span className="font-mono text-xs text-gray-500 uppercase font-semibold">Model</span>
                <span className="font-mono text-sm text-black font-bold">IBM RXN AI</span>
              </div>
              <div className="px-5 py-3 flex flex-col">
                <span className="font-mono text-xs text-gray-500 uppercase font-semibold">Max Steps</span>
                <span className="font-mono text-sm text-black font-bold">3 routes</span>
              </div>
            </div>
          </div>
          <InputBar onPredict={handlePredict} isLoading={loading} />
        </div>

        {/* Main content: 3-column layout */}
        {error ? (
          <ErrorPanel message={error} onDismiss={handleReset} />
        ) : (
          <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden relative min-h-0">

            {/* Left: Synthesis Strategy Timeline */}
            <aside className="col-span-12 lg:col-span-3 bg-white border-r border-black flex flex-col z-10 min-h-0">
              <div className="p-8 flex-1 overflow-y-auto min-h-0">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-widest text-gray-500 font-semibold block mb-1">Active Sequence</span>
                    <h3 className="text-base font-bold tracking-tight text-black uppercase">
                      {result ? result.molecule_name : 'Awaiting Input'}
                    </h3>
                  </div>
                  <span className="material-symbols-outlined text-gray-300">query_stats</span>
                </div>

                <StepsTimeline steps={result?.steps} isLoading={loading} />

                {result?.steps?.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <span className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold block mb-3">Select step to inspect</span>
                    {result.steps.map(s => (
                      <button
                        key={s.step}
                        onClick={() => setSelectedStep(s)}
                        className={`w-full text-left px-3 py-3 font-mono text-xs uppercase tracking-wider transition-all border ${
                          selectedStep?.step === s.step
                            ? 'bg-black text-white border-black'
                            : 'text-gray-600 border-gray-200 hover:border-black hover:text-black bg-white'
                        }`}
                      >
                        Step {String(s.step).padStart(2, '0')} — {s.reaction_type}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sparkline at bottom of sidebar */}
              <div className="flex-shrink-0 p-6 border-t border-black bg-gray-50">
                <span className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold block mb-4">
                  Step Confidence (%)
                </span>
                <div className="flex items-end gap-1.5 h-12 border-b border-l border-black">
                  {(result?.steps?.length
                    ? result.steps.map(s => s.confidence * 100)
                    : [50, 75, 33, 100, 66, 50, 25, 45, 90, 60]
                  ).map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className={`flex-1 transition-all duration-500 ${h > 80 ? 'bg-black' : h > 50 ? 'bg-gray-400' : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
              </div>
            </aside>

            {/* Center: 3D viewer + reaction detail */}
            <section className="col-span-12 lg:col-span-6 relative flex flex-col p-8 overflow-y-auto bg-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="font-mono text-xs tracking-widest text-gray-500 uppercase font-semibold">
                  {result ? `Target: ${result.target_smiles?.slice(0, 30)}` : '3D Structure Viewer'}
                </span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>

              {/* Molecule 3D viewer with hover effect */}
              <div className="group flex-1 flex items-center justify-center min-h-[300px] border border-black relative bg-white transition-colors duration-300 hover:bg-gray-50 overflow-hidden">
                {loading ? (
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative w-40 h-40">
                      <div className="absolute inset-0 border border-gray-200 rounded-full animate-[spin_8s_linear_infinite]" />
                      <div className="absolute inset-4 border border-gray-100 rounded-full border-dashed animate-[spin_5s_linear_infinite_reverse]" />
                      <div className="absolute inset-8 border border-gray-200 rounded-full animate-[spin_3s_linear_infinite]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-black text-3xl animate-pulse">biotech</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-mono text-sm text-black uppercase tracking-widest mb-1 font-semibold">Computing Retrosynthesis</p>
                      <p className="font-mono text-xs text-gray-500">IBM RXN AI · up to 90 seconds</p>
                    </div>
                  </div>
                ) : sdfData ? (
                  <div className="w-full h-full min-h-[300px]">
                    <MoleculeViewer3D sdfData={sdfData} isLoading={false} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 opacity-25">
                    <div className="relative w-32 h-32">
                      <div className="absolute inset-0 border border-gray-400 rounded-full animate-[spin_60s_linear_infinite]">
                        <div className="absolute inset-4 border border-gray-300 rounded-full border-dashed" />
                      </div>
                    </div>
                    <span className="font-mono text-xs text-gray-600 uppercase tracking-widest font-semibold">Enter molecule to begin</span>
                  </div>
                )}
                {/* Hover tint overlay — sits on top but doesn't block pointer events on canvas */}
                {sdfData && !loading && (
                  <div className="absolute inset-0 bg-gray-100/0 group-hover:bg-gray-100/25 transition-colors duration-300 pointer-events-none" />
                )}
              </div>

              {/* Selected step reaction detail */}
              {selectedStep && !loading && (
                <div className="flex-shrink-0 mt-6">
                  <ReactionDetail step={selectedStep} />
                </div>
              )}

              {/* Bottom controls */}
              <div className="flex-shrink-0 flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                <span className="font-mono text-xs text-gray-500 uppercase tracking-widest font-medium">
                  {result
                    ? `${result.num_steps} steps · ${result.processing_time_ms?.toFixed(0)}ms · ${result.status}`
                    : 'No prediction loaded'}
                </span>
                <div className="flex gap-2">
                  {result && (
                    <button
                      onClick={handleReset}
                      className="px-5 py-2 border border-black font-mono text-xs uppercase tracking-widest text-black hover:bg-black hover:text-white transition-all font-semibold"
                    >
                      Reset
                    </button>
                  )}
                  <button className="bg-black text-white px-6 py-2 font-mono text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
                    Export
                  </button>
                </div>
              </div>
            </section>

            {/* Right: Metrics panel */}
            <aside className="col-span-12 lg:col-span-3 border-l border-black p-8 overflow-y-auto bg-white z-10 min-h-0">
              <span className="font-mono text-xs uppercase tracking-widest text-gray-500 font-semibold block mb-6">Analysis</span>
              <MetricsPanel result={result} isLoading={loading} />
            </aside>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SynthesisPage;
