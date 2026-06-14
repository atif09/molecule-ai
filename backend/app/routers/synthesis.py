import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.services.rxn_service import predict_retrosynthesis_sync, generate_fallback_synthesis
from app.services.molecule_service import parse_molecule

router = APIRouter(prefix="/synthesis", tags=["Synthesis"])

_IBM_RXN_URL = "https://rxn.app.accelerate.science/rxn/api/api/v1"


def _key_is_valid(key: str) -> bool:
    """Return False if the key is missing or accidentally set to the base URL."""
    if not key:
        return False
    if key.startswith("http"):
        return False
    return True


class SynthesisRequest(BaseModel):
    input: str
    steps: int = 3


@router.post("/predict")
def predict_synthesis(request: SynthesisRequest):
    t0 = time.perf_counter()

    try:
        mol_info = parse_molecule(request.input)
        smiles = mol_info.canonical_smiles
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Try IBM RXN if key is properly configured
    if _key_is_valid(settings.IBM_RXN_API_KEY):
        try:
            result = predict_retrosynthesis_sync(smiles, settings.IBM_RXN_API_KEY, request.steps)
            result["molecule_name"] = request.input
            result["processing_time_ms"] = round((time.perf_counter() - t0) * 1000, 2)
            return result
        except Exception:
            pass  # Fall through to fallback

    # Fallback — always works, no external dependency
    result = generate_fallback_synthesis(smiles, request.input)
    result["molecule_name"] = request.input
    result["processing_time_ms"] = round((time.perf_counter() - t0) * 1000, 2)
    return result
