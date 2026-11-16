"""Polypharmacy analysis: input cleaning, resolution, per-drug profile,
interaction engine, body burden and scoring.

Findings come ONLY from the curated KB (polypharmacy_kb.py) and transparent
structure-based checks. Nothing is predicted or invented. Screening aid only.
"""
import itertools
import re
import time
from concurrent.futures import ThreadPoolExecutor

from rdkit import Chem, DataStructs
from rdkit.Chem import AllChem

from app.services import polypharmacy_kb as kbmod
from app.services.featurizer import compute_features
from app.services.molecule_service import parse_molecule, _looks_like_smiles
from app.services.prediction_service import predict_admet

DISCLAIMER = (
    "Screening aid only. Not medical advice. Do not start, stop or change any medicine "
    "without talking to a doctor or pharmacist. ADMET values are model estimates trained "
    "on synthetic data, not clinical evidence. No findings does not mean safe."
)

SEVERITY_RANK = {"major": 0, "moderate": 1, "minor": 2}
TYPE_RANK = {"known_pair": 0, "pk_inhibition": 1, "pk_induction": 2, "prodrug_blocked": 3,
             "pd_overlap": 4, "duplication": 5, "structural_similarity": 6}

MIN_MEDS, MAX_MEDS = 2, 10
TANIMOTO_THRESHOLD = 0.6

# BOILED-Egg geometry: mirrors frontend/src/components/shared/BoiledEggPlot.jsx (x=TPSA, y=LogP)
HIA_ELLIPSE = ((71.3, 2.4), (71.0, 3.1))
BBB_ELLIPSE = ((38.1, 1.8), (40.0, 1.8))

_DOSE_RE = re.compile(r"\s*\d+(?:\.\d+)?\s*(?:mg|mcg|ug|µg|g|ml|iu|units?)\b.*$")
_SALT_RE = re.compile(r"\b(?:hydrochloride|hcl|sodium|maleate|mesylate|tartrate|tablets?|capsules?)\b")


class ModelsMissingError(Exception):
    pass


# ── 3.2 Input handling ───────────────────────────────────────────────────────

def clean_name(raw: str) -> str:
    s = raw.strip().lower()
    for _ in range(2):
        s = _DOSE_RE.sub("", s)
        s = _SALT_RE.sub(" ", s)
        s = re.sub(r"\s+", " ", s).strip()
    return kbmod.ALIASES.get(s, s)


def prepare_inputs(medications: list[str]) -> list[dict]:
    """Clean, alias and de-duplicate. Raises ValueError (-> 422) on bad counts."""
    seen, entries = set(), []
    for raw in medications:
        original = raw.strip()
        if not original:
            continue
        smiles = None
        if _looks_like_smiles(original) and " " not in original and Chem.MolFromSmiles(original) is not None:
            smiles = original
            key, name = original, original
        else:
            name = clean_name(original)
            if not name:
                continue
            key = name
        if key in seen:
            continue
        seen.add(key)
        entries.append({"input": raw.strip(), "name": name, "smiles": smiles})
    if len(entries) < MIN_MEDS:
        raise ValueError(f"Need at least {MIN_MEDS} distinct medications (got {len(entries)})")
    if len(entries) > MAX_MEDS:
        raise ValueError(f"At most {MAX_MEDS} distinct medications allowed (got {len(entries)})")
    return entries


def _resolve_one(entry: dict):
    try:
        if entry["smiles"]:
            return parse_molecule(entry["smiles"], "smiles")
        try:
            return parse_molecule(entry["name"], "auto")
        except ValueError as e:
            if str(e).startswith("Invalid SMILES"):
                return parse_molecule(entry["name"], "name")  # works around hyphen/digit names
            raise
    except Exception as e:  # fail closed: anything -> unresolved, never a 500
        return e


def resolve_all(entries: list[dict]):
    with ThreadPoolExecutor(max_workers=min(6, len(entries))) as ex:
        results = list(ex.map(_resolve_one, entries))
    resolved, unresolved = [], []
    for entry, res in zip(entries, results):
        if isinstance(res, Exception):
            reason = str(res) or f"Could not resolve '{entry['input']}'"
            unresolved.append({"input": entry["input"], "reason": reason})
        else:
            resolved.append((entry, res))
    return resolved, unresolved


# ── 3.3 Per-drug profile ─────────────────────────────────────────────────────

def _in_ellipse(x, y, ellipse) -> bool:
    (cx, cy), (rx, ry) = ellipse
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1


