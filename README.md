# Molecule AI

Drug discovery is broken for small teams. Running computational screening today requires either a $40,000/year Schrödinger license or weeks of setup with tools like AutoDock that demand deep expertise. Molecule AI solves the access problem.

Give it any molecule (a name, SMILES string, or hand-drawn structure) and get a complete drug viability profile in under 10 seconds.

- **Binding affinity** predicted by a Random Forest model trained on 5,752 real ChEMBL experimental measurements
- **ADMET** safety profile across absorption, distribution, metabolism, excretion, and toxicity
- **Lipinski** oral bioavailability check and synthesis accessibility score
- **3D structure** with pharmacophore highlights showing which atoms drive binding
- **Plain English explanation** via LLaMA 3.3 70B on Groq, making results accessible without a computational chemistry background

A researcher with 50 candidate molecules used to spend weeks and thousands of dollars running wet lab assays on all of them. Now they filter to the top 5 in minutes.

A **VS Code extension** takes this further: researchers get inline druggability scores directly in their editor, enabling go/no-go decisions while writing screening scripts, not after running them.

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | FastAPI (Python) |
| ML Model | Random Forest trained on ChEMBL data |
| LLM | LLaMA 3.3 70B via Groq |
| Cheminformatics | RDKit |
| Deployment | Railway + Nixpacks |

## Getting Started

**Backend**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # add your Groq API key
uvicorn app.main:app --reload
```

## Snapshots

Molecular Analysis
<img width="1600" height="760" alt="image" src="https://github.com/user-attachments/assets/74a476e1-3d46-469d-8cad-e0e1786488d2" />

Synthesis Engine
<img width="1600" height="757" alt="image" src="https://github.com/user-attachments/assets/0f6d6078-4005-471a-baab-92386e65853e" />

How our VS code extension looks
<img width="1600" height="862" alt="image" src="https://github.com/user-attachments/assets/a2c3e896-f805-4f07-9ea9-8eac85049882" />

