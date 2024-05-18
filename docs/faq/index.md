# Frequently Asked Questions and Commonly Encountered Issues

This section provides answers to frequently asked questions and information on commonly encountered problem when working
with Chroma. These information below is based on interactions with the Chroma community.

## Frequently Asked Questions

### What does Chroma use to index embedding vectors?

Chroma uses its own [fork]() of HNSW lib for indexing and searching embeddings.

**Alternative Questions:**

- What library does Chroma use for vector index and search?
- What algorithm does Chroma use for vector search?

### How to set dimensionality of my collections?

When creating a collection, its dimensionality is determined by the dimensionality of the first embedding added to it.
Once the dimensionality is set, it cannot be changed. Therefore, it is important to consistently use embeddings of the
same dimensionality when adding or querying a collection.

**Example:**

```python
import chromadb

client = chromadb.Client()

collection = client.create_collection("name")  # dimensionality is not set yet

# add an embedding to the collection
collection.add(ids=["id1"], embeddings=[[1, 2, 3]])  # dimensionality is set to 3
```

**Alternative Questions:**

- Can I change the dimensionality of a collection?

### Can I use `transformers` models with Chroma?

Generally, yes you can use `transformers` models with Chroma. Although Chroma does not provide a wrapper for this, you
can use `SentenceTransformerEmbeddingFunction` to achieve the same result. The sentence-transformer library will
implicitly do mean-pooling on the last hidden layer, and you'll get a warning about
it - `No sentence-transformers model found with name [model name]. Creating a new one with MEAN pooling.`

**Example:**

```python
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

ef = SentenceTransformerEmbeddingFunction(model_name="FacebookAI/xlm-roberta-large-finetuned-conll03-english")

print(ef(["test"]))
```

!!! warn "Warning"

    Not all models will work with the above method. Also mean pooling may not be the best strategy for the model. 
    Read the model card and try to understand what if any pooling the creators recommend. You may also want to normalize
    the embeddings before adding them to Chroma (pass `normalize_embeddings=True` to the `SentenceTransformerEmbeddingFunction` 
    EF constructor).

## Commonly Encountered Problems

### Collection Dimensionality Mismatch

**Symptoms:**

This error usually exhibits in the following error message:

`chromadb.errors.InvalidDimensionException: Embedding dimension XXX does not match collection dimensionality YYY`

**Context:**

When adding/upserting or querying Chroma collection. This error is more visible/pronounced when using the Python APIs,
but will
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

### Large Distances in Search Results

**Symptoms:**

When querying a collection, you get results that are in the 10s or 100s.

**Context:**

Frequently when using you own embedding function.

**Cause:**

The embeddings are not normalized.

**Explanation/Solution:**

`L2` (Euclidean distance) and `IP` (inner product) distance metrics are sensitive to the magnitude of the vectors.
Chroma uses `L2` by
default. Therefore, it is recommended to normalize the embeddings before adding them to Chroma.

Here is an example how to normalize embeddings using L2 norm:

```python
import numpy as np


def normalize_L2(vector):
    """Normalizes a vector to unit length using L2 norm."""
    norm = np.linalg.norm(vector)
    if norm == 0:
        return vector
    return vector / norm
```

### `OperationalError: no such column: collections.topic`

**Symptoms:**

The error `OperationalError: no such column: collections.topic` is raised when trying to access Chroma locally or
remotely.

**Context:**

After upgrading to Chroma `0.5.0` or accessing your Chroma persistent data with Chroma client version `0.5.0`.

**Cause:**

In version `0.5.x` Chroma has made some SQLite3 schema changes that are not backwards compatible with the previous
versions. Once you access your persistent data on the server or locally with the new Chroma version it will
automatically migrate to the new schema. This operation is not reversible.

**Explanation/Solution:**

To resolve this issue you will need to upgrade all your clients accessing the Chroma data to version `0.5.x`.

Here's a link to the migration performed by
Chroma - https://github.com/chroma-core/chroma/blob/main/chromadb/migrations/sysdb/00005-remove-topic.sqlite.sql
