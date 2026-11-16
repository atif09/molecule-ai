"""Polypharmacy tests. Offline: only the 11 local names, PubChem is mocked.
Run `bash scripts/train_models.sh` first so the ADMET models exist."""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import molecule_service
from app.services import polypharmacy_kb as kbmod
from app.services import polypharmacy_service as svc

client = TestClient(app)
URL = "/api/v1/polypharmacy/analyze"
PRESET = ["warfarin", "aspirin", "metformin", "amiodarone", "ibuprofen"]


@pytest.fixture(autouse=True)
def no_network(monkeypatch):
    monkeypatch.setattr(molecule_service, "fetch_smiles_from_pubchem_sync", lambda name: None)


def post(meds, age=78, **kw):
    body = {"medications": meds}
    if age is not None:
        body["age"] = age
    return client.post(URL, json=body)


def types(data, t):
    return [i for i in data["interactions"] if i["type"] == t]


# ── helpers for pure engine tests ────────────────────────────────────────────

def prof(index, name, **kb_over):
    base = {"class": "x", "cyp_substrate": [], "cyp_inhibitor": {}, "cyp_inducer": [], "prodrug_via": [],
            "sensitive": False, "pd": {}, "renal_clearance": False, "beers": None}
    base.update(kb_over)
    return {"index": index, "name": name, "kb": base, "in_kb": True, "beers_flag": None}


# ── 1-10 API tests ───────────────────────────────────────────────────────────

def test_warfarin_aspirin_major():
    d = post(["warfarin", "aspirin"]).json()
    assert any(i["severity"] == "major" for i in d["interactions"])


def test_warfarin_amiodarone_pk_inhibition_major():
    d = post(["warfarin", "amiodarone"]).json()
    f = types(d, "pk_inhibition")
    assert f and f[0]["severity"] == "major"


def test_aspirin_ibuprofen_bleeding_overlap():
    d = post(["aspirin", "ibuprofen"]).json()
    assert any(i["severity"] in ("moderate", "major") and "bleeding" in i["title"].lower()
               for i in types(d, "pd_overlap"))


def test_prodrug_and_known_pair():
    d = post(["tamoxifen", "amiodarone"]).json()
    assert types(d, "prodrug_blocked")
    d = post(["warfarin", "tamoxifen"]).json()
    assert any(i["severity"] == "major" for i in types(d, "known_pair"))


def test_metformin_caffeine_clean():
    d = post(["metformin", "caffeine"]).json()
    assert d["interactions"] == []
    assert d["overall"]["safety_score"] == 100
    assert d["overall"]["level"] == "low"


def test_dedupe_gives_422():
    assert post(["Aspirin", "aspirin "]).status_code == 422
    assert post(["acetaminophen", "paracetamol"]).status_code == 422


def test_unresolved_paths():
    r = post(["aspirin", "xyzdrug", "caffeine"])
    assert r.status_code == 200
    d = r.json()
    assert len(d["unresolved"]) == 1 and d["unresolved"][0]["input"] == "xyzdrug"
    assert all(m["input"] != "xyzdrug" for m in d["medications"])
    assert post(["aspirin", "xyzdrug"]).status_code == 422


def test_age_and_beers():
    d = post(["warfarin", "aspirin"], age=40).json()
    assert all(m["beers_flag"] is None for m in d["medications"]) and d["age_assumed"] is False
    d = post(["warfarin", "aspirin"], age=80).json()
    assert d["medications"][0]["beers_flag"]
    d = post(["warfarin", "aspirin"], age=None).json()
    assert d["medications"][0]["beers_flag"] and d["age_assumed"] is True and d["age"] is None


def test_bad_age_and_counts():
    assert post(["aspirin", "caffeine"], age=200).status_code == 422
    assert post(["aspirin"]).status_code == 422
    assert post(["a1", "b2", "c3", "d4", "e5", "f6", "g7", "h8", "i9", "j10", "k11"]).status_code == 422


