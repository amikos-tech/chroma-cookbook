# Resource Requirements

Chroma makes use of the following compute resources:

- RAM - Chroma stores the vector HNSW index in-memory. This allows it to perform blazing fast semantic searches.
- Disk - Chroma persists all data to disk. This includes the vector HNSW index, metadata index, system DB, and the
  write-ahead log (WAL).
- CPU - Chroma uses CPU for indexing and searching vectors.

Here are some formulas and heuristics to help you estimate the resources you need to run Chroma.

## RAM

Once you select your embedding model, use the following formula for calculating RAM storage requirements for the vector
HNSW index:

`number of vectors` * `dimensionality of vectors` * `4 bytes` = `RAM required`

- `number of vectors` - This is the number of vectors you plan to index. These are the documents in your Chroma
  collection (or chunks if you use LlamaIndex or LangChain terminology).
- `dimensionality of vectors` - This is the dimensionality of the vectors output by your embedding model. For example,
  if you use the `sentence-transformers/paraphrase-MiniLM-L6-v2` model, the dimensionality of the vectors is 384.
- `4 bytes` - This is the size of each component of a vector. Chroma relies on HNSW lib implementation that uses 32bit
  floats.

## Disk

Disk storage requirements mainly depend on what metadata you store and the number of vectors you index. The heuristics
is at least 2-4x the RAM required for the vector HNSW index.

!!! note "WAL Cleanup"

    Since version `0.5.6` Chroma automatically cleans up the WAL file.

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
