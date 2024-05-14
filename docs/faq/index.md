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


