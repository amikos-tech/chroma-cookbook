# Chroma System Constraints

This section contains common constraints of Chroma.

- Chroma is thread-safe
- Chroma is not process-safe for concurrent writers sharing the same local persistence path
- Multiple Chroma clients can be created from one or more threads within the same process (`PersistentClient`, `EphemeralClient`/`Client`, `HttpClient`, `AsyncHttpClient`, `CloudClient`)
- A collection's name is unique within a database (and therefore unique for a given Tenant + DB pair)
- A collection's dimension is fixed once embeddings are first written; subsequent writes and query embeddings must match that dimension
- Treat embedding function + distance metric as part of a collection's retrieval contract. Even where compatible embedding-function configuration updates are accepted, existing vectors are not re-embedded; switching models for existing data requires creating a new collection and re-indexing.
- Chroma is commonly used in two deployment patterns in this cookbook: embedded (local `PersistentClient`/`EphemeralClient`) and client/server (`HttpClient`/`AsyncHttpClient` with a running Chroma server, including managed cloud deployments)
- The distance function cannot be changed after collection creation.
- In embedded/single-node deployments, vector index segments are loaded into process memory on use. Memory growth follows the active working set unless you configure segment-cache controls (for example LRU with a memory limit).
- For single-node deployments, scaling is primarily vertical. For horizontal scale across larger workloads, use distributed Chroma/Cloud (or application-managed sharding across multiple single-node instances).

## Operational Modes

In this cookbook, Chroma is shown in two deployment patterns:

- Embedded (local process) - Chroma runs in your application process with local persistence.
- Client/Server - Chroma runs as a separate server process and clients connect over HTTP. This includes both self-hosted servers and managed cloud deployments.

Depending on the mode you choose, you will need to consider the following component responsibilities:

- Embedded:
  - Local clients (`PersistentClient`, `EphemeralClient`, `Client`) - Responsible for persistence, embedding (if configured), and querying in the same process
- Client/Server:
  - HTTP clients (`HttpClient`, `AsyncHttpClient`, JS/TS `ChromaClient`, `CloudClient`) - Responsible for embedding calls (or providing precomputed embeddings) and communication with the Chroma server APIs
  - Server - Responsible for persistence, indexing, and query execution

### Deployment Comparison

| Deployment Pattern                 | Client Responsibilities                         | Server Responsibilities                         | Scaling Pattern                                        | Best Fit                                             |
| ---------------------------------- | ----------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------- |
| Embedded (local process)           | Embed (if configured), write/read/query locally | N/A (in-process)                                | Primarily vertical                                     | Local dev, small deployments, lowest latency         |
| Client/Server (single-node server) | Embed or provide embeddings, call API           | Persistence, indexing, query execution          | Primarily vertical for DB node; app tier can scale out | Shared server across apps/processes                  |
| Distributed / Cloud                | Embed or provide embeddings, call API           | Distributed persistence/indexing/query services | Horizontal                                             | Large scale, high concurrency, operational isolation |
