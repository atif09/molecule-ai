import React, { useState } from 'react';
import Layout from '../components/shared/Layout';
import BoiledEggPlot from '../components/shared/BoiledEggPlot';
import { API_BASE as API_BASE_URL } from '../config';

const GRADE = {
  A: { text: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  B: { text: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  C: { text: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
  D: { text: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

const GradeBadge = ({ grade }) => {
  const s = GRADE[grade] || GRADE.D;
  return (
    <span
      className="font-mono text-xs font-bold px-2 py-0.5 border"
      style={{ color: s.text, background: s.bg, borderColor: s.border }}
    >
      {grade}
    </span>
  );
};

const PropertyRow = ({ label, val1, val2, highBetter = true, unit = '', isGrade = false }) => {
  const n1 = parseFloat(val1);
  const n2 = parseFloat(val2);
  const bothValid = !isNaN(n1) && !isNaN(n2) && val1 != null && val2 != null;
  const win1 = bothValid && (highBetter ? n1 > n2 : n1 < n2);
  const win2 = bothValid && (highBetter ? n2 > n1 : n2 < n1);

  const fmt = (v) => {
    if (v == null) return '—';
    if (isGrade) return v;
    const n = parseFloat(v);
    return isNaN(n) ? v : (Number.isInteger(n) ? n : n.toFixed(2));
  };

  return (
    <div className="grid grid-cols-3 border-b border-gray-100 py-3 px-6 items-center hover:bg-gray-50 transition-colors">
      <div className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold">{label}</div>
      <div className={`text-center font-mono text-sm flex items-center justify-center gap-1.5 font-medium ${
        win1 ? 'text-green-700 font-bold' : win2 ? 'text-red-500' : 'text-gray-700'
      }`}>
        {win1 && <span className="text-[10px] text-green-600">▲</span>}
        {isGrade && val1 ? <GradeBadge grade={val1} /> : `${fmt(val1)}${val1 != null && unit ? unit : ''}`}
      </div>
      <div className={`text-center font-mono text-sm flex items-center justify-center gap-1.5 font-medium ${
        win2 ? 'text-green-700 font-bold' : win1 ? 'text-red-500' : 'text-gray-700'
      }`}>
        {win2 && <span className="text-[10px] text-green-600">▲</span>}
        {isGrade && val2 ? <GradeBadge grade={val2} /> : `${fmt(val2)}${val2 != null && unit ? unit : ''}`}
      </div>
    </div>
  );
};

const Section = ({ label }) => (
  <div className="bg-gray-50 border-y border-gray-100 px-6 py-2">
    <span className="font-mono text-[11px] text-gray-500 uppercase tracking-widest font-semibold">{label}</span>
  </div>
);

const WinnerBanner = ({ mol1, mol2, name1, name2 }) => {
  if (!mol1 || !mol2) return null;

  const scores = [
    { prop: mol1.druggability?.druggability_score, other: mol2.druggability?.druggability_score, high: true },
    { prop: mol1.binding_affinity?.pkd, other: mol2.binding_affinity?.pkd, high: true },
    { prop: mol1.admet?.overall_admet_score, other: mol2.admet?.overall_admet_score, high: true },
    { prop: mol1.qed_score, other: mol2.qed_score, high: true },
    { prop: mol1.descriptors?.LogP, other: mol2.descriptors?.LogP, high: false },
    { prop: mol1.descriptors?.TPSA, other: mol2.descriptors?.TPSA, high: false },
    { prop: mol1.molecular_weight, other: mol2.molecular_weight, high: false },
  ];

  let wins1 = 0, wins2 = 0;
  scores.forEach(({ prop, other, high }) => {
    if (prop == null || other == null) return;
    if (high ? prop > other : prop < other) wins1++;
    else if (high ? other > prop : other < prop) wins2++;
  });

  const total = wins1 + wins2;
  const winner = wins1 > wins2 ? name1 : wins2 > wins1 ? name2 : null;
  const winnerWins = Math.max(wins1, wins2);

  return (
    <div className={`border p-5 mb-8 flex items-center justify-between ${
      winner ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
    }`}>
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">Overall Verdict</p>
        {winner ? (
          <p className="font-mono text-lg font-bold text-black">
            <span className="text-green-700">{winner}</span>{' '}
            <span className="text-gray-500 text-sm font-normal">wins ({winnerWins}/{total} categories)</span>
          </p>
        ) : (
          <p className="font-mono text-lg font-bold text-gray-500">Tied across categories</p>
        )}
      </div>
      <div className="flex gap-6 text-center">
        <div>
          <p className="font-mono text-2xl font-bold text-green-700">{wins1}</p>
          <p className="font-mono text-[11px] text-gray-500 uppercase font-semibold">{name1 || 'Mol A'}</p>
        </div>
        <div className="text-gray-300 font-mono text-xl self-center">vs</div>
        <div>
          <p className="font-mono text-2xl font-bold text-green-700">{wins2}</p>
          <p className="font-mono text-[11px] text-gray-500 uppercase font-semibold">{name2 || 'Mol B'}</p>
        </div>
      </div>
    </div>
  );
};

const MolSlot = ({ id, value, onChange, onFetch, loading, data, accentClass }) => (
  <div className="bg-white border border-black p-5">
    <p className={`font-mono text-xs uppercase tracking-widest font-semibold mb-3 ${accentClass}`}>
      Molecule {id}
    </p>
    <div className="flex gap-0 border border-black">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onFetch()}
        placeholder="Name or SMILES..."
        className="flex-1 bg-white border-0 px-4 py-2.5 font-mono text-sm text-black outline-none placeholder:text-gray-400"
      />
      <button
        onClick={onFetch}
        disabled={loading}
        className="bg-black text-white px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-50 border-l border-black"
      >
        {loading ? '...' : 'Load'}
      </button>
    </div>
    {data && (
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <div>
          <p className="font-mono text-sm font-bold text-black uppercase">{data.molecule_name}</p>
          <p className="font-mono text-xs text-gray-400 mt-0.5">{data.molecular_formula} · {data.molecular_weight?.toFixed(1)} Da</p>
        </div>
        <GradeBadge grade={data.druggability?.grade} />
      </div>
    )}
  </div>
);

const MoleculeComparator = ({ onOpenHistory }) => {
  const [mol1, setMol1] = useState(null);
  const [mol2, setMol2] = useState(null);
  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState('');
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);

  const fetchMol = async (input, setMol, setLoading) => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/analyze/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      if (res.ok) setMol(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const bothLoaded = mol1 && mol2;

  return (
    <Layout onOpenHistory={onOpenHistory}>
      <div className="flex-1 overflow-y-auto bg-white min-h-0">
        <div className="relative z-10 px-8 py-10 max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-8 pb-6 border-b border-black">
            <span className="font-mono text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2 block">
              Comparative Analysis
            </span>
            <h1 className="text-3xl font-bold tracking-tight uppercase text-black">
              Molecule Comparator
            </h1>
            <p className="font-mono text-xs text-gray-500 mt-2">
              Load two compounds to compare druggability, pharmacokinetics, and bioavailability
            </p>
          </div>

          {/* Input slots */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <MolSlot id="A" value={input1} onChange={setInput1}
              onFetch={() => fetchMol(input1, setMol1, setLoading1)}
              loading={loading1} data={mol1} accentClass="text-blue-700" />
            <MolSlot id="B" value={input2} onChange={setInput2}
              onFetch={() => fetchMol(input2, setMol2, setLoading2)}
              loading={loading2} data={mol2} accentClass="text-violet-700" />
          </div>

          {/* Winner banner */}
          {bothLoaded && (
            <WinnerBanner mol1={mol1} mol2={mol2} name1={mol1.molecule_name} name2={mol2.molecule_name} />
          )}

          {/* Comparison table */}
          {(mol1 || mol2) && (
            <div className="bg-white border border-black overflow-hidden mb-8">
              {/* Table header */}
              <div className="grid grid-cols-3 bg-black px-6 py-4">
                <div className="font-mono text-xs text-gray-400 uppercase tracking-widest font-semibold">Property</div>
                <div className="text-center font-mono text-xs text-blue-300 uppercase tracking-widest font-bold">
                  {mol1?.molecule_name || 'Molecule A'}
                </div>
                <div className="text-center font-mono text-xs text-violet-300 uppercase tracking-widest font-bold">
                  {mol2?.molecule_name || 'Molecule B'}
                </div>
              </div>

              <Section label="Overall Assessment" />
              <PropertyRow label="Druggability Score"   val1={mol1?.druggability?.druggability_score}    val2={mol2?.druggability?.druggability_score}    unit="/100" />
              <PropertyRow label="Grade"                val1={mol1?.druggability?.grade}                 val2={mol2?.druggability?.grade}                 isGrade />
              <PropertyRow label="Binding Affinity pKd" val1={mol1?.binding_affinity?.pkd}               val2={mol2?.binding_affinity?.pkd} />
              <PropertyRow label="Binding Strength"     val1={mol1?.binding_affinity?.binding_strength}  val2={mol2?.binding_affinity?.binding_strength} />
              <PropertyRow label="ADMET Score"          val1={mol1?.admet?.overall_admet_score}          val2={mol2?.admet?.overall_admet_score}          unit="/100" />
              <PropertyRow label="QED (Drug-likeness)"  val1={mol1?.qed_score}                           val2={mol2?.qed_score} />

              <Section label="Physical Chemistry" />
              <PropertyRow label="Molecular Weight"   val1={mol1?.molecular_weight}               val2={mol2?.molecular_weight}               unit=" Da"  highBetter={false} />
              <PropertyRow label="LogP"               val1={mol1?.descriptors?.LogP}              val2={mol2?.descriptors?.LogP}              highBetter={false} />
              <PropertyRow label="TPSA"               val1={mol1?.descriptors?.TPSA}              val2={mol2?.descriptors?.TPSA}              unit=" Å²"  highBetter={false} />
              <PropertyRow label="H-Bond Donors"      val1={mol1?.descriptors?.NumHDonors}        val2={mol2?.descriptors?.NumHDonors}        highBetter={false} />
              <PropertyRow label="H-Bond Acceptors"   val1={mol1?.descriptors?.NumHAcceptors}     val2={mol2?.descriptors?.NumHAcceptors}     highBetter={false} />
              <PropertyRow label="Aromatic Rings"     val1={mol1?.descriptors?.NumAromaticRings}  val2={mol2?.descriptors?.NumAromaticRings} />
              <PropertyRow label="Rotatable Bonds"    val1={mol1?.descriptors?.NumRotatableBonds} val2={mol2?.descriptors?.NumRotatableBonds} highBetter={false} />
              <PropertyRow label="Lipinski Pass"      val1={mol1?.lipinski_pass ? 'Yes' : 'No'}   val2={mol2?.lipinski_pass ? 'Yes' : 'No'} />

              <Section label="Pharmacokinetics (ADMET)" />
              <PropertyRow label="Absorption"   val1={(mol1?.admet?.absorption?.probability  * 100)?.toFixed(1)}  val2={(mol2?.admet?.absorption?.probability  * 100)?.toFixed(1)}  unit="%" />
              <PropertyRow label="Distribution" val1={(mol1?.admet?.distribution?.probability * 100)?.toFixed(1)} val2={(mol2?.admet?.distribution?.probability * 100)?.toFixed(1)} unit="%" />
              <PropertyRow label="Metabolism"   val1={(mol1?.admet?.metabolism?.probability  * 100)?.toFixed(1)}  val2={(mol2?.admet?.metabolism?.probability  * 100)?.toFixed(1)}  unit="%" />
              <PropertyRow label="Toxicity Risk" val1={(mol1?.admet?.toxicity?.probability   * 100)?.toFixed(1)}  val2={(mol2?.admet?.toxicity?.probability    * 100)?.toFixed(1)}  unit="%" highBetter={false} />
            </div>
          )}

          {/* BOILED-Egg side by side */}
          {bothLoaded && (
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div>
                <p className="font-mono text-xs text-blue-700 uppercase tracking-widest font-semibold mb-2">{mol1.molecule_name}</p>
                <BoiledEggPlot descriptors={mol1.descriptors} />
              </div>
              <div>
                <p className="font-mono text-xs text-violet-700 uppercase tracking-widest font-semibold mb-2">{mol2.molecule_name}</p>
                <BoiledEggPlot descriptors={mol2.descriptors} />
              </div>
            </div>
          )}

          {/* Empty state */}
          {!mol1 && !mol2 && (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-gray-300">
              <p className="font-mono text-xs text-gray-400 uppercase tracking-widest text-center font-semibold">
                Load two molecules to begin comparison
              </p>
              <p className="font-mono text-xs text-gray-300 mt-2">
                Try: imatinib vs aspirin
              </p>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
};

export default MoleculeComparator;
