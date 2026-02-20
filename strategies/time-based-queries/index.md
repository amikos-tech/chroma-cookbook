# Time-based Queries

## Filtering Documents By Timestamps

In the example below, we create a collection with 100 documents, each with a random timestamp in the last two weeks. We then query the collection for documents that were created in the last week.

The example demonstrates how Chroma metadata can be leveraged to filter documents based on how recently they were added or updated.

```python
import uuid
import chromadb

import datetime
import random

now = datetime.datetime.now()
two_weeks_ago = now - datetime.timedelta(days=14)

dates = [
    two_weeks_ago + datetime.timedelta(days=random.randint(0, 14))
    for _ in range(100)
]
dates = [int(date.timestamp()) for date in dates]

# convert epoch seconds to iso format

def iso_date(epoch_seconds): return datetime.datetime.fromtimestamp(
    epoch_seconds).isoformat()

client = chromadb.EphemeralClient()

col = client.get_or_create_collection("test")

col.add(ids=[f"{uuid.uuid4()}" for _ in range(100)], documents=[
    f"document {i}" for i in range(100)], metadatas=[{"date": date} for date in dates])

res = col.get(where={"date": {"$gt": (now - datetime.timedelta(days=7)).timestamp()}})

for i in res['metadatas']:
    print(iso_date(i['date']))
```

Ref: https://gist.github.com/tazarov/3c9301d22ab863dca0b6fb1e5e3511b1
