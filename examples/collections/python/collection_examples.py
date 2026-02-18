"""Chroma collection examples - CRUD, iteration, cloning, and utilities.

Requires a running Chroma server:
    docker run -p 8000:8000 chromadb/chroma

All examples use explicit embeddings to avoid client-side embedding function
dependencies. In production, you would typically pass `documents` and let the
configured embedding function handle vectorization.
"""

import os
import random

import chromadb

client = chromadb.HttpClient()

DIM = 3
COLLECTIONS_TO_CLEANUP = []


def rand_emb():
    return [random.random() for _ in range(DIM)]


def cleanup(name):
    COLLECTIONS_TO_CLEANUP.append(name)
    try:
        client.delete_collection(name)
    except Exception:
        pass


# ── Create Collection ──

cleanup("create_basic")
col = client.create_collection("create_basic")
print(f"created: {col.name}")

# ── Get or Create Collection ──

cleanup("get_or_create")
col = client.get_or_create_collection("get_or_create", metadata={"key": "value"})
print(f"get_or_create: {col.name}, metadata: {col.metadata}")

# ── Create with HNSW Configuration ──

cleanup("create_hnsw")
col_hnsw = client.create_collection(
    "create_hnsw",
    configuration={
        "hnsw": {
            "space": "cosine",
            "ef_construction": 200,
            "max_neighbors": 32,
        }
    },
)
print(f"hnsw config: {col_hnsw.name}")

# ── List Collections ──

collections = client.list_collections()
print(f"all collections ({len(collections)}): {[c.name for c in collections]}")

# with pagination
collections = client.list_collections(limit=10, offset=0)
print(f"paginated (limit=10): {[c.name for c in collections]}")

# ── Get a Collection ──

col = client.get_collection("create_basic")
print(f"get: {col.name}")

# ── Modify a Collection ──

cleanup("modified_col")
col = client.get_or_create_collection("modified_col")
col.modify(name="modified_col", metadata={"new_key": "new_value"})
col = client.get_collection("modified_col")
print(f"modified metadata: {col.metadata}")

# ── Count Collections ──

count = client.count_collections()
print(f"collection count: {count}")

# ── Convenience Methods ──

cleanup("convenience")
col = client.get_or_create_collection("convenience")
col.add(
    ids=["1", "2"],
    documents=["hello world", "hello chroma"],
    embeddings=[rand_emb(), rand_emb()],
)

print(f"peek: {col.peek(limit=2)['ids']}")
print(f"count: {col.count()}")

# ── Delete Collection ──

cleanup("delete_me")
client.get_or_create_collection("delete_me")
client.delete_collection("delete_me")
print("deleted: delete_me")

# ── Query and Get Results ──

cleanup("results_demo")
col = client.create_collection("results_demo")
col.add(
    ids=[f"doc-{i}" for i in range(20)],
    documents=[f"document about topic {i % 5}" for i in range(20)],
    metadatas=[{"page": i, "category": f"cat-{i % 3}"} for i in range(20)],
    embeddings=[rand_emb() for _ in range(20)],
)

# GET: zip aligned columns
result = col.get(include=["documents", "metadatas"])
if result["documents"] is None or result["metadatas"] is None:
    raise ValueError("include must contain documents and metadatas")

for doc_id, doc, meta in zip(
    result["ids"],
    result["documents"],
    result["metadatas"],
):
    pass  # process each record
print(f"get iteration: {len(result['ids'])} records")

# QUERY: nested loop (queries -> matches)
query_emb = rand_emb()
q = col.query(
    query_embeddings=[query_emb], n_results=3, include=["documents", "distances"]
)
if q["documents"] is None or q["distances"] is None:
    raise ValueError("include must contain documents and distances")

for q_idx, ids in enumerate(q["ids"]):
    docs = q["documents"][q_idx]
    distances = q["distances"][q_idx]
    for doc_id, doc, distance in zip(ids, docs, distances):
        print(f"  query[{q_idx}] {doc_id}: dist={distance:.4f} {doc}")

# ── Constrain Query Candidates By ID ──

constrained = col.query(
    query_embeddings=[query_emb],
    n_results=3,
    ids=["doc-1", "doc-2", "doc-3"],
)
print(f"constrained query returned {len(constrained['ids'][0])} results (max 3 from 3 candidates)")

# ── Iterating over a Collection (batched) ──

existing_count = col.count()
batch_size = 5
for i in range(0, existing_count, batch_size):
    batch = col.get(
        include=["metadatas", "documents", "embeddings"],
        limit=batch_size,
        offset=i,
    )
    print(f"  batch offset={i}: {len(batch['ids'])} items")

# ── Copy Collection ──

cleanup("copy_source")
cleanup("copy_dest")
source = client.create_collection("copy_source")
source.add(
    ids=["1", "2"],
    documents=["hello world", "hello ChromaDB"],
    metadatas=[{"a": 1}, {"b": 2}],
    embeddings=[rand_emb(), rand_emb()],
)
dest = client.create_collection("copy_dest", metadata=source.metadata)

