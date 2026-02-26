"""Chroma keyword search example using where_document and vector search.

Requires a running Chroma server:
    docker run --rm -p 8000:8000 chromadb/chroma:1.5.1
"""

import chromadb


client = chromadb.HttpClient(host="localhost", port=8000)
collection_name = "keyword_search_demo_python"

try:
    client.delete_collection(name=collection_name)
except Exception:
    pass

collection = client.create_collection(name=collection_name)

collection.add(
    ids=["1", "2", "3"],
    documents=[
        "He is a technology freak and he loves AI topics",
        "AI technology are advancing at a fast pace",
        "Innovation in LLMs is a hot topic",
    ],
    metadatas=[
        {"author": "John Doe"},
        {"author": "Jane Doe"},
        {"author": "John Doe"},
    ],
    embeddings=[
        [0.1, 0.8, 0.3],
        [0.2, 0.9, 0.2],
        [0.9, 0.1, 0.1],
    ],
)

contains_results = collection.query(
    query_embeddings=[[0.15, 0.85, 0.25]],
    n_results=3,
    where_document={
        "$or": [
            {"$contains": "technology"},
            {"$contains": "freak"},
        ]
    },
    include=["documents", "metadatas", "distances"],
)

print("contains/or:", contains_results)

regex_results = collection.query(
    query_embeddings=[[0.15, 0.85, 0.25]],
    n_results=3,
    where_document={"$regex": "technology.*pace"},
    include=["documents", "metadatas", "distances"],
)
print("regex:", regex_results)

not_regex_results = collection.query(
    query_embeddings=[[0.15, 0.85, 0.25]],
    n_results=3,
    where_document={"$not_regex": "Innovation.*topic"},
    include=["documents", "metadatas", "distances"],
)
print("not_regex:", not_regex_results)

client.delete_collection(name=collection_name)
print("\npython: keyword search example passed")
