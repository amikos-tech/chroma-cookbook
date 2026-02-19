# Concepts

This page has two tracks:

- [For General Users](#for-general-users)
- [For Power Users](#for-power-users)

## For General Users

### Tenancy and DB Hierarchies

The following picture illustrates the tenancy and DB hierarchy in Chroma:

![Tenancy and DB Hierarchy](../assets/images/chroma-tenancy-hierarchy.png)

!!! warn "Storage"

    In Chroma single-node, all data about tenancy, databases, collections and documents is stored in a single SQLite database.

### Tenants

A tenant is a logical grouping for a set of databases. A tenant is designed to model a single organization or user. A tenant can have multiple databases.

### Databases

A database is a logical grouping for a set of collections. A database is designed to model a single application or project. A database can have multiple collections.

### Collections

Collections are the grouping mechanism for embeddings, documents, and metadata.

### Documents

!!! note "Chunks of text"

    Documents in ChromaDB lingo are chunks of text that fit within the embedding model's context window.
    Unlike other frameworks that use the term "document" to mean a file, ChromaDB uses the term "document" to mean a chunk of text.

Documents are raw chunks of text that are associated with an embedding. Documents are stored in the database and can be queried.

### Metadata

Metadata is a dictionary of key-value pairs associated with an embedding.

Metadata values can be:

- strings
- integers
- floats (`float32`)
- booleans
- arrays of strings, integers, floats, or booleans (`Chroma >= 1.5.0`)

Array metadata constraints:

- all elements must be the same type
- empty arrays are not allowed
- nested arrays are not supported

See [Array Metadata](filters.md#array-metadata) for examples with `$contains` / `$not_contains`.

Runnable filter examples:

- [Python](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/filtering/python/filter_examples.py)
- [TypeScript](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/filtering/typescript/filter_examples.ts)
- [Rust](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/filtering/rust/src/main.rs)

### Embedding Function

Embedding functions (embedding models) expose a consistent interface for generating vectors from documents or queries.

See Chroma's official [embedding integrations](https://docs.trychroma.com/integrations#%F0%9F%A7%AC-embedding-integrations).

### Embeddings

An embedding is a vector representation of a document, typically a list of `float32` values.

### Distance Function

Distance functions define similarity between vectors:

- Cosine: common for semantic text similarity
- Euclidean (`l2`): geometric distance
- Inner Product (`ip`): common in recommendation-like scenarios

### How Data Flows Through Chroma Cloud (Distributed Chroma)

The animated flows below model Chroma Cloud / distributed Chroma, where gateway, WAL, compaction, and query execution are separate services. In local or single-node deployments, the same logical stages still apply but are often co-located in one process.

#### Write Path (Add / Update / Upsert / Delete)

<div class="concept-flow-card">
  <div class="concept-flow-header">
    <span class="concept-flow-title">Write Path</span>
    <span class="concept-flow-badge">Cloud/distributed: durable first, indexed asynchronously</span>
  </div>
  <div class="concept-flow-line" role="img" aria-label="Client to gateway to write-ahead log service to compactor to indexes">
    <div class="concept-node">Client</div>
    <div class="concept-link"><span class="concept-pulse"></span></div>
    <div class="concept-node">Gateway</div>
    <div class="concept-link"><span class="concept-pulse"></span></div>
    <div class="concept-node">WAL Service</div>
    <div class="concept-link"><span class="concept-pulse"></span></div>
    <div class="concept-node">Compactor</div>
    <div class="concept-link"><span class="concept-pulse"></span></div>
    <div class="concept-node">Indexes</div>
  </div>
  <p class="concept-flow-note">In distributed Chroma, writes are acknowledged after WAL durability. Compaction materializes new index versions in the background.</p>
</div>

#### Query Path (Get / Query / Search)

<div class="concept-flow-card">
  <div class="concept-flow-header">
    <span class="concept-flow-title">Query Path</span>
    <span class="concept-flow-badge">Cloud/distributed: index + WAL consistency</span>
  </div>
  <div class="concept-flow-line" role="img" aria-label="Client to gateway to query executor to filter and plan to vector, full-text, and metadata indexes to ranked results">
    <div class="concept-node">Client</div>
    <div class="concept-link"><span class="concept-pulse"></span></div>
    <div class="concept-node">Gateway</div>
    <div class="concept-link"><span class="concept-pulse"></span></div>
    <div class="concept-node">Query Engine</div>
    <div class="concept-link"><span class="concept-pulse"></span></div>
    <div class="concept-node">Filter + Plan</div>
    <div class="concept-link"><span class="concept-pulse"></span></div>
    <div class="concept-node">Vector / FTS / Metadata</div>
    <div class="concept-link"><span class="concept-pulse"></span></div>
    <div class="concept-node">Ranked Results</div>
  </div>
  <p class="concept-flow-note">In distributed Chroma, strongly consistent reads combine indexed state with recent WAL state.</p>
</div>

The detailed query pipeline is described in [Advanced Queries](advanced/queries.md).

Implementation-level (code-backed) local-vs-distributed query diagrams are in the [For Power Users](#for-power-users) section below.

## For Power Users

This section is a code-oriented map of distributed Chroma, based on the Rust workspace (`rust/`) and the distributed architecture docs.

### Execution Paths (Code-Backed)

These diagrams are traced from the Rust frontend/segment/log implementation (`rust/frontend`, `rust/segment`, `rust/log`).

#### Interactive Local Query Path (Single-Node SQLite + HNSW)

<div class="concept-query-card" data-concept-pipeline>
  <div class="concept-query-header">
    <span class="concept-query-title">Interactive Local Query Pipeline</span>
    <span class="concept-query-badge">Single-node: SQLite + HNSW Local</span>
  </div>
  <p class="concept-query-help">Click any stage to inspect what happens in the local executor path. First read triggers backfill/purge into local metadata + HNSW segments.</p>

  <div class="concept-query-diagram" role="group" aria-label="Interactive local query pipeline for single-node Chroma">
    <button class="concept-query-node concept-query-node--main concept-query-stage-validation is-active" type="button" data-stage="local_validation" data-title="Validation + Segment Resolve" data-service="FrontendServer + ServiceBasedFrontend" data-description="Request validation/auth happens in frontend, then collection + segment ids are resolved before plan execution." data-related="">Validation + Resolve</button>
    <div class="concept-query-down concept-query-down--1" aria-hidden="true"></div>

    <button class="concept-query-node concept-query-node--main concept-query-stage-prefilter" type="button" data-stage="local_metadata_prefilter" data-title="Metadata Pre-Filter" data-service="LocalExecutor + SqliteMetadataReader" data-description="Filter predicates are executed against the SQLite metadata segment to narrow candidate user ids." data-related="local_prefilter_get,local_sqlite_meta_prefilter">Metadata Pre-Filter</button>
    <div class="concept-query-call concept-query-call--prefilter" data-edge="local_prefilter_get" aria-hidden="true">
      <span class="concept-query-call-label">get</span>
      <span class="concept-query-call-arrow"></span>
    </div>
    <button class="concept-query-node concept-query-node--remote concept-query-stage-meta-a" type="button" data-stage="local_sqlite_meta_prefilter" data-title="SQLite Metadata Segment" data-service="SqliteMetadataReader" data-description="Rows are read from local SQLite metadata tables for candidate selection." data-related="local_prefilter_get,local_metadata_prefilter">SQLite Metadata</button>

    <div class="concept-query-down concept-query-down--2" aria-hidden="true"></div>
    <button class="concept-query-node concept-query-node--main concept-query-stage-knn" type="button" data-stage="local_knn_search" data-title="KNN Search" data-service="LocalExecutor + LocalSegmentManager" data-description="LocalExecutor gets an HNSW reader and runs ANN query over local vector data." data-related="local_knn_query,local_hnsw_segment">KNN Search</button>
    <div class="concept-query-call concept-query-call--knn" data-edge="local_knn_query" aria-hidden="true">
      <span class="concept-query-call-label">query</span>
      <span class="concept-query-call-arrow"></span>
    </div>
    <button class="concept-query-node concept-query-node--remote concept-query-stage-hnsw" type="button" data-stage="local_hnsw_segment" data-title="HNSW Local Persisted Segment" data-service="LocalHnswSegmentReader" data-description="ANN neighbors are retrieved from the local HNSW persisted segment." data-related="local_knn_query,local_knn_search">HNSW Local</button>

    <div class="concept-query-down concept-query-down--3" aria-hidden="true"></div>
    <button class="concept-query-node concept-query-node--main concept-query-stage-fetch" type="button" data-stage="local_metadata_fetch" data-title="Metadata Fetch" data-service="LocalExecutor + SqliteMetadataReader" data-description="Top ids are hydrated with document + metadata via a second local SQLite metadata read." data-related="local_fetch_get,local_sqlite_meta_fetch">Metadata Fetch</button>
    <div class="concept-query-call concept-query-call--fetch" data-edge="local_fetch_get" aria-hidden="true">
      <span class="concept-query-call-label">get</span>
      <span class="concept-query-call-arrow"></span>
    </div>
    <button class="concept-query-node concept-query-node--remote concept-query-stage-meta-b" type="button" data-stage="local_sqlite_meta_fetch" data-title="SQLite Metadata Hydration" data-service="SqliteMetadataReader" data-description="Local SQLite metadata/document payloads are loaded for final response assembly." data-related="local_fetch_get,local_metadata_fetch">SQLite Metadata</button>

    <div class="concept-query-down concept-query-down--4" aria-hidden="true"></div>
    <button class="concept-query-node concept-query-node--main concept-query-stage-result" type="button" data-stage="local_result_aggregation" data-title="Result Aggregation" data-service="ServiceBasedFrontend" data-description="Query response payload is assembled and returned to the client." data-related="">Result Aggregation</button>
  </div>

  <div class="concept-query-detail" aria-live="polite">
    <p class="concept-query-detail-label">Selected stage</p>
    <p class="concept-query-detail-title" data-pipeline-detail-title>Validation + Segment Resolve</p>
    <p class="concept-query-detail-service"><strong>Service:</strong> <span data-pipeline-detail-service>FrontendServer + ServiceBasedFrontend</span></p>
    <p class="concept-query-detail-text" data-pipeline-detail-text>Request validation/auth happens in frontend, then collection + segment ids are resolved before plan execution.</p>
  </div>
</div>

#### Distributed Frontend Dispatch Path (Cloud)

<div class="concept-flow-card">
  <div class="concept-flow-header">
    <span class="concept-flow-title">Distributed Query Path in Frontend</span>
    <span class="concept-flow-badge">Cloud: frontend dispatches, workers execute</span>
  </div>
  <div class="concept-flow-line concept-flow-line--dense" role="img" aria-label="Client to frontend api to resolver and executor to query worker over gRPC to worker indexes to results">
    <div class="concept-node">Client</div>
    <div class="concept-link"><span class="concept-pulse"></span></div>
    <div class="concept-node">Frontend API</div>
    <div class="concept-link"><span class="concept-pulse"></span></div>
    <div class="concept-node">Resolver + Executor</div>
    <div class="concept-link"><span class="concept-pulse"></span></div>
    <div class="concept-node">gRPC Query Worker</div>
    <div class="concept-link"><span class="concept-pulse"></span></div>
    <div class="concept-node">Worker Indexes</div>
    <div class="concept-link"><span class="concept-pulse"></span></div>
    <div class="concept-node">Results</div>
  </div>
  <p class="concept-flow-note">In distributed mode, frontend routes Knn/Get/Search plans to query workers over gRPC. Worker-side execution uses distributed segment/index types (HnswDistributed or Spann with blockfile segments), not frontend-local SQLite + HNSW providers.</p>
</div>

Code references for the two paths:

- Local segment types on collection create: [`Executor::Local` creates `HnswLocalPersisted` + `Sqlite`](https://github.com/chroma-core/chroma/blob/main/rust/frontend/src/impls/service_based_frontend.rs)
- Local query execution: [`LocalExecutor` uses `SqliteMetadataReader` + `LocalSegmentManager::get_hnsw_reader`](https://github.com/chroma-core/chroma/blob/main/rust/frontend/src/executor/local.rs)
- Distributed query execution: [`DistributedExecutor` dispatches `knn/get/search` via gRPC query clients](https://github.com/chroma-core/chroma/blob/main/rust/frontend/src/executor/distributed.rs)

### Distributed Architecture (Main Services)

- Gateway / frontend API service: `rust/frontend` ([server](https://github.com/chroma-core/chroma/blob/main/rust/frontend/src/server.rs))
- Query executor service: `rust/worker` ([query entrypoint](https://github.com/chroma-core/chroma/blob/main/rust/worker/src/lib.rs), [query server](https://github.com/chroma-core/chroma/blob/main/rust/worker/src/server.rs))
- Compaction service: `rust/worker` ([compaction orchestrator](https://github.com/chroma-core/chroma/blob/main/rust/worker/src/execution/orchestration/compact.rs))
- Write-ahead log: `rust/wal3` ([design README](https://github.com/chroma-core/chroma/blob/main/rust/wal3/README.md))
- Garbage collector service: `rust/garbage_collector` ([orchestrator](https://github.com/chroma-core/chroma/blob/main/rust/garbage_collector/src/garbage_collector_orchestrator_v2.rs))

See also the official architecture doc: [Distributed Chroma Architecture](https://github.com/chroma-core/chroma/blob/main/docs/mintlify/docs/overview/architecture.mdx).

### Main Primitives and Index Families

At the segment/type level (`rust/types/src/segment.rs`), distributed Chroma uses segment types such as:

- `BlockfileMetadata`, `BlockfileRecord`
- `HnswDistributed`
- `Spann`, `QuantizedSpann`
- `Sqlite`

And at the index crate level (`rust/index/src`), major families include:

- Vector ANN: `hnsw`, `spann`, `quantized_spann`
- Full text: `fulltext`
- Metadata: `metadata`
- Sparse retrieval support: `sparse`

### SPANN in Distributed Chroma

Core implementation: `rust/index/src/spann/types.rs`.

Operationally, SPANN combines:

- a head/center ANN structure (HNSW over centers)
- posting lists keyed by center/head id (blockfile-backed)
- a versions map (`doc_offset_id -> version`) to filter stale entries
- a persisted `max_head_id` for deterministic head allocation across compactions

The write-side behavior includes:

- add/update/delete on posting lists and versions map
- splitting oversized posting lists into new heads
- reassigning points to nearby heads after split/merge operations
- optional garbage collection policies:
  - posting-list random-sample cleanup
  - HNSW full rebuild or delete-percentage-triggered rebuild

### Blockfile Format and Update Model

Core implementation: `rust/blockstore/src/arrow`.

Production blockfiles are Arrow-backed and use:

- immutable blocks for persisted data
- an in-memory sparse index mapping key ranges to block ids
- writer-side deltas for mutation batching (`set`/`delete`)
- copy-on-write for updates via `fork(...)`

Update lifecycle:

1. Writer mutates deltas and may split blocks when over target block size.
2. Sparse index is updated to point at new block ids.
3. `commit()` converts deltas into immutable blocks and prepares a flusher.
4. `flush()` persists blocks, then atomically persists root metadata/sparse index.

Relevant code:

- [provider](https://github.com/chroma-core/chroma/blob/main/rust/blockstore/src/arrow/provider.rs)
- [blockfile writer](https://github.com/chroma-core/chroma/blob/main/rust/blockstore/src/arrow/blockfile.rs)
- [flusher](https://github.com/chroma-core/chroma/blob/main/rust/blockstore/src/arrow/flusher.rs)
- [root + sparse index](https://github.com/chroma-core/chroma/blob/main/rust/blockstore/src/arrow/root.rs)

### Compaction and Registration

Compaction in distributed mode (`rust/worker/src/execution/orchestration/compact.rs`) follows an explicit staged flow:

- fetch and materialize logs
- apply to segment writers (record/metadata/vector)
- commit and flush segment artifacts
- register new segment metadata and offsets in sysdb/log metadata

This is the core bridge from WAL durability to read-optimized segment versions.

### Garbage Collection (Index Files + WAL)

Two GC tracks run in the Rust implementation:

- Segment/index artifact GC in `rust/garbage_collector`:
  - construct collection version graph (including fork dependencies)
  - compute versions to delete using cutoff + min-versions retention
  - compute unreferenced files and clean up (dry-run / rename / delete)
- WAL GC in `wal3`:
  - three-phase GC dance (compute garbage, manifest synchronization, delete)
  - cursor-driven safety so required log ranges remain pinned

Relevant code:

- [version graph construction](https://github.com/chroma-core/chroma/blob/main/rust/garbage_collector/src/construct_version_graph_orchestrator.rs)
- [version deletion policy](https://github.com/chroma-core/chroma/blob/main/rust/garbage_collector/src/operators/compute_versions_to_delete_from_graph.rs)
- [unused file cleanup](https://github.com/chroma-core/chroma/blob/main/rust/garbage_collector/src/operators/delete_unused_files.rs)
- [unused WAL cleanup](https://github.com/chroma-core/chroma/blob/main/rust/garbage_collector/src/operators/delete_unused_logs.rs)
