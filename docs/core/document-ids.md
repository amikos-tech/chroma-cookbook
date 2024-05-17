# Document IDs

Chroma is unopinionated about document IDs and delegates those decisions to the user. This frees users to build semantics around their IDs.

## Note on Compound IDs

While you can choose to use IDs that are composed of multiple sub-IDs (e.g. `user_id` + `document_id`), it is important to highlight that Chroma does not support querying by partial ID.

## Common Practices

### UUIDs

UUIDs are a common choice for document IDs. They are unique, and can be generated in a distributed fashion. They are also opaque, which means that they do not contain any information about the document itself. This can be a good thing, as it allows you to change the document without changing the ID.

```python
import uuid
import chromadb

my_documents = [
    "Hello, world!",
    "Hello, Chroma!"
]

client = chromadb.Client()

collection.add(ids=[uuid.uuid4() for _ in range(len(documents))], documents=my_documents)
```

#### Caveats

!!! tip "Predictable Ordering" 

    UUIDs especially v4 are not lexicographically sortable. In its current version (0.4.x-0.5.0) Chroma orders responses 
    of `get()` by the ID of the documents. Therefore, if you need predictable ordering, you may want to consider a different ID strategy.

!!! tip "Storage Overhead"

    UUIDs are 128 bits long, which can be a lot of overhead if you have a large number of documents. If you are concerned about storage overhead, you may want to consider a different ID strategy.

### Hashes

Hashes are another common choice for document IDs. They are unique, and can be generated in a distributed fashion. They are also opaque, which means that they do not contain any information about the document itself. This can be a good thing, as it allows you to change the document without changing the ID.

```python
import hashlib
import os
import chromadb

def generate_sha256_hash():
    # Generate a random number
    random_data = os.urandom(16)
    # Create a SHA256 hash object
    sha256_hash = hashlib.sha256()
    # Update the hash object with the random data
    sha256_hash.update(random_data)
    # Return the hexadecimal representation of the hash
    return sha256_hash.hexdigest()


my_documents = [
    "Hello, world!",
    "Hello, Chroma!"
]

client = chromadb.Client()

collection.add(ids=[generate_sha256_hash() for _ in range(len(documents))], documents=my_documents)
```

It is also possible to use the document as basis for the hash, the downside of that is that when the document changes and you have a semantic around the text as relating to the hash, you may need to update the hash.

```python
import hashlib
import chromadb

def generate_sha256_hash_from_text(text):
    # Create a SHA256 hash object
    sha256_hash = hashlib.sha256()
    # Update the hash object with the text encoded to bytes
    sha256_hash.update(text.encode('utf-8'))
    # Return the hexadecimal representation of the hash
    return sha256_hash.hexdigest()
my_documents = [
    "Hello, world!",
    "Hello, Chroma!"
]

client = chromadb.Client()

collection.add(ids=[generate_sha256_hash_from_text(documents[i]) for i in range(len(documents))], documents=my_documents)
```

## Semantic Strategies

In this section we'll explore a few different use cases for building semantics around document IDs.

- URL Slugs - if your docs are web pages with permalinks (e.g. blog posts), you can use the URL slug as the document ID.
- File Paths - if your docs are files on disk, you can use the file path as the document ID.
