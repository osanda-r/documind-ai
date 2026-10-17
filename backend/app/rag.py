from dataclasses import dataclass
from typing import Sequence
import numpy as np


@dataclass
class TextChunk:
    text: str
    page: int
    embedding: np.ndarray | None = None


def chunk_text(text: str, page: int, chunk_words: int = 180, overlap_words: int = 35) -> list[TextChunk]:
    """Split page text into overlapping word chunks, preserving the source page."""
    words = text.split()
    if not words:
        return []
    if chunk_words < 1 or overlap_words < 0 or overlap_words >= chunk_words:
        raise ValueError("Use chunk_words > overlap_words >= 0.")

    chunks = []
    step = chunk_words - overlap_words
    for start in range(0, len(words), step):
        piece = " ".join(words[start:start + chunk_words]).strip()
        if piece:
            chunks.append(TextChunk(text=piece, page=page))
        if start + chunk_words >= len(words):
            break
    return chunks


def cosine_scores(query_embedding: np.ndarray, embeddings: np.ndarray) -> np.ndarray:
    """Return cosine similarity for one query vector against rows of vectors."""
    query = np.asarray(query_embedding, dtype=np.float32).reshape(1, -1)
    matrix = np.asarray(embeddings, dtype=np.float32)
    q_norm = np.linalg.norm(query, axis=1, keepdims=True)
    m_norm = np.linalg.norm(matrix, axis=1, keepdims=True)
    q_norm[q_norm == 0] = 1e-12
    m_norm[m_norm == 0] = 1e-12
    return ((matrix @ query.T).reshape(-1) / (m_norm.reshape(-1) * q_norm[0, 0])).astype(float)


def retrieve_top_chunks(query_embedding: np.ndarray, chunks: Sequence[TextChunk], top_k: int = 4) -> list[tuple[TextChunk, float]]:
    if not chunks:
        return []
    vectors = np.vstack([chunk.embedding for chunk in chunks if chunk.embedding is not None])
    valid_chunks = [chunk for chunk in chunks if chunk.embedding is not None]
    if not valid_chunks:
        return []
    scores = cosine_scores(query_embedding, vectors)
    indexes = np.argsort(scores)[::-1][:top_k]
    return [(valid_chunks[int(i)], float(scores[int(i)])) for i in indexes]
