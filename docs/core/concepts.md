# Chroma Core Concepts

## Tenancy and DB Hierarchies

The following picture illustrates the tenancy and DB hierarchy in Chroma:

![Tenancy and DB Hierarchy](../assets/images/chroma-tenancy-hierarchy.png)

## Tenants

A tenant is a logical grouping for a set of databases. A tenant is designed to model a single organization or user. A
tenant can have multiple databases.

## Databases

A database is a logical grouping for a set of collections. A database is designed to model a single application or
project. A database can have multiple collections.

## Collections

Collections are the grouping mechanism for embeddings, documents, and metadata.

## Documents

!!! note "Chunks of text"

    Documents in ChromaDB lingo are chunks of text that fits within the embedding model's context window. 
    Unlike other frameworks that use the term "document" to mean a file, 
    ChromaDB uses the term "document" to mean a chunk of text.

Documents are raw chunks of text that are associated with an embedding. Documents are stored in the database and can be
queried for.

## Metadata

Metadata is a dictionary of key-value pairs that can be associated with an embedding. Metadata is stored in the
database and can be queried for.

Metadata values can be of the following types:

- strings
- integers
- floats
- booleans

## Embedding Function

Also referred to as embedding model, embedding functions in ChromaDB are wrappers that expose a consistent interface for
generating embedding vectors from documents or text queries.

For a list of supported embedding functions see Chroma's
official [documentation](https://docs.trychroma.com/embeddings).

## Distance Function

Distance functions help in calculating the difference (distance) between two embedding vectors. ChromaDB supports the
following distance functions:

- cosine - Useful for text similarity
- euclidean (L2) - useful for text similarity, sensitive to noise
- Inner Product (IP) - recommender systems

## Embedding Vector

## Embedding Model

## Document and Metadata Index

## Vector Index (HNSW Index)

Under the hood (ca. v0.4.22) Chroma uses its
own [fork](https://github.com/chroma-core/hnswlib) [HNSW lib](https://github.com/nmslib/hnswlib) for indexing and
searching vectors.

In a single-node mode, Chroma will create a single HNSW index for each collection. The index is stored in a subdir of
your persistent dir, named after the collection id (UUID-based).

The HNSW lib uses [fast ANN](https://arxiv.org/abs/1603.09320) algo to search the vectors in the index.



