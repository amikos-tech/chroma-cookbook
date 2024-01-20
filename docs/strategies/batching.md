# Batching

It is often that you may need to ingest a large number of documents into Chroma. The problem you may face is related to
the underlying SQLite version of the machine running Chroma which imposes a maximum number of statements and parameters
which Chroma translates into a batchable record size, exposed via the `max_batch_size` parameter of the `ChromaClient`
class.

```python
import chromadb

client = chromadb.PersistentClient(path="test")
print("Number of documents that can be inserted at once: ",client.max_batch_size)
```


## Creating Batches

Due to consistency and data integrity reasons, Chroma does not offer, yet, out-of-the-box batching support. The below code snippet
shows how to create batches of documents and ingest them into Chroma.

```python
import chromadb
from chromadb.utils.batch_utils import create_batches
import uuid

client = chromadb.PersistentClient(path="test-large-batch")
large_batch = [(f"{uuid.uuid4()}", f"document {i}", [0.1] * 1536) for i in range(100000)]
ids, documents, embeddings = zip(*large_batch)
batches = create_batches(api=client,ids=list(ids), documents=list(documents), embeddings=list(embeddings))
collection = client.get_or_create_collection("test")
for batch in batches:
    print(f"Adding batch of size {len(batch[0])}")
    collection.add(ids=batch[0],
                   documents=batch[3],
                   embeddings=batch[1],
                   metadatas=batch[2])
```
