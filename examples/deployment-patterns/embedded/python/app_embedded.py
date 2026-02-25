"""Embedded Chroma deployment pattern example.

Run from repo root:
    pip install -r examples/deployment-patterns/requirements.txt
    python examples/deployment-patterns/embedded/python/app_embedded.py

If copied into your own project:
    pip install chromadb
"""

import chromadb


class EmbeddedKnowledgeBase:
    def __init__(self, path: str = "./chroma_data") -> None:
        self.client = chromadb.PersistentClient(path=path)
        self.collection = self.client.get_or_create_collection(
            name="support_kb",
            embedding_function=None,  # using explicit embeddings below
        )

    def add_article(self, article_id: str, text: str, embedding: list[float], product: str) -> None:
        self.collection.upsert(
            ids=[article_id],
            documents=[text],
            embeddings=[embedding],
            metadatas=[{"product": product}],
        )

    def search(self, query_embedding: list[float], product: str, n_results: int = 2) -> dict:
        return self.collection.query(
            query_embeddings=[query_embedding],
            where={"product": product},
            n_results=n_results,
            include=["documents", "metadatas", "distances"],
        )


if __name__ == "__main__":
    kb = EmbeddedKnowledgeBase(path="./chroma_data")

    kb.add_article(
        article_id="a1",
        text="Refunds are available within 30 days for annual plans.",
        embedding=[0.11, 0.20, 0.31],
        product="billing",
    )
    kb.add_article(
        article_id="a2",
        text="You can rotate API keys from the admin settings page.",
        embedding=[0.12, 0.18, 0.30],
        product="platform",
    )

    result = kb.search(query_embedding=[0.10, 0.19, 0.32], product="billing")
    print("Top match:", result["documents"][0])
