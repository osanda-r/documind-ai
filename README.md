# DocuMind AI — RAG Document Assistant

A learning project that lets users upload a PDF, ask questions about it, and receive answers grounded in retrieved document passages with page references.

## Stack
- Frontend: React + Vite + Tailwind CSS v4
- Backend: FastAPI
- PDF extraction: PyMuPDF
- Embeddings: Sentence Transformers (`all-MiniLM-L6-v2`)
- Vector retrieval: NumPy cosine similarity
- LLM: Groq Chat Completions API (API key stays on the backend)

## Requirements
- Windows 10/11
- Python 3.11 recommended
- Node.js LTS
- Internet for installing packages, downloading the embedding model on first run, and calling Groq

## 1. Backend setup (PowerShell)
Open a terminal in this folder:

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend\.env` and add your Groq key:
```env
GROQ_API_KEY=put_your_key_here
GROQ_MODEL=openai/gpt-oss-20b
```

Get a key from https://console.groq.com/keys. Never put it in React code or commit `.env`.

Run backend:
```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Open http://127.0.0.1:8000/docs to see the API docs.

On first PDF upload, Sentence Transformers downloads its embedding model. The first run can take a few minutes.

## 2. Frontend setup (new terminal)
From the project root:
```powershell
cd frontend
npm install
npm run dev
```
Open the URL printed by Vite (normally http://localhost:5173).

## 3. Use it
1. Choose a text-based PDF (max 10 MB, max 100 pages).
2. Upload it.
3. Ask a question answered by that document.
4. Inspect the source cards and page references under the answer.

Scanned PDFs with images and no text are not supported by this starter version (OCR can be added later).

## 4. Tests
In a terminal with the backend virtual environment activated:
```powershell
cd backend
pytest -q
```

## Architecture
1. PDF upload is validated by file size, PDF signature, page count and extracted text.
2. Text is split into overlapping chunks while preserving page numbers.
3. Sentence Transformer converts each chunk into an embedding vector.
4. The question is embedded and compared to chunk vectors using cosine similarity.
5. The top matching chunks are sent as context to the Groq model.
6. The response includes source metadata so the UI can show document pages.

## Important limitations
- This is a local learning/demo app, not a production multi-user service.
- Uploaded documents and embeddings are kept in backend memory; they disappear when the backend restarts.
- No authentication or per-user access control yet. Do not expose this backend publicly.
- Do not upload confidential, private, or sensitive documents.
- Similarity scores are retrieval signals, not proof that an answer is correct.
- LLM free-tier availability and limits can change; check Groq's current limits.
