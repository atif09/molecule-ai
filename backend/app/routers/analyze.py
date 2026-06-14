import time
from fastapi import APIRouter, HTTPException
from rdkit import Chem

from app.models.schemas import MoleculeParseRequest, FullAnalysisResponse
from app.services.molecule_service import parse_molecule, MOLECULE_LOOKUP
from app.services.featurizer import compute_features
from app.services.prediction_service import (
    predict_binding_affinity,
    predict_admet,
    compute_druggability_score,
)
from app.services.chembl_service import fetch_chembl_data
from app.services.groq_service import generate_clinical_interpretation

router = APIRouter(prefix="/analyze", tags=["Analysis"])


@router.get("/molecules")
def list_molecules():
    return {"molecules": list(MOLECULE_LOOKUP.keys())}


@router.post("/", response_model=FullAnalysisResponse)
def analyze(request: MoleculeParseRequest):
    t0 = time.perf_counter()

    try:
        mol_info = parse_molecule(request.input, request.input_type)
    except ValueError as e:
        msg = str(e)
        status = 404 if "not found" in msg else 422
        raise HTTPException(status_code=status, detail=msg)

    mol = Chem.MolFromSmiles(mol_info.canonical_smiles)
    feat = compute_features(mol)
    fv = feat["feature_vector"]

    binding_result = predict_binding_affinity(fv)
    admet_result = predict_admet(fv)
    druggability_result = compute_druggability_score(binding_result, admet_result, mol_info.lipinski_pass)

    try:
        chembl_data = fetch_chembl_data(request.input)
    except Exception:
        from app.services.chembl_service import _empty_chembl
        chembl_data = _empty_chembl()

    # Compute failure reasons for grade C or D molecules
    failure_reasons = []
    if druggability_result["grade"] in ["C", "D"]:
        if mol_info.molecular_weight > 500:
            failure_reasons.append({
                "issue": f"Molecular weight {mol_info.molecular_weight:.0f} Da",
                "reason": "Exceeds Lipinski 500 Da limit — poor oral absorption expected",
                "fix": "Consider fragment-based approach or remove heavy substituents",
            })
        if mol_info.logp > 5:
            failure_reasons.append({
                "issue": f"LogP {mol_info.logp:.1f}",
                "reason": "Too lipophilic — poor aqueous solubility and distribution",
                "fix": "Add polar groups or reduce aromatic ring count",
            })
        if admet_result["toxicity"]["probability"] > 0.7:
            failure_reasons.append({
                "issue": f"Toxicity probability {admet_result['toxicity']['probability']:.2f}",
                "reason": "Likely hERG channel inhibitor — cardiac safety risk",
                "fix": "Modify or remove basic nitrogen groups",
            })
        if admet_result["overall_admet_score"] < 40:
            failure_reasons.append({
                "issue": f"ADMET score {admet_result['overall_admet_score']:.0f}/100",
                "reason": "Poor overall pharmacokinetic profile",
                "fix": "Optimize absorption and distribution properties",
            })
        if not mol_info.lipinski_pass:
            failure_reasons.append({
                "issue": "Lipinski Rule of Five — Fail",
                "reason": "Multiple drug-likeness violations reduce oral bioavailability",
                "fix": "Reduce molecular complexity or switch to prodrug strategy",
            })

    full_response_dict = {
        "molecule_name": request.input,
        "molecular_weight": mol_info.molecular_weight,
        "descriptors": feat["descriptors"],
        "lipinski_pass": mol_info.lipinski_pass,
        "binding_affinity": binding_result,
        "admet": admet_result,
        "druggability": druggability_result,
        "chembl_data": chembl_data,
    }
    ai_interpretation = generate_clinical_interpretation(full_response_dict)
    reasoning_trace = ai_interpretation.pop("reasoning_trace", [])

    processing_time_ms = round((time.perf_counter() - t0) * 1000, 2)

    return FullAnalysisResponse(
        molecule_name=request.input,
        canonical_smiles=mol_info.canonical_smiles,
        molecular_formula=mol_info.molecular_formula,
        molecular_weight=mol_info.molecular_weight,
        descriptors=feat["descriptors"],
        lipinski_pass=mol_info.lipinski_pass,
        lipinski_details={
            "mw": mol_info.molecular_weight,
            "logp": mol_info.logp,
            "hbd": mol_info.num_hbd,
            "hba": mol_info.num_hba,
        },
        binding_affinity=binding_result,
        admet=admet_result,
        druggability=druggability_result,
        chembl_data=chembl_data,
        ai_interpretation=ai_interpretation,
        qed_score=mol_info.qed_score,
        sa_score=mol_info.sa_score,
        processing_time_ms=processing_time_ms,
        failure_reasons=failure_reasons,
        reasoning_trace=reasoning_trace,
    )
