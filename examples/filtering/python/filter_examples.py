"""Chroma filtering examples - metadata filters, document filters, and pagination."""

import chromadb

client = chromadb.Client()
collection = client.create_collection("filter_demo")

# Seed data
collection.add(
    ids=["doc-1", "doc-2", "doc-3", "doc-4"],
    documents=[
        "Machine learning is transforming healthcare diagnostics.",
        "Quantum computing may revolutionize cryptography.",
        "Renewable energy adoption is accelerating worldwide.",
        "Deep learning models require large datasets for training.",
    ],
    metadatas=[
        {"category": "ml", "year": 2024, "citations": 150},
        {"category": "quantum", "year": 2023, "citations": 80},
        {"category": "energy", "year": 2024, "citations": 45},
        {"category": "ml", "year": 2022, "citations": 300},
    ],
    embeddings=[[0.1, 0.2, 0.3], [0.4, 0.5, 0.6], [0.7, 0.8, 0.9], [0.2, 0.3, 0.4]],
)

# --- Metadata Filters ---

# Equality ($eq) - simple syntax
results = collection.get(where={"category": "ml"})
print(f"$eq (simple): {results['ids']}")

# Equality ($eq) - explicit syntax
results = collection.get(where={"category": {"$eq": "ml"}})
print(f"$eq (explicit): {results['ids']}")

# Inequality ($ne)
results = collection.get(where={"category": {"$ne": "ml"}})
print(f"$ne: {results['ids']}")

# Greater than ($gt)
results = collection.get(where={"citations": {"$gt": 100}})
print(f"$gt: {results['ids']}")

# Greater than or equal ($gte)
results = collection.get(where={"year": {"$gte": 2024}})
print(f"$gte: {results['ids']}")

# Less than ($lt)
results = collection.get(where={"citations": {"$lt": 100}})
print(f"$lt: {results['ids']}")

# Less than or equal ($lte)
results = collection.get(where={"year": {"$lte": 2023}})
print(f"$lte: {results['ids']}")

# In ($in)
results = collection.get(where={"category": {"$in": ["ml", "quantum"]}})
print(f"$in: {results['ids']}")

# Not in ($nin)
results = collection.get(where={"category": {"$nin": ["ml", "quantum"]}})
print(f"$nin: {results['ids']}")

# --- Logical Operators ---

# $and
results = collection.get(
    where={"$and": [{"category": "ml"}, {"year": {"$gte": 2024}}]}
)
print(f"$and: {results['ids']}")

# $or
results = collection.get(
    where={"$or": [{"category": "quantum"}, {"category": "energy"}]}
)
print(f"$or: {results['ids']}")

# Nested logical operators
results = collection.get(
    where={
        "$and": [
            {"year": {"$gte": 2023}},
            {"$or": [{"category": "ml"}, {"category": "quantum"}]},
        ]
    }
)
print(f"nested: {results['ids']}")

# --- Document Filters ---

# $contains
results = collection.query(
    query_embeddings=[[0.1, 0.2, 0.3]],
    n_results=4,
    where_document={"$contains": "learning"},
)
print(f"doc $contains: {results['ids']}")

# $not_contains
results = collection.query(
    query_embeddings=[[0.1, 0.2, 0.3]],
    n_results=4,
    where_document={"$not_contains": "learning"},
)
print(f"doc $not_contains: {results['ids']}")

# $regex
results = collection.query(
    query_embeddings=[[0.1, 0.2, 0.3]],
    n_results=4,
    where_document={"$regex": "learning.*training"},
)
print(f"doc $regex: {results['ids']}")

# $not_regex
results = collection.query(
    query_embeddings=[[0.1, 0.2, 0.3]],
    n_results=4,
    where_document={"$not_regex": "quantum.*crypto"},
)
print(f"doc $not_regex: {results['ids']}")

# Document filter with $and
results = collection.query(
    query_embeddings=[[0.1, 0.2, 0.3]],
    n_results=4,
    where_document={
        "$and": [{"$contains": "learning"}, {"$not_contains": "healthcare"}]
    },
)
print(f"doc $and: {results['ids']}")

# --- Pagination ---

page1 = collection.get(limit=2, offset=0)
print(f"page 1: {page1['ids']}")

page2 = collection.get(limit=2, offset=2)
print(f"page 2: {page2['ids']}")

# --- Combined: metadata + document filters ---
results = collection.query(
    query_embeddings=[[0.1, 0.2, 0.3]],
    n_results=4,
    where={"category": "ml"},
    where_document={"$contains": "learning"},
)
print(f"combined metadata + doc: {results['ids']}")

print("\npython: all filter examples passed")
