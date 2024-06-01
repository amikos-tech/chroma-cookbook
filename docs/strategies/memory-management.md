# Memory Management

This section provided additional info and strategies how to manage memory in Chroma.

## LRU Cache Strategy

Out of the box Chroma offers an LRU cache strategy which unloads segments (collections) that are not used while trying
to abide to the configured memory usage limits.

To enable the LRU cache the following two settings parameters or environment variables need to be set:

=== "Python"

    ```python
    from chromadb.config import Settings

    settings = Settings(
        chroma_segment_cache_policy="LRU",
        chroma_memory_limit_bytes=10000000000  # ~10GB
    )
    ```

=== "Environment Variables"

    ```bash
    export CHROMA_SEGMENT_CACHE_POLICY=LRU
    export CHROMA_MEMORY_LIMIT_BYTES=10000000000  # ~10GB
    ```


## Manual/Custom Collection Unloading

!!! tip "Local Clients"

    The below code snippets assume you are working with a `PersistentClient` or an `EphemeralClient` instance.

At the time of writing (Chroma v0.4.22), Chroma does not allow you to manually unloading of collections from memory.

Here we provide a simple utility function to help users unload collections from memory.

!!! warn "Internal APIs"

    The below code relies on internal APIs and may change in future versions of Chroma. 
    The function relies on Chroma internal APIs which may change.
    The below snippet has been tested with Chroma `0.4.24+`.

```python
import gc
import os

import chromadb
import psutil
from chromadb.types import SegmentScope


def bytes_to_gb(bytes_value):
    return bytes_value / (1024 ** 3)


def get_process_info():
    pid = os.getpid()
    p = psutil.Process(pid)
    with p.oneshot():
        mem_info = p.memory_info()
        # disk_io = p.io_counters()
    return {
        "memory_usage": bytes_to_gb(mem_info.rss),
    }


def unload_index(collection_name: str, chroma_client: chromadb.PersistentClient):
    """
    Unloads binary hnsw index from memory and removes both segments (binary and metadata) from the segment cache.
    """
    collection = chroma_client.get_collection(collection_name)
    collection_id = collection.id
    segment_manager = chroma_client._server._manager
    for scope in [SegmentScope.VECTOR, SegmentScope.METADATA]:
        if scope in segment_manager.segment_cache:
            cache = segment_manager.segment_cache[scope].cache
            if collection_id in cache:
                segment_manager.callback_cache_evict(cache[collection_id])
    gc.collect()
```

!!! abstract "Example Contributed"

    The above example was enhanced and contributed by `Amir` (amdeilami) from our Discord comminity.
    We appreciate and encourage his work and contributions to the Chroma community.


??? example "Usage Example"

    ```python
    import chromadb
    
    
    client = chromadb.PersistentClient(path="testds-1M/chroma-data")
    col=client.get_collection("test")
    print(col.count())
    col.get(limit=1,include=["embeddings"]) # force load the collection into memory
    
    unload_index("test", client)
    ```
