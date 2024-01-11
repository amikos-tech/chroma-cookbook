# Chroma Clients

## Persistent Client

To create your a local persistent client use the `PersistentClient` class. This client will store all data locally in a
directory on your machine at the path you specify.

```python
import chromadb

client = chromadb.PersistentClient(path="test")
```

### Uses of Persistent Client

The persistent client is useful for:

- **Local development**: You can use the persistent client to develop locally and test out ChromaDB.
- **Embedded applications**: You can use the persistent client to embed ChromaDB in your application. For example, if
  you are building a web application, you can use the persistent client to store data locally on the server.