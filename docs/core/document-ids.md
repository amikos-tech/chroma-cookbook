# Document IDs

Chroma is unopinionated about document IDs and delegates those decisions to the user. This frees users to build semantics around their IDs.

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

### Hashes

Hashes are another common choice for document IDs. They are unique, and can be generated in a distributed fashion. They are also opaque, which means that they do not contain any information about the document itself. This can be a good thing, as it allows you to change the document without changing the ID.

## Semantic Strategies

In this section we'll explore a few different use cases for building semantics around document IDs.

- URL Slugs - if your docs are web pages with permalinks (e.g. blog posts), you can use the URL slug as the document ID.
- File Paths - if your docs are files on disk, you can use the file path as the document ID.