def test_contract_shape():
    d = post(PRESET).json()
    for k in ("age", "age_assumed", "regimen", "unresolved", "medications", "interactions", "matrix",
              "body_burden", "boiled_egg_summary", "overall", "disclaimer", "processing_time_ms"):
        assert k in d
    for k in ("requested", "resolved", "polypharmacy_level", "kb_coverage"):
        assert k in d["regimen"]
    m = d["medications"][0]
    for k in ("index", "input", "name", "canonical_smiles", "molecular_weight", "in_kb", "drug_class",
              "narrow_therapeutic_index", "beers_flag", "descriptors", "boiled_egg", "admet"):
        assert k in m
    assert m["admet"]["absorption"].keys() == {"pass", "label"}
    assert [x["index"] for x in d["medications"]] == list(range(1, 6))
    n = d["matrix"]["size"]
    cells = d["matrix"]["cells"]
    assert n == 5 and len(cells) == n
    for i in range(n):
        assert len(cells[i]) == n and cells[i][i] is None
        for j in range(n):
            assert cells[i][j] == cells[j][i]
    assert [b["system"] for b in d["body_burden"]] == ["heart", "brain", "liver", "kidney", "blood", "gut", "metabolic"]
    ranks = [svc.SEVERITY_RANK[i["severity"]] for i in d["interactions"]]
    assert ranks == sorted(ranks)
    assert sum(d["boiled_egg_summary"].values()) == 5


def test_preset_regimen():
    d = post(PRESET).json()
    assert d["regimen"]["polypharmacy_level"] == "polypharmacy"
    assert d["overall"]["level"] in ("high", "severe")
    assert d["processing_time_ms"] < 5000
    assert d["disclaimer"]


def test_503_when_models_missing(monkeypatch):
    def boom(fv):
        raise FileNotFoundError("nope")
    monkeypatch.setattr(svc, "predict_admet", boom)
    r = post(["aspirin", "caffeine"])
    assert r.status_code == 503
    assert "train_models.sh" in r.json()["detail"]


# ── 11 pure engine tests ─────────────────────────────────────────────────────

def test_tag_thresholds():
    def sev(w1, w2):
        ps = [prof(1, "a", pd={"bleeding": w1}), prof(2, "b", pd={"bleeding": w2})]
        return svc.find_interactions(ps)[0]["severity"]
    assert sev(1, 1) == "minor"
    assert sev(1, 2) == "moderate"
    assert sev(3, 2) == "major"


def test_single_contributor_no_finding():
    assert svc.find_interactions([prof(1, "a", pd={"bleeding": 3}), prof(2, "b")]) == []


def test_overrides():
    ser = lambda w: [prof(1, "a", pd={"serotonergic": w}), prof(2, "b", pd={"serotonergic": w})]
    assert svc.find_interactions(ser(1))[0]["severity"] == "minor"   # 2
    assert svc.find_interactions(ser(2))[0]["severity"] == "major"   # 4
    neph = [prof(1, "a", pd={"nephrotoxic": 2}), prof(2, "b", pd={"nephrotoxic": 2})]
    assert svc.find_interactions(neph)[0]["severity"] == "major"
    gi = [prof(1, "a", pd={"gi_irritation": 2}), prof(2, "b", pd={"gi_irritation": 2})]
    assert svc.find_interactions(gi)[0]["severity"] == "moderate"    # major only at 6


def test_triple_group_single_finding():
    ps = [prof(i, n, pd={"hyperkalemia": 2}) for i, n in ((1, "a"), (2, "b"), (3, "c"))]
    f = svc.find_interactions(ps)
    assert len(f) == 1 and f[0]["drugs"] == [1, 2, 3] and f[0]["severity"] == "major"


def test_pk_rules():
    inh = prof(1, "inh", cyp_inhibitor={"CYP3A4": "moderate"})
    assert svc.find_interactions([inh, prof(2, "y", cyp_substrate=["CYP3A4"])])[0]["severity"] == "moderate"
    assert svc.find_interactions([inh, prof(2, "y", cyp_substrate=["CYP3A4"], sensitive=True)])[0]["severity"] == "major"
    strong = prof(1, "inh", cyp_inhibitor={"CYP3A4": "strong"})
    assert svc.find_interactions([strong, prof(2, "y", cyp_substrate=["CYP3A4"])])[0]["severity"] == "major"
    ind = prof(1, "ind", cyp_inducer=["CYP3A4"])
    f = svc.find_interactions([ind, prof(2, "y", cyp_substrate=["CYP3A4"])])[0]
    assert f["type"] == "pk_induction" and f["severity"] == "moderate"
    pro = prof(2, "pro", cyp_substrate=["CYP2D6"], prodrug_via=["CYP2D6"])
    f = svc.find_interactions([prof(1, "inh", cyp_inhibitor={"CYP2D6": "strong"}), pro])
    assert [x["type"] for x in f] == ["prodrug_blocked"]


