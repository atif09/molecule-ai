"""Polypharmacy knowledge base. DATA ONLY - no logic.

Sources (to be reviewed by a clinician/pharmacist before any demo):
  * FDA "Drug Development and Drug Interactions: Table of Substrates,
    Inhibitors and Inducers" (CYP substrate/inhibitor/inducer classes).
  * AGS Beers Criteria (2023) for the per-drug older-adult notes.
Screening aid only. Not medical advice.
"""

ALLOWED_CYPS = {"CYP1A2", "CYP2B6", "CYP2C8", "CYP2C9", "CYP2C19", "CYP2D6", "CYP2E1", "CYP3A4"}

# tag -> system, moderate_at, major_at
TAGS = {
    "bleeding": {"system": "blood", "meaning": "bleeding risk", "moderate_at": 3, "major_at": 5},
    "gi_irritation": {"system": "gut", "meaning": "stomach/gut irritation", "moderate_at": 3, "major_at": 6},
    "qt_prolongation": {"system": "heart", "meaning": "heart rhythm (QT) prolongation", "moderate_at": 3, "major_at": 5},
    "bradycardia": {"system": "heart", "meaning": "slow heart rate or heart block", "moderate_at": 3, "major_at": 4},
    "hypotension": {"system": "heart", "meaning": "low blood pressure and falls", "moderate_at": 3, "major_at": 5},
    "cns_depression": {"system": "brain", "meaning": "sedation and falls", "moderate_at": 3, "major_at": 5},
    "anticholinergic": {"system": "brain", "meaning": "confusion and urinary retention", "moderate_at": 3, "major_at": 5},
    "serotonergic": {"system": "brain", "meaning": "serotonin syndrome", "moderate_at": 3, "major_at": 4},
    "hepatotoxic": {"system": "liver", "meaning": "liver stress", "moderate_at": 3, "major_at": 5},
    "nephrotoxic": {"system": "kidney", "meaning": "kidney stress", "moderate_at": 3, "major_at": 4},
    "hyperkalemia": {"system": "kidney", "meaning": "high potassium", "moderate_at": 3, "major_at": 5},
    "hypoglycemia": {"system": "metabolic", "meaning": "low blood sugar", "moderate_at": 3, "major_at": 5},
    "myopathy": {"system": "metabolic", "meaning": "muscle damage", "moderate_at": 3, "major_at": 5},
    "hyponatremia": {"system": "metabolic", "meaning": "low sodium", "moderate_at": 3, "major_at": 5},
}

# Contract order.
SYSTEMS = [
    ("heart", "Heart & circulation"),
    ("brain", "Brain & nervous system"),
    ("liver", "Liver"),
    ("kidney", "Kidney & electrolytes"),
    ("blood", "Blood & clotting"),
    ("gut", "Stomach & gut"),
    ("metabolic", "Metabolism & muscle"),
]

# Classes where co-prescription is rarely intended (rule 5, duplication).
DUPLICATION_CLASSES = {
    "statin", "NSAID", "SSRI", "benzodiazepine", "loop_diuretic",
    "ACE_inhibitor", "PPI", "beta_blocker", "opioid", "tricyclic",
}

# Curated pair overrides (rule 6). Key = frozenset of two drug names.
# Sources: FDA/Lexicomp-style labelling; needs pharmacist review.
KNOWN_PAIRS = [
    {   # Warfarin label: tamoxifen reported to increase INR.
        "drugs": ("warfarin", "tamoxifen"),
        "severity": "major",
        "title": "Tamoxifen may raise warfarin's blood-thinning effect",
        "mechanism": "Higher INR has been reported when tamoxifen is added to warfarin.",
        "consequence": "Greater risk of serious bleeding.",
        "action": "Ask the prescriber about closer INR monitoring and possible warfarin dose review.",
    },
    {   # Digoxin label: amiodarone raises serum digoxin concentration.
        "drugs": ("digoxin", "amiodarone"),
        "severity": "major",
        "title": "Amiodarone may raise digoxin levels",
        "mechanism": "Amiodarone reduces digoxin clearance and raises digoxin blood levels.",
        "consequence": "Digoxin toxicity: nausea, vision changes, dangerous heart rhythms.",
        "action": "Ask the prescriber about digoxin level monitoring and possible dose reduction.",
    },
    {   # Loop diuretic-induced hypokalemia potentiates digoxin toxicity.
        "drugs": ("digoxin", "furosemide"),
        "severity": "moderate",
        "title": "Furosemide can lower potassium and increase digoxin toxicity risk",
        "mechanism": "Furosemide can cause low potassium, which makes the heart more sensitive to digoxin.",
        "consequence": "Higher risk of digoxin toxicity and heart rhythm problems.",
        "action": "Ask about potassium and digoxin level checks.",
    },
]

