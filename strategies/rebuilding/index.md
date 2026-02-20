# Rebuilding Chroma DB

## Rebuilding a Collection

Here are several reasons you might want to rebuild a collection:

- Your metadata or binary index is corrupted or even deleted
- Optimize performance of HNSW index after a large number of updates

WAL Consistency and Backups

Before you proceed, make sure to backup your data. Secondly make sure that your WAL contains all the data to allow the proper rebuilding of the collection. For instance, after v0.4.22 you should not have run optimizations or WAL cleanup.

IMPORTANT

Only do this on a stopped Chroma instance.

Find the UUID of the target binary index directory to remove. Typically, the binary index directory is located in the persistent directory and is named after the collection vector segment (in `segments` table). You can find the UUID by running the following SQL query:

```bash
sqlite3 /path/to/db/chroma.sqlite3 "select s.id, c.name from segments s join collections c on  s.collection=c.id where s.scope='VECTOR';"
```

The above should print UUID dir and collection names.

Once you remove/rename the UUID dir, restart Chroma and query your collection like so:

```python
import chromadb
client = chromadb.HttpClient() # Adjust as per your client
res = client.get_collection("my_collection").get(limit=1,include=['embeddings'])
```

Chroma will recreate your collection from the WAL.

Rebuilding the collection

Depending on how large your collection is, this process can take a while.
