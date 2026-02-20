# Chroma Queries

This document attempts to capture how Chroma performs queries.

## Basic concepts

Chroma uses two types of indices (segments) which it queries over:

- Metadata Index - this is stored in the `chroma.sqlite3` and queried with SQL. Chroma stores metadata for all collections in this index.
- Vector Index - this is the `HNSW` index stored under the UUID-named dirs under chroma persistent dir (or in memory for EphemeralClient). One index per collection.

### Metadata Index

The metadata index consists of two tables:

- `embeddings` - this is one-to-one mapping with the vectors stored in your collections
- `embedding_metadata` - this is N+1 mapping to the vectors stored in your collections. Where `N` represents the number of metadata fields per record and can vary for records. There is at least one entry in the `embedding_metadata` table per embedding which represents the document.

## Query Pipeline

The query pipeline in Chroma:

- Validation - the query is validated
- Metadata pre-filter - Chroma plans a SQL query to select IDs to pass to KNN search. This step is skipped if `where` or `where_document` are not provided.
- KNN search in HNSW index - Similarity search with based on the embedded user query(ies). If metadata pre-filter returned any IDs to search on, only those IDs are searched. The KNN search will also return actual vectors should `included` contain `embeddings`.
- Post-search query to fetch metadata - Fetch metadata for the IDs returned from the KNN search.
- Result aggregation - Aggregate the results from the metadata and the KNN search and ensure all `included` fields are populated.

Query Pipeline?

Why is it called a pipeline? Because each step in the query process depends on its predecessor's output.

### Validation

The following validations are performed:

- Validate `where` if present
- Validate `where_document` if present
- Ensure collection exists
- Validate query embeddings dimensions match that of the collection

### Metadata Pre-Filter

TBD

### KNN Search in HNSW Index

TBD

### Post-Search Query to Fetch Metadata

TBD

### Result Aggregation

Result aggregation makes sure that results from the metadata fetch and the KNN search are fused together into the final result set.