ALIASES = {
    "acetaminophen": "paracetamol", "tylenol": "paracetamol",
    "coumadin": "warfarin",
    "advil": "ibuprofen", "motrin": "ibuprofen",
    "ciclosporin": "cyclosporin", "cyclosporine": "cyclosporin",
    "lasix": "furosemide", "plavix": "clopidogrel",
    "zocor": "simvastatin", "lipitor": "atorvastatin",
    "prozac": "fluoxetine", "zoloft": "sertraline", "paxil": "paroxetine",
    "valium": "diazepam", "xanax": "alprazolam", "ambien": "zolpidem",
    "benadryl": "diphenhydramine", "neurontin": "gabapentin",
    "glucophage": "metformin", "norvasc": "amlodipine",
    "lanoxin": "digoxin", "prilosec": "omeprazole",
}


def _d(cls, s=(), inh=None, ind=(), prodrug=(), sens=False, pd=None, renal=False, beers=None):
    return {
        "class": cls,
        "cyp_substrate": list(s),
        "cyp_inhibitor": dict(inh or {}),
        "cyp_inducer": list(ind),
        "prodrug_via": list(prodrug),
        "sensitive": sens,
        "pd": dict(pd or {}),
        "renal_clearance": renal,
        "beers": beers,
    }


KB = {
    "warfarin": _d("anticoagulant", ["CYP2C9", "CYP3A4", "CYP1A2"], sens=True, pd={"bleeding": 3},
                   beers="Avoid starting as first-line unless alternatives are unsuitable"),
    "aspirin": _d("antiplatelet", pd={"bleeding": 2, "gi_irritation": 2},
                  beers="Avoid starting for primary prevention"),
    "ibuprofen": _d("NSAID", ["CYP2C9"], pd={"bleeding": 2, "gi_irritation": 2, "nephrotoxic": 2, "hyperkalemia": 1},
                    beers="Avoid chronic use; avoid if CrCl < 30"),
    "paracetamol": _d("analgesic", ["CYP2E1", "CYP1A2", "CYP3A4"], pd={"hepatotoxic": 1}),
    "metformin": _d("biguanide", renal=True),
    "caffeine": _d("stimulant", ["CYP1A2"]),
    "imatinib": _d("kinase_inhibitor", ["CYP3A4", "CYP2D6"], inh={"CYP3A4": "moderate", "CYP2D6": "moderate"},
                   pd={"hepatotoxic": 2}),
    "tamoxifen": _d("SERM", ["CYP2D6", "CYP3A4"], prodrug=["CYP2D6"], pd={"qt_prolongation": 1}),
    "amiodarone": _d("antiarrhythmic", ["CYP3A4", "CYP2C8"],
                     inh={"CYP2C9": "moderate", "CYP2D6": "moderate", "CYP3A4": "moderate", "CYP1A2": "moderate"},
                     sens=True, pd={"qt_prolongation": 3, "bradycardia": 2, "hepatotoxic": 2},
                     beers="Avoid as first-line for AF unless HF or LV hypertrophy"),
    "cyclosporin": _d("immunosuppressant", ["CYP3A4"], inh={"CYP3A4": "moderate"}, sens=True,
                      pd={"nephrotoxic": 3, "hyperkalemia": 2}),
    "simvastatin": _d("statin", ["CYP3A4"], sens=True, pd={"myopathy": 2, "hepatotoxic": 1}),
    "atorvastatin": _d("statin", ["CYP3A4"], pd={"myopathy": 2, "hepatotoxic": 1}),
    "lisinopril": _d("ACE_inhibitor", renal=True, pd={"hypotension": 2, "hyperkalemia": 2, "nephrotoxic": 1}),
    "amlodipine": _d("CCB_DHP", ["CYP3A4"], pd={"hypotension": 2}),
    "diltiazem": _d("CCB_nonDHP", ["CYP3A4"], inh={"CYP3A4": "moderate"}, pd={"bradycardia": 2, "hypotension": 2}),
    "metoprolol": _d("beta_blocker", ["CYP2D6"], pd={"hypotension": 2, "bradycardia": 2}),
    "furosemide": _d("loop_diuretic", pd={"hypotension": 2, "nephrotoxic": 1, "hyponatremia": 1}),
    "spironolactone": _d("K_sparing_diuretic", pd={"hyperkalemia": 3, "hypotension": 1}),
    "digoxin": _d("cardiac_glycoside", sens=True, renal=True, pd={"bradycardia": 2},
                  beers="Avoid as first-line for AF/HF; if used avoid > 0.125 mg/day"),
    "omeprazole": _d("PPI", ["CYP2C19", "CYP3A4"], inh={"CYP2C19": "moderate"},
                     beers="Avoid > 8 weeks unless justified"),
    "clopidogrel": _d("antiplatelet", prodrug=["CYP2C19"], pd={"bleeding": 2}),
    "sertraline": _d("SSRI", ["CYP2C19", "CYP2B6", "CYP3A4"], inh={"CYP2D6": "moderate"},
                     pd={"serotonergic": 2, "bleeding": 1, "hyponatremia": 1},
                     beers="Use with caution (hyponatremia, falls)"),
    "fluoxetine": _d("SSRI", ["CYP2D6", "CYP2C9"], inh={"CYP2D6": "strong", "CYP2C19": "moderate"},
                     pd={"serotonergic": 2, "bleeding": 1, "hyponatremia": 1},
                     beers="Use with caution (hyponatremia, falls)"),
    "paroxetine": _d("SSRI", ["CYP2D6"], inh={"CYP2D6": "strong"},
                     pd={"serotonergic": 2, "anticholinergic": 2, "bleeding": 1, "hyponatremia": 1},
                     beers="Avoid (strongly anticholinergic)"),
    "amitriptyline": _d("tricyclic", ["CYP2D6", "CYP2C19", "CYP3A4"],
                        pd={"anticholinergic": 3, "cns_depression": 2, "qt_prolongation": 2,
                            "hypotension": 1, "serotonergic": 1},
                        beers="Avoid"),
    "diazepam": _d("benzodiazepine", ["CYP2C19", "CYP3A4"], pd={"cns_depression": 3}, beers="Avoid"),
    "alprazolam": _d("benzodiazepine", ["CYP3A4"], pd={"cns_depression": 3}, beers="Avoid"),
    "zolpidem": _d("sedative_hypnotic", ["CYP3A4"], pd={"cns_depression": 3}, beers="Avoid"),
    "diphenhydramine": _d("antihistamine_1st_gen", ["CYP2D6"], inh={"CYP2D6": "moderate"},
                          pd={"anticholinergic": 3, "cns_depression": 2}, beers="Avoid"),
    "gabapentin": _d("gabapentinoid", renal=True, pd={"cns_depression": 2},
                     beers="Avoid combining with opioids or benzodiazepines"),
    "tramadol": _d("opioid", ["CYP2D6", "CYP3A4"], prodrug=["CYP2D6"],
                   pd={"serotonergic": 2, "cns_depression": 2},
                   beers="Use with caution; avoid with other CNS-active drugs"),
    "clarithromycin": _d("macrolide", ["CYP3A4"], inh={"CYP3A4": "strong"}, pd={"qt_prolongation": 2}),
    "ciprofloxacin": _d("fluoroquinolone", inh={"CYP1A2": "strong"}, pd={"qt_prolongation": 2}),
    "fluconazole": _d("azole_antifungal", inh={"CYP2C9": "moderate", "CYP2C19": "strong", "CYP3A4": "moderate"},
                      pd={"qt_prolongation": 2}),
    "carbamazepine": _d("anticonvulsant", ["CYP3A4"], ind=["CYP3A4", "CYP2C9", "CYP1A2", "CYP2C19"], sens=True,
                        pd={"cns_depression": 1, "hyponatremia": 2}),
    "glipizide": _d("sulfonylurea", ["CYP2C9"], pd={"hypoglycemia": 3}, beers="Use with caution"),
    "donepezil": _d("cholinesterase_inhibitor", ["CYP2D6", "CYP3A4"], pd={"bradycardia": 2, "qt_prolongation": 2},
                    beers="Avoid in syncope"),
}
