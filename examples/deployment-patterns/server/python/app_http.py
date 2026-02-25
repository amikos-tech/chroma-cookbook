"""Server-mode Chroma deployment pattern example.

Run from repo root:
    pip install -r examples/deployment-patterns/requirements.txt
    python examples/deployment-patterns/server/python/app_http.py

If copied into your own project:
    pip install chromadb

Environment variables:
    CHROMA_HOST (default: localhost)
    CHROMA_PORT (default: 8000)
    CHROMA_SSL  (default: false)
"""

import os

import chromadb


def get_client() -> chromadb.HttpClient:
    return chromadb.HttpClient(
        host=os.getenv("CHROMA_HOST", "localhost"),
        port=int(os.getenv("CHROMA_PORT", "8000")),
        ssl=os.getenv("CHROMA_SSL", "false").lower() == "true",
    )


if __name__ == "__main__":
    client = get_client()
    collection = client.get_or_create_collection(
        name="support_kb",
        embedding_function=None,  # using explicit embeddings below
    )

    collection.upsert(
        ids=["a3"],
        documents=["Password reset links expire after 15 minutes."],
        embeddings=[[0.09, 0.22, 0.28]],
        metadatas=[{"product": "platform"}],
    )

    result = collection.query(
        query_embeddings=[[0.10, 0.21, 0.29]],
        n_results=1,
        where={"product": "platform"},
        include=["documents", "distances"],
    )
    print("Top match:", result["documents"][0])
