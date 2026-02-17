"""Verify chromadb installs and basic operations work."""

import chromadb

client = chromadb.Client()
collection = client.create_collection("test")
collection.add(ids=["1"], documents=["hello world"])
results = collection.query(query_texts=["hello"], n_results=1)
assert results["ids"] == [["1"]]
print("python: ok")
