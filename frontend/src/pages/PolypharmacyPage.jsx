import React, { useState, useRef } from 'react';
import Layout from '../components/shared/Layout';
import PolyVerdictBanner from '../components/shared/PolyVerdictBanner';
import PolyBoiledEgg from '../components/shared/PolyBoiledEgg';
import BodyBurdenRadar from '../components/shared/BodyBurdenRadar';
import InteractionMatrix from '../components/shared/InteractionMatrix';
import PolyAdmetMatrix from '../components/shared/PolyAdmetMatrix';
import InteractionList from '../components/shared/InteractionList';
import MedicationTable from '../components/shared/MedicationTable';
import { API_BASE as API_BASE_URL } from '../config';

const MIN_MEDS = 2;
const MAX_MEDS = 10;

const PRESETS = [
  { label: 'Typical older-adult regimen', meds: ['warfarin', 'aspirin', 'metformin', 'amiodarone', 'ibuprofen'] },
  { label: 'Low-risk example', meds: ['metformin', 'caffeine', 'paracetamol'] },
];

const LoadingSkeleton = () => (
  <div className="grid grid-cols-12 gap-6 w-full">
    <p className="col-span-12 font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold">
      Resolving medicines…
    </p>
    <div className="col-span-12 h-40 bg-gray-100 border border-gray-200 animate-pulse" />
    <div className="col-span-12 lg:col-span-7 h-80 bg-gray-100 border border-gray-200 animate-pulse" />
    <div className="col-span-12 lg:col-span-5 h-80 bg-gray-100 border border-gray-200 animate-pulse" />
    <div className="col-span-12 lg:col-span-6 h-72 bg-gray-100 border border-gray-200 animate-pulse" />
    <div className="col-span-12 lg:col-span-6 h-72 bg-gray-100 border border-gray-200 animate-pulse" />
    <div className="col-span-12 h-48 bg-gray-100 border border-gray-200 animate-pulse" />
  </div>
);