def boiled_egg_zone(tpsa: float, logp: float) -> str:
    if _in_ellipse(tpsa, logp, BBB_ELLIPSE):
        return "bbb"
    if _in_ellipse(tpsa, logp, HIA_ELLIPSE):
        return "hia"
    return "outside"


def build_profile(index: int, entry: dict, mol_info, age_applies_beers: bool) -> dict:
    mol = Chem.MolFromSmiles(mol_info.canonical_smiles)
    feat = compute_features(mol)
    desc = feat["descriptors"]
    logp, tpsa = round(float(desc["LogP"]), 2), round(float(desc["TPSA"]), 2)
    try:
        admet_raw = predict_admet(feat["feature_vector"])
    except FileNotFoundError as e:
        raise ModelsMissingError(str(e))
    admet = {"overall_admet_score": admet_raw["overall_admet_score"]}
    for prop in ("absorption", "distribution", "metabolism", "excretion", "toxicity"):
        admet[prop] = {"pass": admet_raw[prop]["pass"], "label": admet_raw[prop]["label"]}

    kb = None if entry["smiles"] else kbmod.KB.get(entry["name"])
    return {
        "index": index,
        "input": entry["input"],
        "name": entry["name"],
        "canonical_smiles": mol_info.canonical_smiles,
        "molecular_weight": mol_info.molecular_weight,
        "in_kb": kb is not None,
        "drug_class": kb["class"] if kb else None,
        "narrow_therapeutic_index": bool(kb["sensitive"]) if kb else False,
        "beers_flag": kb["beers"] if (kb and kb["beers"] and age_applies_beers) else None,
        "descriptors": {"LogP": logp, "TPSA": tpsa},
        "boiled_egg": {"tpsa": tpsa, "logp": logp, "zone": boiled_egg_zone(tpsa, logp)},
        "admet": admet,
        "kb": kb,  # internal; stripped before serialising
    }


# ── 3.5 / 3.6 Interaction engine ─────────────────────────────────────────────

def _sev_from_tag(tag: str, total: int) -> str:
    t = kbmod.TAGS[tag]
    if total >= t["major_at"]:
        return "major"
    if total >= t["moderate_at"]:
        return "moderate"
    return "minor"


def _finding(type_, severity, evidence, profiles, title, mechanism, consequence, action):
    profiles = sorted(profiles, key=lambda p: p["index"])
    return {
        "type": type_, "severity": severity, "evidence": evidence,
        "drugs": [p["index"] for p in profiles],
        "drug_names": [p["name"] for p in profiles],
        "title": title, "mechanism": mechanism, "consequence": consequence, "action": action,
    }


def _join(names):
    return ", ".join(names[:-1]) + " and " + names[-1] if len(names) > 1 else names[0]


def structural_findings(profiles: list[dict]) -> list[dict]:
    out = []
    fps = {}
    for p in profiles:
        smi = p.get("canonical_smiles")
        mol = Chem.MolFromSmiles(smi) if smi else None
        if mol is not None:
            fps[p["index"]] = AllChem.GetMorganFingerprintAsBitVect(mol, 2, nBits=2048)
    for a, b in itertools.combinations(profiles, 2):
        if a["index"] in fps and b["index"] in fps:
            sim = DataStructs.TanimotoSimilarity(fps[a["index"]], fps[b["index"]])
            if sim >= TANIMOTO_THRESHOLD:
                out.append(_finding(
                    "structural_similarity", "minor", "structural", [a, b],
                    f"{a['name']} and {b['name']} have similar structures",
                    f"Possible duplicate or overlapping chemistry (structural similarity {sim:.2f}).",
                    "They may act or be cleared in similar ways. Similarity alone does not prove an interaction.",
                    "Ask whether both medicines are really needed.",
                ))
    return out


