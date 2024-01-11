# Collections

Collections are the grouping mechanism for embeddings, documents, and metadata.

## Collection Basics

### Collection Properties

Each collection is characterized by the following properties:

- `name`: The name of the collection
- `metadata`: A dictionary of metadata associated with the collection. The metadata is a dictionary of key-value pairs.

### Creating a collection

```python

import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
col = client.create_collection("test")
```

Alternatively you can use the `get_or_create_collection` method to create a collection if it doesn't exist already.

```python
import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
col = client.get_or_create_collection("test")
```

### Deleting a collection

```python
import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
client.delete_collection("test")
```

### Listing all collections

```python

import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
collections = client.list_collections()
```

### Getting a collection

```python
import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
col = client.get_collection("test")
```

### Modifying a collection

Both collection properties (`name` and `metadata`) can be modified.

```python
import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
col = client.get_collection("test")
col.modify(name="test2", metadata={"key": "value"})
```

!!! note "Metadata"

    Metadata is always overwritten when modified. If you want to add a new key-value pair to the metadata, you must
    first get the existing metadata and then add the new key-value pair to it.


## Collection Utilities

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