const PolypharmacyPage = ({ onOpenHistory }) => {
  const [chips, setChips] = useState([]);
  const [draft, setDraft] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const focusTimer = useRef(null);

  const addChips = (raw) => {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const next = [...chips];
    for (const p of parts) {
      if (next.length >= MAX_MEDS) break;
      if (!next.some((c) => c.toLowerCase() === p.toLowerCase())) next.push(p.slice(0, 100));
    }
    setChips(next);
    setDraft('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addChips(draft);
    } else if (e.key === 'Backspace' && !draft && chips.length) {
      setChips(chips.slice(0, -1));
    }
  };

  const ageNum = age === '' ? null : Number(age);
  const ageInvalid = age !== '' && (!Number.isInteger(ageNum) || ageNum < 0 || ageNum > 120);
  const canAnalyze = chips.length >= MIN_MEDS && !loading && !ageInvalid;

  const analyze = async () => {
    if (!canAnalyze) return;
    setLoading(true);
    setError(null);
    setFocusId(null);
    try {
      const body = { medications: chips };
      if (ageNum !== null) body.age = ageNum;
      const res = await fetch(`${API_BASE_URL}/api/v1/polypharmacy/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setResult(await res.json());
      } else {
        let detail = `Request failed (${res.status})`;
        try {
          const j = await res.json();
          if (typeof j.detail === 'string') detail = j.detail;
          else if (Array.isArray(j.detail)) detail = j.detail.map((d) => d.msg).join('; ');
        } catch { /* keep default */ }
        setError(detail);
      }
    } catch {
      setError('Network error — is the backend running on port 8000?');
    } finally {
      setLoading(false);
    }
  };

  const onCellClick = (i, j) => {
    if (!result) return;
    const f = result.interactions.find((x) => x.drugs.includes(i + 1) && x.drugs.includes(j + 1));
    if (!f) return;
    setFocusId(f.id);
    setTimeout(() => document.getElementById(`finding-${f.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    clearTimeout(focusTimer.current);
    focusTimer.current = setTimeout(() => setFocusId(null), 2000);
  };

  const coverage = result?.regimen.kb_coverage;
  const coverageGap = coverage && coverage.known < coverage.total;

  return (
    <Layout onOpenHistory={onOpenHistory}>
      <div className="flex-1 overflow-y-auto bg-white min-h-0">
        <div className="relative z-10 px-8 py-10 max-w-6xl mx-auto">

          <div className="mb-8 pb-6 border-b border-black">
            <span className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2 block">
              Regimen Analysis
            </span>
            <h1 className="text-3xl font-bold tracking-tight uppercase text-black">Polypharmacy Analyzer</h1>
            <p className="font-mono text-xs text-gray-500 mt-2">
              Add 2 to 10 medicines to see how they interact and what the combined load does to the body
            </p>
          </div>

          {/* Input panel */}
          <div className="bg-white border border-black p-5 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <p className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold">Medicines</p>
              <span className="font-mono text-xs text-gray-400">{chips.length} / {MAX_MEDS}</span>
            </div>

            <div className="flex gap-0 border border-black">
              <input
                className="flex-1 min-w-0 bg-white text-black font-mono text-sm px-4 py-3.5 outline-none placeholder:text-gray-400 border-0"
                placeholder={chips.length >= MAX_MEDS ? 'Maximum reached' : 'Type a medicine name, press Enter or comma'}
                value={draft}
                disabled={chips.length >= MAX_MEDS}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                onBlur={() => draft.trim() && addChips(draft)}
                maxLength={100}
              />
            </div>

            {chips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {chips.map((c) => (
                  <button
                    key={c}
                    onClick={() => setChips(chips.filter((x) => x !== c))}
                    className="px-3 py-1.5 bg-white border border-gray-200 font-mono text-xs text-gray-500 uppercase hover:border-black hover:text-black"
                    aria-label={`Remove ${c}`}
                  >
                    {c} <span className="ml-1">×</span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-end gap-6">
              <div>
                <label className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold block mb-1.5" htmlFor="poly-age">
                  Age (optional)
                </label>
                <div className="flex gap-0 border border-black w-28">
                  <input
                    id="poly-age"
                    type="number"
                    min="0"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-white text-black font-mono text-sm px-4 py-3.5 outline-none placeholder:text-gray-400 border-0"
                    placeholder="—"
                  />
                </div>
                <p className={`font-mono text-[11px] mt-1.5 ${ageInvalid ? 'text-red-600' : 'text-gray-400'}`}>
                  {ageInvalid ? 'Age must be a whole number from 0 to 120' : 'Leave empty to apply older-adult (65+) safety rules'}
                </p>
              </div>
              <button
                onClick={analyze}
                disabled={!canAnalyze}
                className="bg-black text-white px-8 py-3.5 font-mono text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Analyzing…' : 'Analyze Regimen'}
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-gray-400 uppercase tracking-widest font-semibold mr-1">Quick select:</span>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setChips(p.meds)}
                  className="px-3 py-1.5 bg-white border border-gray-200 font-mono text-xs text-gray-500 uppercase hover:border-black hover:text-black"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-8 bg-red-50 border border-red-200 p-6" role="alert">
              <p className="font-mono text-xs text-red-600 uppercase tracking-widest font-semibold mb-1">Analysis failed</p>
              <p className="font-mono text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading && <LoadingSkeleton />}

          {!loading && !result && !error && (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-gray-300">
              <p className="font-mono text-xs text-gray-400 uppercase tracking-widest text-center font-semibold">
                Add at least two medicines to begin
              </p>
            </div>
          )}

          {!loading && result && (
            <>
              {result.unresolved.length > 0 && (
                <div className="mb-4 border border-red-200 bg-red-50 p-4">
                  <p className="font-mono text-xs text-red-600 uppercase tracking-widest font-semibold mb-2">
                    Could not recognise {result.unresolved.length} {result.unresolved.length === 1 ? 'medicine' : 'medicines'} (not analysed)
                  </p>
                  <ul className="font-mono text-xs text-red-700 space-y-1">
                    {result.unresolved.map((u) => (
                      <li key={u.input}><b>{u.input}</b> — {u.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
              {coverageGap && (
                <div className="mb-4 border border-amber-200 bg-amber-50 p-4 font-mono text-xs text-amber-800">
                  {coverage.total - coverage.known} of {coverage.total} medicines have no curated interaction data.
                  Only structure-based checks were applied. No findings does not mean safe.
                </div>
              )}

              <div className="grid grid-cols-12 gap-6 mt-4">
                <div className="col-span-12"><PolyVerdictBanner overall={result.overall} regimen={result.regimen} /></div>
                <div className="col-span-12 lg:col-span-7"><PolyBoiledEgg medications={result.medications} summary={result.boiled_egg_summary} /></div>
                <div className="col-span-12 lg:col-span-5"><BodyBurdenRadar burden={result.body_burden} /></div>
                <div className="col-span-12 lg:col-span-6"><InteractionMatrix matrix={result.matrix} medications={result.medications} onCellClick={onCellClick} /></div>
                <div className="col-span-12 lg:col-span-6"><PolyAdmetMatrix medications={result.medications} /></div>
                <div className="col-span-12"><InteractionList interactions={result.interactions} coverageGap={coverageGap} focusId={focusId} /></div>
                <div className="col-span-12"><MedicationTable medications={result.medications} /></div>
              </div>
            </>
          )}

          {/* Always visible, never collapsible */}
          <div className="mt-8 border border-black bg-gray-50 p-4 font-mono text-xs text-gray-700">
            {result?.disclaimer ||
              'Screening aid only. Not medical advice. Do not start, stop or change any medicine without talking to a doctor or pharmacist.'}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PolypharmacyPage;
