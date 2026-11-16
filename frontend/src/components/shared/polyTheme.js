// Shared constants for the Polypharmacy cards. Colours copied from the existing
// GRADE palette (AdmetCard) and BoiledEggPlot - no new colours.
export const SEV = {
  minor:    { text: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  moderate: { text: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
  major:    { text: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  ok:       { text: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
};

// Verdict level -> severity palette key
export const LEVEL_SEV = { low: 'ok', moderate: 'minor', high: 'moderate', severe: 'major' };

export const SEV_RANK = { major: 0, moderate: 1, minor: 2 };

export const ZONE_COLOR = { bbb: '#d97706', hia: '#374151', outside: '#dc2626' };
export const ZONE_LABEL = { bbb: 'BBB', hia: 'HIA', outside: 'Outside' };

export const TAG_LABEL = {
  bleeding: 'bleeding risk',
  gi_irritation: 'GI irritation',
  qt_prolongation: 'QT prolongation',
  bradycardia: 'slow heart rate',
  hypotension: 'low blood pressure',
  cns_depression: 'sedation',
  anticholinergic: 'anticholinergic load',
  serotonergic: 'serotonin effects',
  hepatotoxic: 'liver stress',
  nephrotoxic: 'kidney stress',
  hyperkalemia: 'high potassium',
  hypoglycemia: 'low blood sugar',
  myopathy: 'muscle damage',
  hyponatremia: 'low sodium',
  cyp_metabolism: 'liver (CYP) metabolism',
  cyp_inhibitor_or_inducer: 'CYP inhibitor/inducer',
  renal_clearance: 'kidney clearance',
};