existing_count = source.count()
batch_size = 10
for i in range(0, existing_count, batch_size):
    batch = source.get(
        include=["metadatas", "documents", "embeddings"],
        limit=batch_size,
        offset=i,
    )
    dest.add(
        ids=batch["ids"],
        documents=batch["documents"],
        metadatas=batch["metadatas"],
        embeddings=batch["embeddings"],
    )
print(f"copied: {dest.count()} items")

# ── Clone Collection (change distance function) ──

cleanup("clone_source")
cleanup("clone_cosine")
clone_src = client.create_collection("clone_source")
clone_src.add(
    ids=[f"{i}" for i in range(100)],
    documents=[f"document {i}" for i in range(100)],
    embeddings=[rand_emb() for _ in range(100)],
)
clone_dst = client.create_collection(
    "clone_cosine", configuration={"hnsw": {"space": "cosine"}}
)

existing_count = clone_src.count()
batch_size = 10
for i in range(0, existing_count, batch_size):
    batch = clone_src.get(
        include=["metadatas", "documents", "embeddings"],
        limit=batch_size,
        offset=i,
    )
    clone_dst.add(
        ids=batch["ids"],
        documents=batch["documents"],
        metadatas=batch["metadatas"],
        embeddings=batch["embeddings"],
    )
print(f"cloned: {clone_dst.count()} items with cosine distance")

# ── Change Embedding Function (requires OPENAI_API_KEY) ──

if os.getenv("OPENAI_API_KEY"):
    from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction

    cleanup("ef_default")
    cleanup("ef_openai")
    openai_ef = OpenAIEmbeddingFunction(
        api_key=os.getenv("OPENAI_API_KEY"), model_name="text-embedding-3-small"
    )
    # Source collection uses raw embeddings
    ef_src = client.create_collection("ef_default")
    ef_src.add(
        ids=["1", "2", "3"],
        documents=["hello", "world", "chroma"],
        embeddings=[rand_emb(), rand_emb(), rand_emb()],
    )
    # Destination re-embeds documents with OpenAI
    ef_dst = client.create_collection("ef_openai", embedding_function=openai_ef)

    count = ef_src.count()
    for i in range(0, count, 10):
        batch = ef_src.get(
            include=["metadatas", "documents"], limit=10, offset=i
        )
        ef_dst.add(
            ids=batch["ids"],
            documents=batch["documents"],
            metadatas=batch["metadatas"],
        )
    print(f"re-embedded: {ef_dst.count()} items with OpenAI embeddings")
else:
    print("skipped: change embedding function (set OPENAI_API_KEY to enable)")

# ── Clone Subset with Query ──

cleanup("subset_source")
cleanup("subset_dest")
subset_src = client.create_collection("subset_source")
subset_src.add(
    ids=[f"{i}" for i in range(100)],
    documents=[f"document {i}" for i in range(100)],
    metadatas=[{"category": "a" if i % 2 == 0 else "b"} for i in range(100)],
    embeddings=[rand_emb() for _ in range(100)],
)
subset_dst = client.create_collection(
    "subset_dest", configuration={"hnsw": {"space": "cosine"}}
)

query_where = {"category": "a"}
query_where_document = {"$contains": "document"}
select_ids = subset_src.get(
    where_document=query_where_document, where=query_where, include=[]
)
batch_size = 10
for i in range(0, len(select_ids["ids"]), batch_size):
    batch = subset_src.get(
        include=["metadatas", "documents", "embeddings"],
        limit=batch_size,
        offset=i,
        where=query_where,
        where_document=query_where_document,
    )
    subset_dst.add(
        ids=batch["ids"],
        documents=batch["documents"],
        metadatas=batch["metadatas"],
        embeddings=batch["embeddings"],
    )
print(f"cloned subset: {subset_dst.count()} items (category=a only)")

# ── Update Document/Record Metadata ──

cleanup("meta_update")
meta_col = client.create_collection("meta_update")
meta_col.add(
    ids=["1", "2"],
    documents=["hello", "world"],
    metadatas=[{"tag": "  spaces  "}, {"tag": " more spaces "}],
    embeddings=[rand_emb(), rand_emb()],
)


def update_metadata(metadata: dict):
    return {k: v.strip() if isinstance(v, str) else v for k, v in metadata.items()}


count = meta_col.count()
for i in range(0, count, 10):
    batch = meta_col.get(include=["metadatas"], limit=10, offset=i)
    meta_col.update(
        ids=batch["ids"],
        metadatas=[update_metadata(m) for m in batch["metadatas"]],
    )
result = meta_col.get(include=["metadatas"])
print(f"updated metadata: {result['metadatas']}")

# ── Getting IDs Only ──

ids_only = col.get(include=[])
print(f"ids only (first 5): {ids_only['ids'][:5]}")

# ── Cleanup ──

for name in COLLECTIONS_TO_CLEANUP:
    try:
        client.delete_collection(name)
    except Exception:
        pass

print("\npython: all collection examples passed")
