# Keyword Search

Chroma uses SQLite for storing metadata and documents. Additionally documents are indexed using [SQLite FTS5](https://www.sqlite.org/fts5.html) for fast text search.

```python
import chromadb
from chromadb.config import Settings

client = chromadb.PersistentClient(path="test", settings=Settings(allow_reset=True))

client.reset()
col = client.get_or_create_collection("test")

col.upsert(ids=["1", "2", "3"], documents=["He is a technology freak and he loves AI topics", "AI technology are advancing at a fast pace", "Innovation in LLMs is a hot topic"],metadatas=[{"author": "John Doe"}, {"author": "Jane Doe"}, {"author": "John Doe"}])
col.query(query_texts=["technology"], where_document={"$or":[{"$contains":"technology"}, {"$contains":"freak"}]})
```

The above should return:

```python
{'ids': [['2', '1']],
 'distances': [[1.052205477809135, 1.3074231535113972]],
 'metadatas': [[{'author': 'Jane Doe'}, {'author': 'John Doe'}]],
 'embeddings': None,
 'documents': [['AI technology are advancing at a fast pace',
   'He is a technology freak and he loves AI topics']],
 'uris': None,
 'data': None}
```
