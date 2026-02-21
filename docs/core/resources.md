# Resource Requirements

Chroma makes use of the following compute resources:

- RAM - In single-node/self-hosted deployments, Chroma keeps vector search structures in memory for low-latency search.
- Disk - Chroma persists data to disk, including the vector index files, metadata index, system DB, and write-ahead
  log (WAL).
- CPU - Chroma uses CPU for ingest, indexing, filtering, and search execution.

Use the formulas and heuristics below to estimate Chroma resource needs.

!!! info "Scope"

    This page is primarily for single-node/self-hosted sizing (HNSW-based indexing).
    Distributed/Cloud deployments use different index internals (SPANN) and different resource behavior.
    See [Core Concepts](concepts.md#how-data-flows-through-chroma-cloud-distributed-chroma) and
    [SPANN Index Configuration](configuration.md#spann-index-configuration) for the distributed model.

## RAM

Once you select your embedding model, start with this lower-bound estimate for vector payload memory:

<div class="resource-formula" role="group" aria-label="Vector payload formulas">
  <math class="resource-formula__math" display="block" aria-label="payload bytes equals vectors times dimensions times 4">
    <mrow>
      <mtext>payload_bytes</mtext>
      <mo>=</mo>
      <mtext>vectors</mtext>
      <mo>&#x00D7;</mo>
      <mtext>dimensions</mtext>
      <mo>&#x00D7;</mo>
      <mn>4</mn>
    </mrow>
  </math>
  <math class="resource-formula__math" display="block" aria-label="payload gib equals payload bytes divided by 1024 cubed">
    <mrow>
      <mtext>payload_gib</mtext>
      <mo>=</mo>
      <mfrac>
        <mtext>payload_bytes</mtext>
        <msup>
          <mn>1024</mn>
          <mn>3</mn>
        </msup>
      </mfrac>
    </mrow>
  </math>
</div>

Example (`10,000,000` vectors, `1536` dimensions):

<div class="resource-formula resource-formula--example" role="group" aria-label="Vector payload example">
  <math class="resource-formula__math" display="block" aria-label="payload bytes equals ten million times 1536 times 4 equals 61440000000">
    <mrow>
      <mtext>payload_bytes</mtext>
      <mo>=</mo>
      <mn>10,000,000</mn>
      <mo>&#x00D7;</mo>
      <mn>1536</mn>
      <mo>&#x00D7;</mo>
      <mn>4</mn>
      <mo>=</mo>
      <mn>61,440,000,000</mn>
    </mrow>
  </math>
  <math class="resource-formula__math" display="block" aria-label="payload gib equals 61440000000 divided by 1024 cubed approximately 57.2">
    <mrow>
      <mtext>payload_gib</mtext>
      <mo>=</mo>
      <mfrac>
        <mn>61,440,000,000</mn>
        <msup>
          <mn>1024</mn>
          <mn>3</mn>
        </msup>
      </mfrac>
      <mo>&#x2248;</mo>
      <mn>57.2</mn>
      <mtext>&#x00A0;GiB</mtext>
    </mrow>
  </math>
</div>

- `number of vectors` - This is the number of vectors you plan to index. These are the documents in your Chroma
  collection (or chunks if you use LlamaIndex or LangChain terminology).
- `dimensionality of vectors` - This is the dimensionality of the vectors output by your embedding model. For example,
  if you use the `sentence-transformers/paraphrase-MiniLM-L6-v2` model, the dimensionality of the vectors is 384.
- `4 bytes` - This is the size of each component of a vector. Chroma relies on HNSW lib implementation that uses 32bit
  floats.

Treat this as a lower-bound estimate. Real memory usage is higher because of:

- HNSW graph/link overhead (affected by HNSW settings such as `hnsw:M` and `hnsw:construction_ef`)
- In-memory bruteforce buffer (`hnsw:batch_size`) before vectors are merged into HNSW
- Query-time and filter working memory, plus normal process overhead

For production sizing, add headroom and validate under realistic load.

## Quick Resource Calculator

Use this lightweight estimator to get a practical starting point.

<div class="resource-calc" data-resource-calculator>
  <div class="resource-calc__inputs">
    <label class="resource-calc__field resource-calc__field--vectors">
      <span>Dataset size (number of vectors)</span>
      <input data-input="vector_stop" type="range" min="0" max="3" step="1" value="2" />
      <div class="resource-calc__ticks" aria-hidden="true">
        <span>10k</span>
        <span>100k</span>
        <span>1M</span>
        <span>10M</span>
      </div>
      <div class="resource-calc__current">
        Selected:
        <strong data-output="vector_count">-</strong>
      </div>
    </label>
    <label class="resource-calc__field resource-calc__field--model">
      <span>Embedding model (dimension)</span>
      <select data-input="model_dimension">
        <option value="384">MiniLM (384)</option>
        <option value="1024">Cohere (1024)</option>
        <option value="1536" selected>OAI 3-small (1536)</option>
        <option value="3072">OAI 3-large (3072)</option>
      </select>
    </label>
    <label class="resource-calc__field resource-calc__field--memory">
      <span>Memory profile</span>
      <select data-input="memory_profile">
        <option value="balanced" selected>Balanced (+30%)</option>
        <option value="lean">Lean prototype (+15%)</option>
        <option value="heavy">Heavy query load (+50%)</option>
      </select>
    </label>
    <label class="resource-calc__field resource-calc__field--storage">
      <span>Storage profile</span>
      <select data-input="storage_profile">
        <option value="typical" selected>Typical mixed (~3x)</option>
        <option value="vector_heavy">Vector-heavy (~2x)</option>
        <option value="metadata_heavy">Metadata-heavy (~4x)</option>
      </select>
    </label>
  </div>

  <div class="resource-calc__results">
    <div class="resource-calc__card">
      <div class="resource-calc__label">Vector payload</div>
      <div class="resource-calc__value" data-output="payload_gib">-</div>
    </div>
    <div class="resource-calc__card">
      <div class="resource-calc__label">Estimated RAM</div>
      <div class="resource-calc__value" data-output="ram_gib">-</div>
    </div>
    <div class="resource-calc__card">
      <div class="resource-calc__label">Estimated Disk</div>
      <div class="resource-calc__value" data-output="disk_gib">-</div>
    </div>
    <div class="resource-calc__card">
      <div class="resource-calc__label">CPU hint</div>
      <div class="resource-calc__value" data-output="vcpu_hint">-</div>
    </div>
  </div>

  <p class="resource-calc__note">
    This calculator is for single-node/self-hosted sizing. For distributed/cloud (SPANN), see
    <a href="../concepts/#how-data-flows-through-chroma-cloud-distributed-chroma">Core Concepts</a> and
    <a href="../configuration/#spann-index-configuration">SPANN Index Configuration</a>.
  </p>
</div>

!!! warning "Important: vector-first estimate"

    This calculator is **vector-first** and does not fully model document or index growth.
    If you store large documents (near model context limits), **document and metadata storage can exceed vector storage**.
    Chroma also maintains a SQLite full-text index (`embedding_fulltext_search`) used by `where_document` queries, which adds disk overhead.
    See [Storage Layout](storage-layout.md#metadata-segment) and [Filters](filters.md) for details.

## Disk

Disk storage requirements depend on vectors, documents, metadata, and WAL behavior.

Use these heuristics:

- Start with at least the raw vector footprint plus several GB for metadata/documents/system data
- In many workloads, `2-4x` the vector payload estimate is a reasonable planning range
- If you store large documents/metadata blobs, disk needs can exceed that range
- If you rely on document filtering (`where_document`), plan additional space for SQLite FTS index structures

!!! note "WAL Cleanup"

    Recent Chroma versions support automatic WAL pruning.
    If your persistent data directory was created on older versions, or if auto-pruning is disabled, run WAL cleanup once and verify WAL config.
    See [WAL Pruning](advanced/wal-pruning.md) and [Maintenance](../running/maintenance.md#wal-configuration).

### Temporary Disk Space

Chroma uses temporary storage for its SQLite3 related operations - sorting and buffering large queries. By default,
SQLite3 uses `/tmp` for temporary storage.

There are two guidelines to follow:

- Have enough space if your application intends to make large queries or has multiple concurrent queries.
- Ensure temporary storage is on a fast disk to avoid performance bottlenecks.

You can configure the location of sqlite temp files with the `SQLITE_TMPDIR` environment variable.

!!! tip "SQLite3 Temporary Storage"

    You can read more about SQLite3 temporary storage in the [SQLite3 documentation](https://www.sqlite.org/tempfiles.html).

## CPU

There are no hard requirements for the CPU, but it is recommended to use as much CPU as you can spare as it directly
relates to index and search speeds.
