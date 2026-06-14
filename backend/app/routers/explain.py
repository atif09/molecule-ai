from fastapi import APIRouter, HTTPException
from rdkit import Chem

from app.models.schemas import MoleculeParseRequest
from app.services.molecule_service import parse_molecule
from app.services.featurizer import compute_features
from app.services.prediction_service import _load_binding_model

router = APIRouter(prefix="/explain", tags=["Explain"])

DESCRIPTOR_NAMES = [
    "MolWt", "LogP", "NumHDonors", "NumHAcceptors", "TPSA",
    "NumRotatableBonds", "NumAromaticRings", "NumHeavyAtoms",
    "FractionCSP3", "NumRings", "MolMR", "LabuteASA",
]

DESCRIPTOR_LABELS = {
    "MolWt":             "Molecular Weight",
    "LogP":              "Lipophilicity (LogP)",
    "NumHDonors":        "H-Bond Donors",
    "NumHAcceptors":     "H-Bond Acceptors",
    "TPSA":              "Polar Surface Area",
    "NumRotatableBonds": "Rotatable Bonds",
    "NumAromaticRings":  "Aromatic Rings",
    "NumHeavyAtoms":     "Heavy Atom Count",
    "FractionCSP3":      "sp3 Carbon Fraction",
    "NumRings":          "Total Ring Count",
    "MolMR":             "Molar Refractivity",
    "LabuteASA":         "Accessible Surface Area",
}

# Whether higher value = better binding (positive) or worse (negative)
DESCRIPTOR_DIRECTION = {
    "MolWt":             "negative",
    "LogP":              "positive",
    "NumHDonors":        "positive",
    "NumHAcceptors":     "positive",
    "TPSA":              "negative",
    "NumRotatableBonds": "negative",
    "NumAromaticRings":  "positive",
    "NumHeavyAtoms":     "negative",
    "FractionCSP3":      "negative",
    "NumRings":          "positive",
    "MolMR":             "positive",
    "LabuteASA":         "negative",
}


@router.post("/binding")
def explain_binding(request: MoleculeParseRequest):
    try:
        mol_info = parse_molecule(request.input, request.input_type)
    except ValueError as e:
        msg = str(e)
        raise HTTPException(status_code=404 if "not found" in msg else 422, detail=msg)

    mol = Chem.MolFromSmiles(mol_info.canonical_smiles)
    feat = compute_features(mol)

    model = _load_binding_model()
    importances = model.feature_importances_  # shape: (2060,)

    # Last 12 values in feature vector = descriptors
    descriptor_importances = importances[2048:]  # shape: (12,)
    morgan_total = float(importances[:2048].sum())

    total = float(importances.sum())

    contributions = []
    for i, name in enumerate(DESCRIPTOR_NAMES):
        raw_importance = float(descriptor_importances[i])
        pct = round((raw_importance / total) * 100, 2) if total > 0 else 0
        direction = DESCRIPTOR_DIRECTION[name]
        contributions.append({
            "name": name,
            "label": DESCRIPTOR_LABELS[name],
            "value": round(feat["descriptors"][name], 3),
            "importance": round(raw_importance, 6),
            "percentage": pct,
            "direction": direction,
        })

    # Sort by importance descending
    contributions.sort(key=lambda x: x["importance"], reverse=True)

    return {
        "molecule_name": request.input,
        "contributions": contributions,
        "morgan_fingerprint_total_pct": round((morgan_total / total) * 100, 2) if total > 0 else 0,
    }
