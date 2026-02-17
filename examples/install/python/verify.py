"""Verify chromadb installs and basic operations work."""

import chromadb

client = chromadb.Client()
collection = client.create_collection("test", embedding_function=None)
collection.add(ids=["1"], documents=["hello world"], embeddings=[[0.1, 0.2, 0.3]])
results = collection.query(query_embeddings=[[0.1, 0.2, 0.3]], n_results=1)
assert results["ids"] == [["1"]]
print("python: ok")
