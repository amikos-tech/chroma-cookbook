---
nav:
- Section:
    - section/index.md
    - Installation: install.md
---

# Chroma Core: Concepts and APIs

This section is the fastest way to understand Chroma's core data model, client choices, and day-to-day APIs.

If you are new to Chroma, use the path below in order. If you are already building, jump to the API map.

## Recommended Learning Path

1. [Concepts](concepts.md): Understand tenants, databases, collections, documents, metadata, embeddings, and query flow.
2. [Installation](install.md): Install Chroma for local development, server usage, or cloud-connected workflows.
3. [Clients](clients.md): Pick the right client (`PersistentClient`, `HttpClient`, `AsyncHttpClient`, `CloudClient`) for your architecture.
4. [Collections](collections.md): Learn collection lifecycle and core CRUD/query operations.
5. [Filters](filters.md): Add precise metadata and document filtering to retrieval.
6. [Configuration](configuration.md): Tune index, runtime, and environment options.
7. [Resources](resources.md): Estimate memory/CPU/disk needs before scaling.
8. [Advanced Search](advanced/queries.md): Learn query-stage semantics, ranking, and execution tradeoffs.

## API Map

### Client-Level APIs

- Connect to Chroma: `PersistentClient`, `HttpClient`, `AsyncHttpClient`, `CloudClient`
- Scope data isolation: tenant + database selection
- Perform admin/list operations (for example collection listing and lifecycle actions)

Start in [Clients](clients.md), then use [Tenants and Databases](tenants-and-databases.md) for multi-tenant setups.

### Collection-Level APIs

- Create/get collections: `create_collection`, `get_or_create_collection`, `get_collection`
- Write data: `add`, `upsert`, `update`, `delete`
- Read data: `get`, `query`, `count`
- Manage collection settings: metadata, index configuration, and cloning/forking patterns

Start in [Collections](collections.md), then pair with [Filters](filters.md) and [Document IDs](document-ids.md).

### HTTP/OpenAPI Surface

- Explore server endpoints and OpenAPI: [API](api.md)
- Generate custom clients when needed

## Minimal End-to-End Flow (Python)

```python
import chromadb

client = chromadb.PersistentClient(path="./chroma")
collection = client.get_or_create_collection("quickstart")

collection.upsert(
    ids=["doc-1", "doc-2"],
    documents=["Chroma stores vectors and metadata.", "Filters narrow candidate sets before ranking."],
    metadatas=[{"topic": "basics"}, {"topic": "search"}],
)

result = collection.query(
    query_texts=["How do filters affect retrieval?"],
    where={"topic": "search"},
    n_results=2,
)

print(result["ids"])
```

## Where to Go Next

- Operating local persistent deployments: [Storage Layout](storage-layout.md), [WAL](advanced/wal.md), [WAL Pruning](advanced/wal-pruning.md)
- Production guardrails and limits: [System Constraints](system_constraints.md), [Resources](resources.md)
