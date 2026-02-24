# Chroma Core: Concepts and APIs

This section is the fastest way to understand Chroma's core data model, client choices, and day-to-day APIs.

If you are new to Chroma, use the path below in order. If you are already building, jump to the API map.

## Recommended Learning Path

1. [Concepts](https://cookbook.chromadb.dev/core/concepts/index.md): Understand tenants, databases, collections, documents, metadata, embeddings, and query flow.
1. [Installation](https://cookbook.chromadb.dev/core/install/index.md): Install Chroma for local development, server usage, or cloud-connected workflows.
1. [Clients](https://cookbook.chromadb.dev/core/clients/index.md): Pick the right client (`PersistentClient`, `HttpClient`, `AsyncHttpClient`, `CloudClient`) for your architecture.
1. [Collections](https://cookbook.chromadb.dev/core/collections/index.md): Learn collection lifecycle and core CRUD/query operations.
1. [Filters](https://cookbook.chromadb.dev/core/filters/index.md): Add precise metadata and document filtering to retrieval.
1. [Configuration](https://cookbook.chromadb.dev/core/configuration/index.md): Tune index, runtime, and environment options.
1. [Resources](https://cookbook.chromadb.dev/core/resources/index.md): Estimate memory/CPU/disk needs before scaling.
1. [Advanced Search](https://cookbook.chromadb.dev/core/advanced/queries/index.md): Learn query-stage semantics, ranking, and execution tradeoffs.

## API Map

### Client-Level APIs

- Connect to Chroma: `PersistentClient`, `HttpClient`, `AsyncHttpClient`, `CloudClient`
- Scope data isolation: tenant + database selection
- Perform admin/list operations (for example collection listing and lifecycle actions)

Start in [Clients](https://cookbook.chromadb.dev/core/clients/index.md), then use [Tenants and Databases](https://cookbook.chromadb.dev/core/tenants-and-databases/index.md) for multi-tenant setups.

### Collection-Level APIs

- Create/get collections: `create_collection`, `get_or_create_collection`, `get_collection`
- Write data: `add`, `upsert`, `update`, `delete`
- Read data: `get`, `query`, `count`
- Manage collection settings: metadata, index configuration, and cloning/forking patterns

Start in [Collections](https://cookbook.chromadb.dev/core/collections/index.md), then pair with [Filters](https://cookbook.chromadb.dev/core/filters/index.md) and [Document IDs](https://cookbook.chromadb.dev/core/document-ids/index.md).

### HTTP/OpenAPI Surface

- Explore server endpoints and OpenAPI: [API](https://cookbook.chromadb.dev/core/api/index.md)
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

- Operating local persistent deployments: [Storage Layout](https://cookbook.chromadb.dev/core/storage-layout/index.md), [WAL](https://cookbook.chromadb.dev/core/advanced/wal/index.md), [WAL Pruning](https://cookbook.chromadb.dev/core/advanced/wal-pruning/index.md)
- Production guardrails and limits: [System Constraints](https://cookbook.chromadb.dev/core/system_constraints/index.md), [Resources](https://cookbook.chromadb.dev/core/resources/index.md)
