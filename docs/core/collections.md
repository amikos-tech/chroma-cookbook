# Collections

Collections are the grouping mechanism for embeddings, documents, and metadata.

## Collection Basics

### Collection Properties

Each collection is characterized by the following properties:

- `name`: The name of the collection. The name can be changed as long as it is unique within the database (
  use `collection.modify(new_name="new_name")` to change the name of the collection
- `metadata`: A dictionary of metadata associated with the collection. The metadata is a dictionary of key-value pairs.
  Keys can be strings, values can be strings, integers, floats, or booleans. Metadata can be changed
  using `collection.modify(new_metadata={"key": "value"})` (Note: Metadata is always overwritten when modified)
- `embedding_function`: The embedding function used to embed documents in the collection.

Defaults:

- Embedding Function - by default if `embedding_function` parameter is not provided at `get()` or `create_collection()`
  or `get_or_create_collection()` time, Chroma uses `chromadb.utils.embedding_functions.DefaultEmbeddingFunction` which
  uses the `chromadb.utils.embedding_functions.DefaultEmbeddingFunction` to embed documents. The default embedding
  function uses [Onnx Runtime](https://onnxruntime.ai/)
  with [`all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) model.
- distance metric - by default Chroma use L2 (Euclidean Distance Squared) distance metric for newly created collection.
  You can change it at creation
  time using `hnsw:space` metadata key. Possible values are `l2`, `cosine`, and 'ip' (inner product)
- Batch size, defined by `hnsw:batch_size` metadata key. Default is 100. The batch size defines the size of the
  in-memory bruteforce index. Once the threshold is reached, vectors are added to the HNSW index and the bruteforce
  index is cleared. Greater values may improve ingest performance. When updating also consider changing sync threshold
- Sync threshold, defined by `hnsw:sync_threshold` metadata key. Default 1000. The sync threshold defines the limit at
  which the HNSW index is synced to disk. This limit only applies to newly added vectors.

!!! note "Keep in Mind"

    Collection distance metric cannot be changed after the collection is created. 
    To change the distance metric see #cloning-a-collection

!!! warn "Name Restrictions"

    Collection names in Chroma must adhere to the following restrictions:
  
    (1) contains 3-63 characters
    (2) starts and ends with an alphanumeric character
    (3) otherwise contains only alphanumeric characters, underscores or hyphens (-)
    (4) contains no two consecutive periods (..)
    (5) is not a valid IPv4 address

### Creating a collection

!!! tip "Official Docs"

    For more information on the `create_collection` or `get_or_create_collection` methods, see the [official ChromaDB documentation](https://docs.trychroma.com/reference/Client#get_or_create_collection).

Parameters:

| Name                 | Description                                                                 | Default Value                                                 | Type              |
|----------------------|-----------------------------------------------------------------------------|---------------------------------------------------------------|-------------------|
| `name`               | Name of the collection to create. Parameter is required                     | N/A                                                           | String            |
| `metadata`           | Metadata associated with the collection. This is an optional parameter      | `None`                                                        | Dictionary        |
| `embedding_function` | Embedding function to use for the collection. This is an optional parameter | `chromadb.utils.embedding_functions.DefaultEmbeddingFunction` | EmbeddingFunction |

```python

import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
col = client.create_collection("test")
```

Alternatively you can use the `get_or_create_collection` method to create a collection if it doesn't exist already.

```python
import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
col = client.get_or_create_collection("test", metadata={"key": "value"})
```

!!! warn "Metadata with `get_or_create_collection()`"

    If the collection exists and metadata is provided in the method it will attempt to overwrite the existing metadata.

### Deleting a collection


!!! tip "Official Docs"

    For more information on the `delete_collection` method, see the [official ChromaDB documentation](https://docs.trychroma.com/reference/Client#delete_collection).


Parameters:

| Name   | Description                                             | Default Value | Type   |
|--------|---------------------------------------------------------|---------------|--------|
| `name` | Name of the collection to delete. Parameter is required | N/A           | String |

```python
import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
client.delete_collection("test")
```

### Listing all collections

!!! tip "Official Docs"

    For more information on the `list_collections` method, see the [official ChromaDB documentation](https://docs.trychroma.com/reference/Client#list_collections).


Parameters:

| Name     | Description                                                                                                                                                                           | Default Value | Type             |
|----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|------------------|
| `offset` | The starting offset for listing collections. This is an optional parameter                                                                                                            | `None`        | Positive Integer |
| `limit`  | The number of collections to return. If the remaining collections from `offset` are fewer than this number then returned collection will also be fewer. This is an optional parameter | `None`        | Positive Integer |

```python

import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
collections = client.list_collections()
```

### Getting a collection

!!! tip "Official Docs"

    For more information on the `get_collection` method, see the [official ChromaDB documentation](https://docs.trychroma.com/reference/Client#get_collection).

Parameters:

| Name                 | Description                                                                 | Default Value                                                 | Type              |
|----------------------|-----------------------------------------------------------------------------|---------------------------------------------------------------|-------------------|
| `name`               | Name of the collection to get. Parameter is required                        | N/A                                                           | String            |
| `embedding_function` | Embedding function to use for the collection. This is an optional parameter | `chromadb.utils.embedding_functions.DefaultEmbeddingFunction` | EmbeddingFunction |

```python
import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
col = client.get_collection("test")
```

### Modifying a collection

!!! tip "Official Docs"

    For more information on the `modify` method, see the [official ChromaDB documentation](https://docs.trychroma.com/reference/Collection#modify).

!!! tip "Modify method on collection"

    As the reader will observe `modify` method is called on the collection and node on the client as the rest of the collection lifecycle methods.

!!! note "Metadata Overwrite"

    Metadata is always overwritten when modified. If you want to add a new key-value pair to the metadata, you must
    first get the existing metadata and then add the new key-value pair to it.

Parameters:

| Name                 | Description                                                                 | Default Value                                                 | Type              |
|----------------------|-----------------------------------------------------------------------------|---------------------------------------------------------------|-------------------|
| `new_name`           | The new name of the collection. Parameter is required                       | N/A                                                           | String            |
| `metadata`           | Metadata associated with the collection. This is an optional parameter      | `None`                                                        | Dictionary        |

Both collection properties (`name` and `metadata`) can be modified, separately ot together.

```python
import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
col = client.get_collection("test")
col.modify(name="test2", metadata={"key": "value"})
```

### Counting Collections

!!! tip "Official Docs"

    N/A

```python
import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
col = client.get_or_create_collection("test")  # create a new collection

client.count_collections()
```

## Iterating over a Collection

```python
import chromadb

client = chromadb.PersistentClient(path="my_local_data")  # or HttpClient()

collection = client.get_or_create_collection("local_collection")
collection.add(
    ids=[f"i" for i in range(1000)],
    documents=[f"document {i}" for i in range(1000)],
    metadatas=[{"doc_id": i} for i in range(1000)])
existing_count = collection.count()
batch_size = 10
for i in range(0, existing_count, batch_size):
    batch = collection.get(
        include=["metadatas", "documents", "embeddings"],
        limit=batch_size,
        offset=i)
    print(batch)  # do something with the batch
```

## Collection Utilities

### Copying Local Collection to Remote

The following example demonstrates how to copy a local collection to a remote ChromaDB server. (it also works in
reverse)

```python
import chromadb

client = chromadb.PersistentClient(path="my_local_data")
remote_client = chromadb.HttpClient()

collection = client.get_or_create_collection("local_collection")
collection.add(
    ids=["1", "2"],
    documents=["hello world", "hello ChromaDB"],
    metadatas=[{"a": 1}, {"b": 2}])
remote_collection = remote_client.get_or_create_collection("remote_collection",
                                                           metadata=collection.metadata)
existing_count = collection.count()
batch_size = 10
for i in range(0, existing_count, batch_size):
    batch = collection.get(
        include=["metadatas", "documents", "embeddings"],
        limit=batch_size,
        offset=i)
    remote_collection.add(
        ids=batch["ids"],
        documents=batch["documents"],
        metadatas=batch["metadatas"],
        embeddings=batch["embeddings"])
```

!!! note "Using ChromaDB Data Pipes"

    There is a more efficient way to copy data between local and remote collections using [ChromaDB Data Pipes](https://datapipes.chromadb.dev) package.

    ```bash
    pip install chromadb-data-pipes
    cdp export "file://path/to_local_data/local_collection" | \
    cdp import "http://remote_chromadb:port/remote_collection" --create
    ```

### Cloning a collection

Here are some reasons why you might want to clone a collection:

- Change distance function (via metadata - `hnsw:space`)
- Change HNSW hyper parameters (`hnsw:M`, `hnsw:construction_ef`, `hnsw:search_ef`)

```python
import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
col = client.get_or_create_collection("test")  # create a new collection with L2 (default)

col.add(ids=[f"{i}" for i in range(1000)], documents=[f"document {i}" for i in range(1000)])
newCol = client.get_or_create_collection("test1", metadata={
    "hnsw:space": "cosine"})  # let's change the distance function to cosine

existing_count = col.count()
batch_size = 10
for i in range(0, existing_count, batch_size):
    batch = col.get(include=["metadatas", "documents", "embeddings"], limit=batch_size, offset=i)
    newCol.add(ids=batch["ids"], documents=batch["documents"], metadatas=batch["metadatas"],
               embeddings=batch["embeddings"])

print(newCol.count())
print(newCol.get(offset=0, limit=10))  # get first 10 documents
```

#### Cloning a subset of a collection with query

The below example demonstrates how to select a slice of an existing collection by using `where` and `where_document`
query and creating a new collection with the selected slice.

!!! warn "Race Condition"

    The below example is not atomic and if data is changed between the initial selection query (`select_ids = col.get(...)`
    and the subsequent insertion query (`batch = col.get(...)`) the new collection may not contain the expected data.

```python
import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
col = client.get_or_create_collection("test")  # create a new collection with L2 (default)

col.add(ids=[f"{i}" for i in range(1000)], documents=[f"document {i}" for i in range(1000)])
newCol = client.get_or_create_collection("test1", metadata={
    "hnsw:space": "cosine", "hnsw:M": 32})  # let's change the distance function to cosine and M to 32
query_where = {"metadata_key": "value"}
query_where_document = {"$contains": "document"}
select_ids = col.get(where_document=query_where_document, where=query_where, include=[])  # get only IDs
batch_size = 10
for i in range(0, len(select_ids["ids"]), batch_size):
    batch = col.get(include=["metadatas", "documents", "embeddings"], limit=batch_size, offset=i, where=query_where,
                    where_document=query_where_document)
    newCol.add(ids=batch["ids"], documents=batch["documents"], metadatas=batch["metadatas"],
               embeddings=batch["embeddings"])

print(newCol.count())
print(newCol.get(offset=0, limit=10))  # get first 10 documents
```

### Updating Document/Record Metadata

In this example we loop through all documents of a collection and strip all metadata fields of leading and trailing
whitespace.
Change the `update_metadata` function to suit your needs.

```python
from chromadb import Settings
import chromadb

client = chromadb.PersistentClient(path="test", settings=Settings(allow_reset=True))
client.reset()  # reset the database so we can run this script multiple times
col = client.get_or_create_collection("test")
count = col.count()


def update_metadata(metadata: dict):
    return {k: v.strip() for k, v in metadata.items()}


for i in range(0, count, 10):
    batch = col.get(include=["metadatas"], limit=10, offset=i)
    col.update(ids=batch["ids"], metadatas=[update_metadata(metadata) for metadata in batch["metadatas"]])
```