def curated_findings(profiles: list[dict]) -> list[dict]:
    """KB-driven findings. Profiles need: index, name, kb (dict or None)."""
    known = [p for p in profiles if p.get("kb")]
    out = []

    # 1-3: pk_inhibition, pk_induction, prodrug_blocked (grouped per ordered pair)
    for x, y in itertools.permutations(known, 2):
        kx, ky = x["kb"], y["kb"]
        inhib = {e: s for e, s in kx["cyp_inhibitor"].items()
                 if e in ky["cyp_substrate"] and e not in ky["prodrug_via"]}
        if inhib:
            enzymes = sorted(inhib)
            sev = "major" if ky["sensitive"] or "strong" in inhib.values() else "moderate"
            out.append(_finding(
                "pk_inhibition", sev, "curated", [x, y],
                f"{x['name'].capitalize()} may raise {y['name']} levels",
                f"{x['name'].capitalize()} inhibits {_join(enzymes)}, which helps clear {y['name']} from the body.",
                (f"Higher {y['name']} levels. {y['name'].capitalize()} has a narrow safety margin, so side effects can be serious."
                 if ky["sensitive"] else f"Higher {y['name']} levels and more side effects."),
                f"Ask the prescriber or pharmacist whether {y['name']} needs a dose review or extra monitoring.",
            ))
        induced = [e for e in kx["cyp_inducer"] if e in ky["cyp_substrate"]]
        if induced:
            out.append(_finding(
                "pk_induction", "major" if ky["sensitive"] else "moderate", "curated", [x, y],
                f"{x['name'].capitalize()} may reduce the effect of {y['name']}",
                f"{x['name'].capitalize()} speeds up {_join(sorted(induced))}, which clears {y['name']} faster.",
                f"Lower {y['name']} levels, so it may work less well.",
                f"Ask the prescriber or pharmacist whether {y['name']} needs monitoring or a dose review.",
            ))
        blocked = sorted(e for e in kx["cyp_inhibitor"] if e in ky["prodrug_via"])
        if blocked:
            out.append(_finding(
                "prodrug_blocked", "moderate", "curated", [x, y],
                f"{x['name'].capitalize()} may reduce the effect of {y['name']}",
                f"{y['name'].capitalize()} must be activated by {_join(blocked)}, and {x['name']} inhibits it.",
                f"{y['name'].capitalize()} may work less well.",
                f"Ask the prescriber or pharmacist whether {y['name']} is still the right choice with {x['name']}.",
            ))

    # 4: pd_overlap (one finding per tag, all contributors)
    for tag, info in kbmod.TAGS.items():
        contrib = [p for p in known if p["kb"]["pd"].get(tag, 0) > 0]
        if len(contrib) < 2:
            continue
        total = sum(p["kb"]["pd"][tag] for p in contrib)
        names = [p["name"] for p in sorted(contrib, key=lambda p: p["index"])]
        out.append(_finding(
            "pd_overlap", _sev_from_tag(tag, total), "curated", contrib,
            f"Combined {info['meaning']}: {_join(names)}",
            f"Each of these medicines adds to {info['meaning']}. The effects stack when taken together.",
            f"Higher chance of {info['meaning']}.",
            f"Ask the prescriber or pharmacist whether all of these medicines are still needed and what to watch for ({info['meaning']}).",
        ))

    # 5: duplication (same class, only classes rarely co-prescribed on purpose)
    by_class = {}
    for p in known:
        if p["kb"]["class"] in kbmod.DUPLICATION_CLASSES:
            by_class.setdefault(p["kb"]["class"], []).append(p)
    for cls, group in by_class.items():
        if len(group) >= 2:
            names = [p["name"] for p in sorted(group, key=lambda p: p["index"])]
            out.append(_finding(
                "duplication", "moderate", "curated", group,
                f"More than one {cls.replace('_', ' ')} medicine: {_join(names)}",
                "These medicines belong to the same drug class and act in the same way.",
                "Taking more than one raises side effects without adding benefit.",
                "Ask whether taking more than one of these is intended.",
            ))

    # 6: curated known pairs
    by_name = {p["name"]: p for p in known}
    for kp in kbmod.KNOWN_PAIRS:
        a, b = kp["drugs"]
        if a in by_name and b in by_name:
            out.append(_finding("known_pair", kp["severity"], "curated", [by_name[a], by_name[b]],
                                kp["title"], kp["mechanism"], kp["consequence"], kp["action"]))
    return out


def find_interactions(profiles: list[dict]) -> list[dict]:
    findings = curated_findings(profiles) + structural_findings(profiles)
    findings.sort(key=lambda f: (SEVERITY_RANK[f["severity"]], TYPE_RANK[f["type"]], f["drugs"], f["title"]))
    for i, f in enumerate(findings, 1):
        f["id"] = f"int-{i}"
    return findings


def build_matrix(n: int, interactions: list[dict]) -> dict:
    cells = [[None] * n for _ in range(n)]
    for f in interactions:
        for a, b in itertools.combinations(f["drugs"], 2):
            for i, j in ((a - 1, b - 1), (b - 1, a - 1)):
                cur = cells[i][j]
                if cur is None or SEVERITY_RANK[f["severity"]] < SEVERITY_RANK[cur]:
                    cells[i][j] = f["severity"]
    return {"size": n, "cells": cells}


# ── 3.7 Body burden ──────────────────────────────────────────────────────────
# NOTE: relative burden index, not dose-adjusted.

