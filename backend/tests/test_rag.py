import numpy as np
import pytest

from app.rag import TextChunk, chunk_text, cosine_scores, retrieve_top_chunks


def test_chunk_text_empty_input():
    assert chunk_text("   ", page=1) == []


def test_chunk_text_keeps_page_and_overlap():
    words = " ".join(f"word{i}" for i in range(10))
    chunks = chunk_text(words, page=3, chunk_words=5, overlap_words=2)
    assert len(chunks) == 3
    assert all(chunk.page == 3 for chunk in chunks)
    assert chunks[0].text.split()[-2:] == chunks[1].text.split()[:2]


def test_chunk_text_rejects_bad_overlap():
    with pytest.raises(ValueError):
        chunk_text("some words", page=1, chunk_words=5, overlap_words=5)


def test_cosine_scores():
    query = np.array([1.0, 0.0])
    vectors = np.array([[1.0, 0.0], [0.0, 1.0], [-1.0, 0.0]])
    scores = cosine_scores(query, vectors)
    assert scores[0] == pytest.approx(1.0)
    assert scores[1] == pytest.approx(0.0)
    assert scores[2] == pytest.approx(-1.0)


def test_retrieval_orders_best_match_first():
    chunks = [
        TextChunk("first", page=1, embedding=np.array([0.0, 1.0])),
        TextChunk("second", page=2, embedding=np.array([1.0, 0.0])),
    ]
    results = retrieve_top_chunks(np.array([1.0, 0.0]), chunks, top_k=2)
    assert results[0][0].text == "second"
    assert results[0][1] == pytest.approx(1.0)
