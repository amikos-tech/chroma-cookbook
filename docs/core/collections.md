# Collections

Collections are the grouping mechanism for embeddings, documents, and metadata.

## Collection Basics

### Collection Properties

Each collection is characterized by the following properties:

- `name`: The name of the collection. The name can be changed as long as it is unique within the database (
  use `collection.modify(name="new_name")` to change the name of the collection
- `metadata`: A dictionary of metadata associated with the collection. The metadata is a dictionary of key-value pairs.
  Keys can be strings, values can be strings, integers, floats, or booleans. Metadata can be changed
  using `collection.modify(metadata={"key": "value"})` (Note: Metadata is always overwritten when modified)
- `configuration`: A dictionary of HNSW index configuration options. Configuration is set at collection creation time via the `configuration` parameter. See the example below.
- `embedding_function`: The embedding function used to embed documents in the collection.

Defaults:

- Embedding Function - by default if `embedding_function` parameter is not provided at `create_collection()`
  or `get_or_create_collection()` time, Chroma uses `chromadb.utils.embedding_functions.DefaultEmbeddingFunction` to embed documents. The default embedding
  function uses [Onnx Runtime](https://onnxruntime.ai/)
  with [`all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) model.
- Distance metric - by default Chroma uses L2 (Euclidean Distance Squared) distance metric for newly created collections.
  You can change it at creation time using the `configuration` parameter:
  `configuration={"hnsw": {"space": "cosine"}}`. Possible values are `l2`, `cosine`, and `ip` (inner product). (Note: `cosine` value returns `cosine distance` rather than `cosine similarity`. I.e. values close to 0 means the embeddings are more similar.)
- Batch size, defined by `configuration={"hnsw": {"batch_size": 100}}`. Default is 100. The batch size defines the size of the
  in-memory bruteforce index. Once the threshold is reached, vectors are added to the HNSW index and the bruteforce
  index is cleared. Greater values may improve ingest performance. When updating also consider changing sync threshold.
- Sync threshold, defined by `configuration={"hnsw": {"sync_threshold": 1000}}`. Default is 1000. The sync threshold defines the limit at
  which the HNSW index is synced to disk. This limit only applies to newly added vectors.

!!! note "Keep in Mind"

    Collection distance metric cannot be changed after the collection is created.
    To change the distance metric see [Cloning a Collection](#cloning-a-collection).

!!! note "Embedding Function Persistence"

    Since Chroma v1.1.13, the embedding function configuration (EF) is persisted server-side. You no longer need to pass `embedding_function` when calling `get_collection` — Chroma will use the EF that was set at collection creation time.

!!! warn "Name Restrictions"

    Collection names in Chroma must adhere to the following restrictions:

    (1) contains 3-512 characters
    (2) starts and ends with a lowercase letter or a digit
    (3) can contain dots, dashes, and underscores in between
    (4) is not a valid IPv4 address

### Creating a collection

!!! tip "Official Docs"

    For more information on the `create_collection` or `get_or_create_collection` methods, see the [official ChromaDB documentation](https://docs.trychroma.com/reference/python/client#getorcreatecollection).

Parameters:

| Name                 | Description                                                                 | Default Value                                                 | Type              |
|----------------------|-----------------------------------------------------------------------------|---------------------------------------------------------------|-------------------|
| `name`               | Name of the collection to create. Parameter is required                     | N/A                                                           | String            |
| `metadata`           | Metadata associated with the collection. This is an optional parameter      | `None`                                                        | Dictionary        |
| `configuration`      | HNSW index configuration for the collection. This is an optional parameter  | `None`                                                        | Dictionary        |
| `embedding_function` | Embedding function to use for the collection. This is an optional parameter | `chromadb.utils.embedding_functions.DefaultEmbeddingFunction` | EmbeddingFunction |

=== "Python"

    ```python
    import chromadb

    client = chromadb.PersistentClient(path="test")  # or HttpClient()
    col = client.create_collection("test")
    ```

=== "TypeScript"

    ```typescript
    import { ChromaClient } from "chromadb";

    const client = new ChromaClient();
    const collection = await client.createCollection({ name: "test" });
    ```

=== "Go"

    ```go
    package main

    import (
        "context"
        chroma "github.com/amikos-tech/chroma-go"
    )

    func main() {
        ctx := context.Background()
        client, _ := chroma.NewHTTPClient(ctx, chroma.WithDefaultDatabase("default_database"), chroma.WithDefaultTenant("default_tenant"))
        col, _ := client.CreateCollection(ctx, "test", false)
    }
    ```

=== "Rust"

    ```rust
    use chromadb::v2::ChromaClient;

    #[tokio::main]
    async fn main() {
        let client = ChromaClient::new(Default::default()).await.unwrap();
        let collection = client.create_collection("test", None, true).await.unwrap();
    }
    ```

Alternatively you can use the `get_or_create_collection` method to create a collection if it doesn't exist already.

=== "Python"

    ```python
    import chromadb

    client = chromadb.PersistentClient(path="test")  # or HttpClient()
    col = client.get_or_create_collection("test", metadata={"key": "value"})
    ```

=== "TypeScript"

    ```typescript
    import { ChromaClient } from "chromadb";

    const client = new ChromaClient();
    const collection = await client.getOrCreateCollection({
        name: "test",
        metadata: { key: "value" },
    });
    ```

=== "Go"

    ```go
    col, _ := client.GetOrCreateCollection(ctx, "test", nil)
    ```

=== "Rust"

    ```rust
    let collection = client.get_or_create_collection("test", None, true).await.unwrap();
    ```

Creating a collection with custom HNSW configuration:

=== "Python"

    ```python
    import chromadb

    client = chromadb.PersistentClient(path="test")  # or HttpClient()
    col = client.create_collection(
        "test",
        configuration={
            "hnsw": {
                "space": "cosine",
                "ef_construction": 200,
                "max_neighbors": 32,
            }
        },
    )
    ```

=== "TypeScript"

    ```typescript
    import { ChromaClient } from "chromadb";

    const client = new ChromaClient();
    const collection = await client.createCollection({
        name: "test",
        configuration: {
            hnsw: {
                space: "cosine",
                efConstruction: 200,
                maxNeighbors: 32,
            },
        },
    });
    ```

!!! warn "Metadata with `get_or_create_collection()`"

    If the collection exists and metadata is provided in the method it will attempt to overwrite the existing metadata.

### Deleting a collection

!!! tip "Official Docs"

    For more information on the `delete_collection` method, see the [official ChromaDB documentation](https://docs.trychroma.com/reference/python/client#deletecollection).

!!! danger "Destructive Operation"

    Deleting a collection permanently removes all its data (embeddings, documents, and metadata). This action cannot be undone.

Parameters:

| Name   | Description                                             | Default Value | Type   |
|--------|---------------------------------------------------------|---------------|--------|
| `name` | Name of the collection to delete. Parameter is required | N/A           | String |

=== "Python"

    ```python
    import chromadb

    client = chromadb.PersistentClient(path="test")  # or HttpClient()
    client.delete_collection("test")
    ```

=== "TypeScript"

    ```typescript
    import { ChromaClient } from "chromadb";

    const client = new ChromaClient();
    await client.deleteCollection({ name: "test" });
    ```

=== "Go"

    ```go
    _, err := client.DeleteCollection(ctx, "test")
    ```

=== "Rust"

    ```rust
    client.delete_collection("test").await.unwrap();
    ```

### Listing all collections

!!! tip "Official Docs"

    For more information on the `list_collections` method, see the [official ChromaDB documentation](https://docs.trychroma.com/reference/python/client#listcollections).

The `list_collections` method returns a list of collection names. It supports pagination via `offset` and `limit` parameters.

Parameters:

| Name     | Description                                                                                                                                                                           | Default Value | Type             |
|----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------|------------------|
| `offset` | The starting offset for listing collections. This is an optional parameter                                                                                                            | `None`        | Positive Integer |
| `limit`  | The number of collections to return. If the remaining collections from `offset` are fewer than this number then returned collection will also be fewer. This is an optional parameter | `None`        | Positive Integer |

=== "Python"

    ```python
    import chromadb

    client = chromadb.PersistentClient(path="test")  # or HttpClient()
    collections = client.list_collections()  # returns list of collection names

    # with pagination
    collections = client.list_collections(limit=10, offset=0)
    ```

=== "TypeScript"

    ```typescript
    import { ChromaClient } from "chromadb";

    const client = new ChromaClient();
    const collections = await client.listCollections();

    // with pagination
    const page = await client.listCollections({ limit: 10, offset: 0 });
    ```

=== "Go"

    ```go
    collections, _ := client.ListCollections(ctx, nil, nil)

    // with pagination
    limit := int32(10)
    offset := int32(0)
    collections, _ = client.ListCollections(ctx, &limit, &offset)
    ```

=== "Rust"

    ```rust
    let collections = client.list_collections(None, None).await.unwrap();

    // with pagination
    let collections = client.list_collections(Some(10), Some(0)).await.unwrap();
    ```

### Getting a collection

!!! tip "Official Docs"

    For more information on the `get_collection` method, see the [official ChromaDB documentation](https://docs.trychroma.com/reference/python/client#getcollection).

!!! note "Embedding Function Persistence"

    Since Chroma v1.1.13, the embedding function is persisted server-side. You no longer need to pass `embedding_function` when calling `get_collection`. If you do pass one, it will override the persisted configuration for that client session.

Parameters:

| Name                 | Description                                                                                          | Default Value | Type              |
|----------------------|------------------------------------------------------------------------------------------------------|---------------|-------------------|
| `name`               | Name of the collection to get. Parameter is required                                                 | N/A           | String            |
| `embedding_function` | Embedding function override for the collection. Optional — uses the persisted EF if not provided     | `None`        | EmbeddingFunction |

=== "Python"

    ```python
    import chromadb

    client = chromadb.PersistentClient(path="test")  # or HttpClient()
    col = client.get_collection("test")
    ```

=== "TypeScript"

    ```typescript
    import { ChromaClient } from "chromadb";

    const client = new ChromaClient();
    const collection = await client.getCollection({ name: "test" });
    ```

=== "Go"

    ```go
    col, _ := client.GetCollection(ctx, "test", nil)
    ```

=== "Rust"

    ```rust
    let collection = client.get_collection("test").await.unwrap();
    ```

### Modifying a collection

!!! tip "Official Docs"

    For more information on the `modify` method, see the [official ChromaDB documentation](https://docs.trychroma.com/reference/python/collection#modify).

!!! tip "Modify method on collection"

    The `modify` method is called on the collection and not on the client, unlike the rest of the collection lifecycle methods.

!!! note "Metadata Overwrite"

    Metadata is always overwritten when modified. If you want to add a new key-value pair to the metadata, you must
    first get the existing metadata and then add the new key-value pair to it.

!!! warning "Changing HNSW parameters"

    HNSW configuration parameters (space, M, ef_construction, etc.) cannot be changed after the collection is created. To change these parameters, clone the collection — see [Cloning a Collection](#cloning-a-collection).

Parameters:

| Name       | Description                                                            | Default Value | Type       |
|------------|------------------------------------------------------------------------|---------------|------------|
| `name`     | The new name of the collection. Parameter is required                  | N/A           | String     |
| `metadata` | Metadata associated with the collection. This is an optional parameter | `None`        | Dictionary |

Both collection properties (`name` and `metadata`) can be modified, separately or together.

=== "Python"

    ```python
    import chromadb

    client = chromadb.PersistentClient(path="test")  # or HttpClient()
    col = client.get_collection("test")
    col.modify(name="test2", metadata={"key": "value"})
    ```

=== "TypeScript"

    ```typescript
    import { ChromaClient } from "chromadb";

    const client = new ChromaClient();
    const collection = await client.getCollection({ name: "test" });
    await collection.modify({ name: "test2", metadata: { key: "value" } });
    ```

### Counting Collections

Returns the number of collections for the currently configured tenant and database.

!!! tip "Official Docs"

    For more information on the `count_collections` method, see the [official ChromaDB documentation](https://docs.trychroma.com/reference/python/client#countcollections).

=== "Python"

    ```python
    import chromadb

    client = chromadb.PersistentClient(path="test")  # or HttpClient()
    col = client.get_or_create_collection("test")  # create a new collection

    collections_count = client.count_collections()  # int
    ```

=== "TypeScript"

    ```typescript
    import { ChromaClient } from "chromadb";

    const client = new ChromaClient();
    const count = await client.countCollections();
    ```

### Convenience Methods

The following methods are available on a collection instance:

=== "Python"

    ```python
    import chromadb

    client = chromadb.PersistentClient(path="test")  # or HttpClient()
    col = client.get_or_create_collection("test")
    col.add(ids=["1", "2"], documents=["hello world", "hello chroma"])

    # peek at the first N items in the collection (default 10)
    col.peek()
    col.peek(limit=5)

    # count the number of items in the collection
    col.count()
    ```

=== "TypeScript"

    ```typescript
    import { ChromaClient } from "chromadb";

    const client = new ChromaClient();
    const collection = await client.getOrCreateCollection({ name: "test" });
    await collection.add({
        ids: ["1", "2"],
        documents: ["hello world", "hello chroma"],
    });

    // peek at the first N items in the collection (default 10)
    await collection.peek();
    await collection.peek({ limit: 5 });

    // count the number of items in the collection
    await collection.count();
    ```

## Iterating over a Collection

```python
import chromadb

client = chromadb.PersistentClient(path="my_local_data")  # or HttpClient()

collection = client.get_or_create_collection("local_collection")
collection.add(
    ids=[f"{i}" for i in range(1000)],
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

### Copying Collections



=== "Local To Remote"

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

          Using [ChromaDB Data Pipes](https://datapipes.chromadb.dev) package you can achieve the same result.

          ```bash
          pip install chromadb-data-pipes
          cdp export "file://path/to_local_data/local_collection" | \
          cdp import "http://remote_chromadb:port/remote_collection" --create
          ```

=== "Local To Local"

    Following shows an example of how to copy a collection from one local persistent DB to another local persistent DB.

    ```python
    import chromadb

    local_client = chromadb.PersistentClient(path="source")
    remote_client = chromadb.PersistentClient(path="target")

    collection = local_client.get_or_create_collection("my_source_collection")
    collection.add(
        ids=["1", "2"],
        documents=["hello world", "hello ChromaDB"],
        metadatas=[{"a": 1}, {"b": 2}])
    remote_collection = remote_client.get_or_create_collection("my_target_collection",
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

          You can achieve the above with [ChromaDB Data Pipes](https://datapipes.chromadb.dev) package.

          ```bash
          pip install chromadb-data-pipes
          cdp export "file://source_persist_dir/target_collection" | \
          cdp import "file://target_persist_dir/target_collection" --create
          ```

### Cloning a collection

Here are some reasons why you might want to clone a collection:

- Change distance function (via `configuration` — `hnsw.space`)
- Change HNSW hyper parameters (`max_neighbors`, `ef_construction`, `search_ef`)

```python
import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
col = client.get_or_create_collection("test")  # create a new collection with L2 (default)

col.add(ids=[f"{i}" for i in range(1000)], documents=[f"document {i}" for i in range(1000)])
newCol = client.get_or_create_collection("test1", configuration={
    "hnsw": {"space": "cosine"}})  # change the distance function to cosine

existing_count = col.count()
batch_size = 10
for i in range(0, existing_count, batch_size):
    batch = col.get(include=["metadatas", "documents", "embeddings"], limit=batch_size, offset=i)
    newCol.add(ids=batch["ids"], documents=batch["documents"], metadatas=batch["metadatas"],
               embeddings=batch["embeddings"])

print(newCol.count())
print(newCol.get(offset=0, limit=10))  # get first 10 documents
```

#### Changing the embedding function

To change the embedding function of a collection, it must be cloned to a new collection with the desired embedding function.

```python
import os
import chromadb
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction, DefaultEmbeddingFunction

client = chromadb.PersistentClient(path="test")  # or HttpClient()
default_ef = DefaultEmbeddingFunction()
col = client.create_collection("default_ef_collection",embedding_function=default_ef)
openai_ef = OpenAIEmbeddingFunction(api_key=os.getenv("OPENAI_API_KEY"), model_name="text-embedding-3-small")
col.add(ids=[f"{i}" for i in range(1000)], documents=[f"document {i}" for i in range(1000)])
newCol = client.get_or_create_collection("openai_ef_collection", embedding_function=openai_ef)

existing_count = col.count()
batch_size = 10
for i in range(0, existing_count, batch_size):
    batch = col.get(include=["metadatas", "documents"], limit=batch_size, offset=i)
    newCol.add(ids=batch["ids"], documents=batch["documents"], metadatas=batch["metadatas"])
# get first 10 documents with their OpenAI embeddings
print(newCol.get(offset=0, limit=10,include=["metadatas", "documents", "embeddings"]))
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
newCol = client.get_or_create_collection("test1", configuration={
    "hnsw": {"space": "cosine", "max_neighbors": 32}})
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
import chromadb

client = chromadb.PersistentClient(path="test")
col = client.get_or_create_collection("test")
count = col.count()


def update_metadata(metadata: dict):
    return {k: v.strip() for k, v in metadata.items()}


for i in range(0, count, 10):
    batch = col.get(include=["metadatas"], limit=10, offset=i)
    col.update(ids=batch["ids"], metadatas=[update_metadata(metadata) for metadata in batch["metadatas"]])
```

## Tips and Tricks

### Getting IDs Only

The below example demonstrates how to get only the IDs of a collection. This is useful if you need to work with IDs
without the need to fetch any additional data. Chroma will accept and empty `include` array indicating that no other
data than the IDs is returned.

```python
import chromadb

client = chromadb.PersistentClient(path="test")
col = client.get_or_create_collection("my_collection")
ids_only_result = col.get(include=[])
print(ids_only_result['ids'])
```
