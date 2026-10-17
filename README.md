# DocuMind AI — RAG Document Assistant

A learning project that lets users upload a PDF, ask questions about it, and receive answers grounded in retrieved document passages with page references.

## Stack
- Frontend: React + Vite + Tailwind CSS v4
- Backend: FastAPI
- PDF extraction: PyMuPDF
- Embeddings: Sentence Transformers (`all-MiniLM-L6-v2`)
- Vector retrieval: NumPy cosine similarity
- LLM: Groq Chat Completions API (API key stays on the backend)

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
