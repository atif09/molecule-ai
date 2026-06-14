import time
from fastapi import APIRouter
from pydantic import BaseModel
from rdkit import Chem

from app.services.molecule_service import parse_molecule
from app.services.featurizer import compute_features
from app.services.prediction_service import (
    predict_binding_affinity,
    predict_admet,
    compute_druggability_score,
)

router = APIRouter(prefix="/batch", tags=["Batch"])


class BatchRequest(BaseModel):
    molecules: list[str]


@router.post("/analyze")
def batch_analyze(request: BatchRequest):
    t0 = time.perf_counter()
    results = []

    for name in request.molecules[:20]:  # cap at 20 to prevent abuse
        entry = {"molecule_name": name, "status": "error"}
        try:
            mol_info = parse_molecule(name, "auto")
            mol = Chem.MolFromSmiles(mol_info.canonical_smiles)
            feat = compute_features(mol)
            fv = feat["feature_vector"]

            binding = predict_binding_affinity(fv)
            admet = predict_admet(fv)
            drug = compute_druggability_score(binding, admet, mol_info.lipinski_pass)

            entry = {
                "molecule_name": name,
                "status": "success",
                "canonical_smiles": mol_info.canonical_smiles,
                "molecular_formula": mol_info.molecular_formula,
                "molecular_weight": round(mol_info.molecular_weight, 2),
                "pkd": binding["pkd"],
                "binding_strength": binding["binding_strength"],
                "admet_score": admet["overall_admet_score"],
                "druggability_score": drug["druggability_score"],
                "grade": drug["grade"],
                "lipinski_pass": mol_info.lipinski_pass,
                "qed_score": mol_info.qed_score,
            }
        except Exception as e:
            entry["error"] = str(e)

        results.append(entry)

    # Sort by druggability score descending, errors go to bottom
    results.sort(
        key=lambda x: x.get("druggability_score", -1),
        reverse=True,
    )

    for i, r in enumerate(results):
        r["rank"] = i + 1

    return {
        "total": len(results),
        "successful": sum(1 for r in results if r["status"] == "success"),
        "processing_time_ms": round((time.perf_counter() - t0) * 1000, 2),
        "results": results,
    }