def test_duplication_and_antiplatelet_exempt():
    s = lambda i, n: prof(i, n, **{"class": "statin"})
    assert svc.find_interactions([s(1, "a"), s(2, "b")])[0]["type"] == "duplication"
    ap = lambda i, n: prof(i, n, **{"class": "antiplatelet"})
    assert svc.find_interactions([ap(1, "a"), ap(2, "b")]) == []


def test_burden_formula():
    ps = [prof(1, "a", pd={"bleeding": 3}, cyp_substrate=["CYP3A4"], cyp_inhibitor={"CYP3A4": "moderate"},
               renal_clearance=True),
          prof(2, "b", pd={"bleeding": 2, "nephrotoxic": 2})]
    b = {x["system"]: x for x in svc.compute_body_burden(ps)}
    assert b["blood"]["score"] == round(5 / 8 * 100)
    assert b["liver"]["score"] == round((0.75 + 1.0) / 8 * 100)
    assert b["kidney"]["score"] == round((2 + 1.0) / 8 * 100)
    assert svc.compute_body_burden([prof(1, "a", pd={"bleeding": 3}) ] * 4)[4]["score"] == 100
    assert b["heart"]["score"] == 0 and b["heart"]["contributors"] == []


def test_scoring_formula():
    ps = [dict(prof(i, f"d{i}"), beers_flag=("x" if i <= 2 else None)) for i in range(1, 5)]
    fs = [{"severity": "major", "action": "a1"}, {"severity": "moderate", "action": "a2"},
          {"severity": "moderate", "action": "a2"}, {"severity": "minor", "action": "a3"}]
    o = svc.compute_overall(ps, fs, svc.compute_body_burden(ps))
    assert o["safety_score"] == 100 - 25 - 20 - 3 - 10
    assert o["level"] == "high" and o["top_actions"] == ["a1", "a2", "a3"]
    floor = svc.compute_overall(ps, [{"severity": "major", "action": "x"}] * 5, svc.compute_body_burden(ps))
    assert floor["safety_score"] == 0 and floor["level"] == "severe"
    assert svc.polypharmacy_level(4) == "none" and svc.polypharmacy_level(5) == "polypharmacy"
    assert svc.polypharmacy_level(10) == "hyper_polypharmacy"


def test_coverage_warning_in_summary():
    ps = [prof(1, "a"), dict(prof(2, "b"), in_kb=False, kb=None)]
    o = svc.compute_overall(ps, [], svc.compute_body_burden(ps))
    assert "No findings does not mean safe" in o["summary"]


def test_clean_name():
    assert svc.clean_name("Warfarin 5mg") == "warfarin"
    assert svc.clean_name("Metformin HCl 500 mg tablets") == "metformin"
    assert svc.clean_name("Tylenol") == "paracetamol"
    assert svc.clean_name("5-fluorouracil") == "5-fluorouracil"


def test_boiled_egg_zone():
    assert svc.boiled_egg_zone(38, 1.8) == "bbb"
    assert svc.boiled_egg_zone(120, 2.4) == "hia"
    assert svc.boiled_egg_zone(200, 8) == "outside"


# ── 12 KB integrity ──────────────────────────────────────────────────────────

def test_kb_integrity():
    for name, d in kbmod.KB.items():
        assert d["class"], name
        for e in d["cyp_substrate"] + list(d["cyp_inhibitor"]) + d["cyp_inducer"] + d["prodrug_via"]:
            assert e in kbmod.ALLOWED_CYPS, (name, e)
        assert all(s in ("strong", "moderate") for s in d["cyp_inhibitor"].values()), name
        for tag, w in d["pd"].items():
            assert tag in kbmod.TAGS and w in (1, 2, 3), (name, tag)
    for alias, target in kbmod.ALIASES.items():
        assert target in kbmod.KB, alias
    for t in kbmod.TAGS.values():
        assert t["system"] in {s for s, _ in kbmod.SYSTEMS}
    for kp in kbmod.KNOWN_PAIRS:
        assert all(n in kbmod.KB for n in kp["drugs"])
