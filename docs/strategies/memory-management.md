# Memory Management

## PersistentClient or EphemeralClient

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
    # Debug print the entire cache to understand its structure
    for key, value in segment_manager.segment_cache.items():
        print(f"Cache Key: {key}, Cache Value: {value}")

    # Check and remove segments based on the segment scope
    for scope in [SegmentScope.VECTOR, SegmentScope.METADATA]:
        if scope in segment_manager.segment_cache:
            cache = segment_manager.segment_cache[scope].cache
            if collection_id in cache:
                print(f"Removing collection ID {collection_id} from scope {scope} in segment cache")
                del cache[collection_id]

    delete_all_references(collection)
    gc.collect()
    gc.collect()  # Call multiple times to ensure complete cleanup
```

!!! abstract "Example Contributed"

    The above example was enhanced and contributed by `Amir` (amdeilami) from our Discord comminity.
    We appreciate and encourage his work and contributions to the Chroma community.