def compute_body_burden(profiles: list[dict]) -> list[dict]:
    result = []
    for system, label in kbmod.SYSTEMS:
        raw, contributors = 0.0, []

        def add(p, tag, w):
            nonlocal raw
            raw += w
            contributors.append({"drug_index": p["index"], "drug": p["name"], "tag": tag, "weight": w})

        for p in profiles:
            kb = p.get("kb")
            if not kb:
                continue
            for tag, w in kb["pd"].items():
                if kbmod.TAGS[tag]["system"] == system:
                    add(p, tag, w)
            if system == "liver":
                if kb["cyp_substrate"]:
                    add(p, "cyp_metabolism", 0.75)
                if kb["cyp_inhibitor"] or kb["cyp_inducer"]:
                    add(p, "cyp_inhibitor_or_inducer", 1.0)
            if system == "kidney" and kb["renal_clearance"]:
                add(p, "renal_clearance", 1.0)
        result.append({"system": system, "label": label,
                       "score": min(100, round(raw / 8 * 100)), "contributors": contributors})
    return result


# ── 3.8 Overall ──────────────────────────────────────────────────────────────

def polypharmacy_level(n: int) -> str:
    return "none" if n < 5 else ("polypharmacy" if n < 10 else "hyper_polypharmacy")


def compute_overall(profiles: list[dict], interactions: list[dict], burden: list[dict]) -> dict:
    counts = {s: sum(1 for f in interactions if f["severity"] == s) for s in ("major", "moderate", "minor")}
    beers = sum(1 for p in profiles if p.get("beers_flag"))
    score = max(0, 100 - 25 * counts["major"] - 10 * counts["moderate"] - 3 * counts["minor"] - 5 * beers)
    if score >= 80:
        level, label = "low", "Low concern"
    elif score >= 60:
        level, label = "moderate", "Moderate concern"
    elif score >= 35:
        level, label = "high", "High concern"
    else:
        level, label = "severe", "Severe concern"

    actions = []
    for f in interactions:  # already major-first
        if f["action"] not in actions:
            actions.append(f["action"])
        if len(actions) == 3:
            break

    n = len(profiles)
    parts = [f"{counts[s]} {s}" for s in ("major", "moderate", "minor") if counts[s]]
    found = (_join(parts) + " finding" + ("s" if sum(counts.values()) > 1 else "")) if parts else "no findings"
    summary = f"{n} medicines, {found}."
    top = [b for b in sorted(burden, key=lambda b: -b["score"])[:2] if b["score"] > 0]
    if top:
        summary += " Highest-load systems: " + ", ".join(b["system"].capitalize() for b in top) + "."
    missing = [p for p in profiles if not p["in_kb"]]
    if missing:
        summary += (f" {len(missing)} of {n} medicines have no curated interaction data; only "
                    "structure-based checks were applied. No findings does not mean safe.")
    return {"safety_score": score, "level": level, "label": label, "counts": counts,
            "summary": summary, "top_actions": actions}


# ── Orchestration ────────────────────────────────────────────────────────────

def analyze_regimen(medications: list[str], age: int | None) -> dict:
    t0 = time.perf_counter()
    entries = prepare_inputs(medications)
    resolved, unresolved = resolve_all(entries)
    if len(resolved) < MIN_MEDS:
        raise ValueError(f"Need at least {MIN_MEDS} recognizable medications (resolved {len(resolved)})")

    beers_applies = age is None or age >= 65
    profiles = [build_profile(i, e, info, beers_applies) for i, (e, info) in enumerate(resolved, 1)]

    interactions = find_interactions(profiles)
    burden = compute_body_burden(profiles)
    overall = compute_overall(profiles, interactions, burden)

    zones = {"bbb": 0, "hia": 0, "outside": 0}
    for p in profiles:
        zones[p["boiled_egg"]["zone"]] += 1

    meds = [{k: v for k, v in p.items() if k != "kb"} for p in profiles]
    return {
        "age": age,
        "age_assumed": age is None,
        "regimen": {
            "requested": len(entries),
            "resolved": len(profiles),
            "polypharmacy_level": polypharmacy_level(len(profiles)),
            "kb_coverage": {"known": sum(1 for p in profiles if p["in_kb"]), "total": len(profiles)},
        },
        "unresolved": unresolved,
        "medications": meds,
        "interactions": interactions,
        "matrix": build_matrix(len(profiles), interactions),
        "body_burden": burden,
        "boiled_egg_summary": zones,
        "overall": overall,
        "disclaimer": DISCLAIMER,
        "processing_time_ms": round((time.perf_counter() - t0) * 1000, 1),
    }
