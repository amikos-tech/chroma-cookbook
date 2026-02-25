"""LangChain embeddings example for Chroma 1.5.1 and current LangChain APIs.

This script demonstrates:
1. Using a LangChain embedding model with a native Chroma collection via
   ChromaLangchainEmbeddingFunction.
2. Using Chroma as a LangChain vector store via langchain_chroma.Chroma.

Run:
    pip install -r examples/langchain/requirements.txt
    python examples/langchain/python/embeddings_example.py
"""

from __future__ import annotations

import shutil
from pathlib import Path
from typing import Any

import chromadb
from chromadb.utils.embedding_functions import ChromaLangchainEmbeddingFunction
from langchain_chroma import Chroma as LangChainChroma
from langchain_core.embeddings import DeterministicFakeEmbedding

BASE_DIR = Path("chroma_data/langchain_embeddings_example")
CHROMA_CLIENT_DIR = BASE_DIR / "chroma_client"
LANGCHAIN_STORE_DIR = BASE_DIR / "langchain_store"


def reset_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def print_native_query_results(results: dict[str, Any]) -> None:
    ids = results["ids"][0]
    documents = results.get("documents")
    metadatas = results.get("metadatas")
    distances = results.get("distances")
    documents_row = documents[0] if documents else []
    metadatas_row = metadatas[0] if metadatas else []
    distances_row = distances[0] if distances else []

    for doc_id, doc, metadata, distance in zip(
        ids, documents_row, metadatas_row, distances_row
    ):
        print(
            f"  id={doc_id} distance={distance:.6f} "
            f"topic={metadata.get('topic')} text={doc}"
        )


def main() -> None:
    reset_dir(CHROMA_CLIENT_DIR)
    reset_dir(LANGCHAIN_STORE_DIR)

    documents = [
        "Use PersistentClient for embedded local Chroma storage.",
        "Use HttpClient when your app connects to a remote Chroma server.",
        "langchain_chroma is the supported LangChain vector store package for Chroma.",
        "Collection metadata filters can restrict retrieval candidates.",
    ]
    metadatas = [
        {"topic": "deployment", "mode": "embedded"},
        {"topic": "deployment", "mode": "client-server"},
        {"topic": "integration", "mode": "langchain"},
        {"topic": "querying", "mode": "filters"},
    ]
    ids = [f"doc-{i}" for i in range(len(documents))]

    # Swap this embedding model for OpenAIEmbeddings/HuggingFaceEmbeddings in real use.
    embeddings = DeterministicFakeEmbedding(size=64)

    print("=== 1) LangChain embeddings -> native Chroma collection ===")
    chroma_ef = ChromaLangchainEmbeddingFunction(embedding_function=embeddings)
    client = chromadb.PersistentClient(path=str(CHROMA_CLIENT_DIR))
    collection = client.get_or_create_collection(
        name="langchain_to_chroma",
        embedding_function=chroma_ef,
    )
    collection.add(ids=ids, documents=documents, metadatas=metadatas)

    native_results = collection.query(
        query_embeddings=[embeddings.embed_query("How do I deploy Chroma?")],
        n_results=2,
        include=["documents", "metadatas", "distances"],
    )
    print_native_query_results(native_results)

    print("\n=== 2) Chroma as LangChain vector store (langchain_chroma) ===")
    vector_store = LangChainChroma(
        collection_name="langchain_vectorstore",
        persist_directory=str(LANGCHAIN_STORE_DIR),
        embedding_function=embeddings,
    )
    vector_store.add_texts(texts=documents, metadatas=metadatas, ids=ids)

    retriever = vector_store.as_retriever(
        search_kwargs={"k": 2, "filter": {"topic": "deployment"}}
    )
    retrieved_docs = retriever.invoke("What deployment options does Chroma have?")

    for index, doc in enumerate(retrieved_docs, start=1):
        print(
            f"  rank={index} topic={doc.metadata.get('topic')} "
            f"mode={doc.metadata.get('mode')} text={doc.page_content}"
        )


if __name__ == "__main__":
    main()
