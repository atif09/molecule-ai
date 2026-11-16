from fastapi import APIRouter, HTTPException

from app.models.schemas import PolypharmacyRequest, PolypharmacyResponse
from app.services.polypharmacy_service import analyze_regimen, ModelsMissingError

router = APIRouter(prefix="/polypharmacy", tags=["Polypharmacy"])


@router.post("/analyze", response_model=PolypharmacyResponse, response_model_by_alias=True)
def analyze(request: PolypharmacyRequest):
    try:
        return analyze_regimen(request.medications, request.age)
    except ModelsMissingError:
        raise HTTPException(status_code=503, detail="Prediction models not found — run scripts/train_models.sh")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
