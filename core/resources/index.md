# Resource Requirements

Chroma makes use of the following compute resources:

- RAM - In single-node/self-hosted deployments, Chroma keeps vector search structures in memory for low-latency search.
- Disk - Chroma persists data to disk, including the vector index files, metadata index, system DB, and write-ahead log (WAL).
- CPU - Chroma uses CPU for ingest, indexing, filtering, and search execution.

Use the formulas and heuristics below to estimate Chroma resource needs.

Scope

This page is primarily for single-node/self-hosted sizing (HNSW-based indexing). Distributed/Cloud deployments use different index internals (SPANN) and different resource behavior. See [Core Concepts](https://cookbook.chromadb.dev/core/concepts/#how-data-flows-through-chroma-cloud-distributed-chroma) and [SPANN Index Configuration](https://cookbook.chromadb.dev/core/configuration/#spann-index-configuration) for the distributed model.

## RAM

Once you select your embedding model, start with this lower-bound estimate for vector payload memory:

# payload_bytes

vectors × dimensions × 4

# payload_gib

payload_bytes

1024 3

Example (`10,000,000` vectors, `1536` dimensions):

# payload_bytes

# 10,000,000 × 1536 × 4

61,440,000,000

# payload_gib

61,440,000,000

1024 3 ≈ 57.2  GiB

- `number of vectors` - This is the number of vectors you plan to index. These are the documents in your Chroma collection (or chunks if you use LlamaIndex or LangChain terminology).
- `dimensionality of vectors` - This is the dimensionality of the vectors output by your embedding model. For example, if you use the `sentence-transformers/paraphrase-MiniLM-L6-v2` model, the dimensionality of the vectors is 384.
- `4 bytes` - This is the size of each component of a vector. Chroma relies on HNSW lib implementation that uses 32bit floats.

Treat this as a lower-bound estimate. Real memory usage is higher because of:

- HNSW graph/link overhead (affected by HNSW settings such as `hnsw:M` and `hnsw:construction_ef`)
- In-memory bruteforce buffer (`hnsw:batch_size`) before vectors are merged into HNSW
- Query-time and filter working memory, plus normal process overhead

For production sizing, add headroom and validate under realistic load.

## Quick Resource Calculator

Use this lightweight estimator to get a practical starting point.

Dataset size (number of vectors)

10k 100k 1M 10M

Selected: **-**

Embedding model (dimension)

MiniLM (384) Cohere (1024) OAI 3-small (1536) OAI 3-large (3072)

Memory profile

Balanced (+30%) Lean prototype (+15%) Heavy query load (+50%)

Storage profile

Typical mixed (~3x) Vector-heavy (~2x) Metadata-heavy (~4x)

Vector payload

-

Estimated RAM

-

Estimated Disk

-

CPU hint

-

This calculator is for single-node/self-hosted sizing. For distributed/cloud (SPANN), see [Core Concepts](https://cookbook.chromadb.dev/core/concepts/#how-data-flows-through-chroma-cloud-distributed-chroma) and [SPANN Index Configuration](https://cookbook.chromadb.dev/core/configuration/#spann-index-configuration).

Important: vector-first estimate

This calculator is **vector-first** and does not fully model document or index growth. If you store large documents (near model context limits), **document and metadata storage can exceed vector storage**. Chroma also maintains a SQLite full-text index (`embedding_fulltext_search`) used by `where_document` queries, which adds disk overhead. See [Storage Layout](https://cookbook.chromadb.dev/core/storage-layout/#metadata-segment) and [Filters](https://cookbook.chromadb.dev/core/filters/index.md) for details.

## Disk

Disk storage requirements depend on vectors, documents, metadata, and WAL behavior.

Use these heuristics:

- Start with at least the raw vector footprint plus several GB for metadata/documents/system data
- In many workloads, `2-4x` the vector payload estimate is a reasonable planning range
- If you store large documents/metadata blobs, disk needs can exceed that range
- If you rely on document filtering (`where_document`), plan additional space for SQLite FTS index structures

WAL Cleanup

Recent Chroma versions support automatic WAL pruning. If your persistent data directory was created on older versions, or if auto-pruning is disabled, run WAL cleanup once and verify WAL config. See [WAL Pruning](https://cookbook.chromadb.dev/core/advanced/wal-pruning/index.md) and [Maintenance](https://cookbook.chromadb.dev/running/maintenance/#wal-configuration).

### Temporary Disk Space

Chroma uses temporary storage for its SQLite3 related operations - sorting and buffering large queries. By default, SQLite3 uses `/tmp` for temporary storage.

There are two guidelines to follow:

- Have enough space if your application intends to make large queries or has multiple concurrent queries.
- Ensure temporary storage is on a fast disk to avoid performance bottlenecks.

You can configure the location of sqlite temp files with the `SQLITE_TMPDIR` environment variable.

SQLite3 Temporary Storage

You can read more about SQLite3 temporary storage in the [SQLite3 documentation](https://www.sqlite.org/tempfiles.html).

## CPU

There are no hard requirements for the CPU, but it is recommended to use as much CPU as you can spare as it directly relates to index and search speeds.
