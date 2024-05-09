# Frequently Asked Questions and Commonly Encountered Issues

This section provides answers to frequently asked questions and information on commonly encountered problem when working
with Chroma. These information below is based on interactions with the Chroma community.

## Frequently Asked Questions

!!! note "Coming Soon"

    This section is under construction and will be available soon.

## Commonly Encountered Problems

### Collection Dimensionality Mismatch

**Symptoms:**

This error usually exhibits in the following error message:

`chromadb.errors.InvalidDimensionException: Embedding dimension XXX does not match collection dimensionality YYY`

**Context:**

When adding/upserting or querying Chroma collection. This error is more visible/pronounced when using the Python APIs, but will
also show up in also surface in other clients.

**Cause:**

You are trying to add or query a collection with vectors of a different dimensionality than the collection was created
with.

**Explanation/Solution:**

When you first create a collection `client.create_collection("name")`, the collection will not have knowledge of its
dimensionality so that allows you to add vectors of any dimensionality to it. However, once your first batch of
embeddings is added to the collection, the collection will be locked to that dimensionality. Any subsequent query or
add operation must use embeddings of the same dimensionality. The dimensionality of the embeddings is a characteristic
of the embedding model (EmbeddingFunction) used to generate the embeddings, therefore it is important to consistently
use the same EmbeddingFunction when adding or querying a collection.

!!! tip "Tip"

    If you do not specify an `embedding_function` when creating (`client.create_collection`) or getting
    (`client.get_or_create_collection`) a collection, Chroma wil use its default [embedding function](https://docs.trychroma.com/embeddings#default-all-minilm-l6-v2).


