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

import chromadb
from chromadb.segment import VectorReader
from chromadb.types import SegmentScope


def delete_all_references(obj):
    referrers = gc.get_referrers(obj)
    for referrer in referrers:
        if isinstance(referrer, dict):
            keys = list(referrer.keys())
            for key in keys:
                if referrer[key] is obj:
                    del referrer[key]
        elif isinstance(referrer, list):
            while obj in referrer:
                referrer.remove(obj)
        elif isinstance(referrer, set):
            referrer.discard(obj)
        elif isinstance(referrer, tuple):
            # Tuples are immutable; cannot delete references from them
            pass


def unload_index(collection_name: str, chroma_client: chromadb.PersistentClient, m_collection: chromadb.Collection):
    """
    Unloads binary hnsw index from memory and removes both segments (binary and metadata) from the segment cache.
    """
    collection = chroma_client.get_collection(collection_name)
    collection_id = collection.id

    segment_manager = chroma_client._server._manager
    segment = segment_manager.get_segment(collection_id, VectorReader)

    segment.close_persistent_index()

    # Check and remove segments based on the segment scope
    for scope in [SegmentScope.VECTOR, SegmentScope.METADATA]:
        if scope in segment_manager.segment_cache:
            cache = segment_manager.segment_cache[scope].cache
            if collection_id in cache:
                del cache[collection_id]

    delete_all_references(collection)
    gc.collect()
    gc.collect()  # Call multiple times to ensure complete cleanup
```

!!! abstract "Example Contributed"

    The above example was enhanced and contributed by `Amir` (amdeilami) from our Discord comminity.
    We appreciate and encourage his work and contributions to the Chroma community.
