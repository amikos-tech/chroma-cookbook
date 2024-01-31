# Memory Management

## PersistentClient

> Note: The below code snippets assume you are working with a `PersistentClient`

At the time of writing (Chroma v0.4.22), Chroma does not allow you to manually unloading of collections from memory.

Here we provide a simple utility function to help users unload collections from memory.

> Note: The function relies on Chroma internal APIs which may change. While we try to keep this documentation
> up-to-date, there may be versions of Chroma for which the below code won't work.


```python
import chromadb
from chromadb.segment import VectorReader
from chromadb.types import SegmentScope


def unload_index(collection_name:str, chroma_client:chromadb.PersistentClient):
    """
    Unloads binary hnsw index from memory and removes both segments (binary and metadata) from the segment cache.
    """
    collection = chroma_client.get_collection(collection_name)
    segment_manager = chroma_client._server._manager
    segment = segment_manager.get_segment(collection.id, VectorReader)
    segment.close_persistent_index()
    if collection.id in segment_manager._segment_cache:
        for scope in [SegmentScope.VECTOR, SegmentScope.METADATA]:
            if scope in segment_manager._segment_cache[collection.id]:
                del segment_manager._segment_cache[collection.id][segment["scope"]]
        del segment_manager._segment_cache[collection.id]
```

