from typing import Annotated, Literal, Optional
from pydantic import BaseModel, Field, StringConstraints


class MoleculeParseRequest(BaseModel):
    input: str
    input_type: Literal["name", "smiles", "auto"] = "auto"


class MoleculeInfo(BaseModel):
    canonical_smiles: str
    molecular_formula: str
    molecular_weight: float
    num_atoms: int
    num_rings: int
    num_hbd: int
    num_hba: int
    logp: float
    inchi_key: str
    lipinski_pass: bool
    qed_score: float
    sa_score: float
    source: str  # "local" | "pubchem" | "smiles_input"


class FeaturizeResponse(BaseModel):
    descriptors: dict
    feature_dim: int
    morgan_fp_bits_set: int


class BindingAffinityResponse(BaseModel):
    molecule_name: str
    canonical_smiles: str
    pkd: float
    binding_strength: str
    confidence_interval: list[float]
    percentile_rank: float
    descriptors: dict


class AdmetResponse(BaseModel):
    molecule_name: str
    canonical_smiles: str
    admet: dict
    overall_admet_score: float
    lipinski_pass: bool


class FullAnalysisResponse(BaseModel):
    molecule_name: str
    canonical_smiles: str
    molecular_formula: str
    molecular_weight: float
    descriptors: dict
    lipinski_pass: bool
    lipinski_details: dict
    binding_affinity: dict
    admet: dict
    druggability: dict
    chembl_data: dict
    ai_interpretation: dict
    qed_score: float
    sa_score: float
    processing_time_ms: float
    failure_reasons: list[dict] = []
    reasoning_trace: list[dict] = []


class RepurposingTargetResult(BaseModel):
    target_key: str
    name: str
    disease: str
    pdb_id: str
    pkd: float
    tanimoto_similarity: float
    confidence: str
    repurposing_score: float
    ligands_fetched: int
    rank: int


class RepurposingResponse(BaseModel):
    molecule_name: str
    canonical_smiles: str
    mode: str = "repurposing"
    results: list[RepurposingTargetResult]
    best_target: RepurposingTargetResult
    processing_time_ms: float


# ── Polypharmacy ──────────────────────────────────────────────────────────────

class PolypharmacyRequest(BaseModel):
    medications: list[Annotated[str, StringConstraints(min_length=1, max_length=100)]] = Field(min_length=1, max_length=30)
    age: Optional[int] = Field(default=None, ge=0, le=120)


class PolyKbCoverage(BaseModel):
    known: int
    total: int


class PolyRegimen(BaseModel):
    requested: int
    resolved: int
    polypharmacy_level: str
    kb_coverage: PolyKbCoverage


class PolyUnresolved(BaseModel):
    input: str
    reason: str


class PolyDescriptors(BaseModel):
    LogP: float
    TPSA: float


class PolyBoiledEgg(BaseModel):
    tpsa: float
    logp: float
    zone: str


class PolyAdmetCell(BaseModel):
    model_config = {"populate_by_name": True}
    pass_: bool = Field(alias="pass")
    label: str


class PolyAdmet(BaseModel):
    overall_admet_score: float
    absorption: PolyAdmetCell
    distribution: PolyAdmetCell
    metabolism: PolyAdmetCell
    excretion: PolyAdmetCell
    toxicity: PolyAdmetCell


class PolyMedication(BaseModel):
    index: int
    input: str
    name: str
    canonical_smiles: str
    molecular_weight: float
    in_kb: bool
    drug_class: Optional[str] = None
    narrow_therapeutic_index: bool
    beers_flag: Optional[str] = None
    descriptors: PolyDescriptors
    boiled_egg: PolyBoiledEgg
    admet: PolyAdmet


class PolyInteraction(BaseModel):
    id: str
    type: str
    severity: str
    evidence: str
    drugs: list[int]
    drug_names: list[str]
    title: str
    mechanism: str
    consequence: str
    action: str


class PolyMatrix(BaseModel):
    size: int
    cells: list[list[Optional[str]]]


class PolyContributor(BaseModel):
    drug_index: int
    drug: str
    tag: str
    weight: float


class PolyBodySystem(BaseModel):
    system: str
    label: str
    score: int
    contributors: list[PolyContributor]


class PolyBoiledEggSummary(BaseModel):
    bbb: int
    hia: int
    outside: int


class PolyCounts(BaseModel):
    major: int
    moderate: int
    minor: int


class PolyOverall(BaseModel):
    safety_score: int
    level: str
    label: str
    counts: PolyCounts
    summary: str
    top_actions: list[str]


class PolypharmacyResponse(BaseModel):
    age: Optional[int] = None
    age_assumed: bool
    regimen: PolyRegimen
    unresolved: list[PolyUnresolved]
    medications: list[PolyMedication]
    interactions: list[PolyInteraction]
    matrix: PolyMatrix
    body_burden: list[PolyBodySystem]
    boiled_egg_summary: PolyBoiledEggSummary
    overall: PolyOverall
    disclaimer: str
    processing_time_ms: float
