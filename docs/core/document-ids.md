# Document IDs

Chroma is unopinionated about document IDs and delegates those decisions to the user. This frees users to build
semantics around their IDs.

## Note on Compound IDs

While you can choose to use IDs that are composed of multiple sub-IDs (e.g. `user_id` + `document_id`), it is important
to highlight that Chroma does not support querying by partial ID.

## Common Practices

??? tip "chromadbx"

    We provide a convinient wrapper for in the form of `chromadbx` package that provides ID generators for UUIDs, ULIDs, 
    NonoIDs, and Hashes, among others functions. 
    You can install it with `pip install chromadbx`.

### UUIDs

UUIDs are a common choice for document IDs. They are unique, and can be generated in a distributed fashion. They are
also opaque, which means that they do not contain any information about the document itself. This can be a good thing,
as it allows you to change the document without changing the ID.

=== "chromadbx"

    ```python
    import chromadb
    from chromadbx import UUIDGenerator
    
    client = chromadb.Client()
    col = client.get_or_create_collection("test")
    my_docs = [f"Document {_}" for _ in range(10)]
    col.add(ids=UUIDGenerator(len(my_docs)), documents=my_docs)
    ```

=== "Python"

    ```python
    import uuid
    import chromadb
    
    my_documents = [
        "Hello, world!",
        "Hello, Chroma!"
    ]
    
    client = chromadb.Client()
    collection = client.get_or_create_collection("collection")
    collection.add(ids=[f"{uuid.uuid4()}" for _ in range(len(my_documents))], documents=my_documents)
    ```

#### Caveats

!!! tip "Predictable Ordering"

    UUIDs especially v4 are not lexicographically sortable. In its current version (0.4.x-0.5.0) Chroma orders responses 
    of `get()` by the ID of the documents. Therefore, if you need predictable ordering, you may want to consider a different ID strategy.

!!! tip "Storage and Performance Overhead"

    Chroma stores Document IDs as strings and UUIDs are 36 characters long, which can be a lot of overhead if you have a 
    large number of documents. If you are concerned 
    about storage overhead, you may want to consider a different ID strategy.
    Additionally Chroma uses the document IDs when sorting results which also incurs a performance hit.

### ULIDs

ULIDs are a variant of UUIDs that are lexicographically sortable. They are also 128 bits long, like UUIDs, but they are
encoded in a way that makes them sortable. This can be useful if you need predictable ordering of your documents.

ULIDs are also shorter than UUIDs, which can save you some storage space. They are also opaque, like UUIDs, which means
that they do not contain any information about the document itself.

Install the `ulid-py` package to generate ULIDs.

```bash
pip install ulid-py
```

=== "chromadbx"

    ```python
    import chromadb
    from chromadbx import ULIDGenerator
    import ulid
    client = chromadb.Client()
    col = client.get_or_create_collection("test")
    my_docs = [f"Document {_}" for _ in range(10)]
    col.add(ids=ULIDGenerator(len(my_docs)), documents=my_docs)
    ```

=== "Python"
    
    ```python
    from ulid import ULID
    import chromadb
    
    my_documents = [
        "Hello, world!",
        "Hello, Chroma!"
    ]
    _ulid = ULID()
    
    client = chromadb.Client()
    
    collection = client.get_or_create_collection("name")
    
    collection.add(ids=[f"{_ulid.generate()}" for _ in range(len(my_documents))], documents=my_documents)
    ```

### NanoIDs

NanoIDs provide a way to generate unique IDs that are shorter than UUIDs. They are not lexically sortable, but they are
unique and can be generated in a distributed fashion. They are also opaque, with low collision rates - (collision
probability calculator)[https://zelark.github.io/nano-id-cc/]

=== "chromadbx"
    
    ```python
    import chromadb
    from chromadbx import NanoIDGenerator
    client = chromadb.Client()
    col = client.get_or_create_collection("test")
    my_docs = [f"Document {_}" for _ in range(10)]
    col.add(ids=NanoIDGenerator(len(my_docs)), documents=my_docs)
    ```

=== "Python"

    ```python
    from nanoid import generate
    import chromadb
    client = chromadb.Client()
    col = client.get_or_create_collection("test")
    my_docs = [f"Document {_}" for _ in range(10)]
    col.add(ids=[f"{generate()}" for _ in range(my_docs)], documents=my_docs)
    ```

### Hashes

Hashes are another common choice for document IDs. They are unique, and can be generated in a distributed fashion. They
are also opaque, which means that they do not contain any information about the document itself. This can be a good
thing, as it allows you to change the document without changing the ID.

=== "chromadbx"

    **Random SHA256:**
    
    ```python
    import chromadb
    from chromadbx import RandomSHA256Generator
    client = chromadb.Client()
    col = client.get_or_create_collection("test")
    my_docs = [f"Document {_}" for _ in range(10)]
    col.add(ids=RandomSHA256Generator(len(my_docs)), documents=my_docs)
    ```
    
    **Document-based SHA256:**
    
    ```python
    import chromadb
    from chromadbx import DocumentSHA256Generator
    client = chromadb.Client()
    col = client.get_or_create_collection("test")
    my_docs = [f"Document {_}" for _ in range(10)]
    col.add(ids=DocumentSHA256Generator(documents=my_docs), documents=my_docs)
    ```

=== "Python"

    **Random SHA256:**
    
    ```python
    import hashlib
    import os
    import chromadb
    
    
    def generate_sha256_hash() -> str:
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
    collection = client.get_or_create_collection("collection")
    collection.add(ids=[generate_sha256_hash() for _ in range(len(my_documents))], documents=my_documents)
    ```

    **Document-based SHA256:**

    It is also possible to use the document as basis for the hash, the downside of that is that when the document changes,
    and you have a semantic around the text as relating to the hash, you may need to update the hash.
    
    ```python
    import hashlib
    import chromadb
    
    
    def generate_sha256_hash_from_text(text) -> str:
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
    collection = client.get_or_create_collection("collection")
    collection.add(ids=[generate_sha256_hash_from_text(my_documents[i]) for i in range(len(my_documents))],
                   documents=my_documents)
    ```

## Semantic Strategies

In this section we'll explore a few different use cases for building semantics around document IDs.

- URL Slugs - if your docs are web pages with permalinks (e.g. blog posts), you can use the URL slug as the document ID.
- File Paths - if your docs are files on disk, you can use the file path as the document ID.
