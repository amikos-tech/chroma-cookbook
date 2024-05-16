# Chroma Configuration

!!! warn "Work in Progress"

    This page is a work in progress and may not be complete.

## Common Configurations Options

## Server Configuration

## Client Configuration

## HNSW Configuration

HNSW is the underlying library for Chroma vector indexing and search. Chroma exposes a number of parameters to configure
HNSW for your use case. All HNSW parameters are configured as metadata on the collection level.

| Parameter Name         | Description and Use                                                                                                                                                                                                                                                                              | Values                                                                              |   |
|------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|---|
| `hnsw:space`           | Controls the distance metric of the HNSW index. The space cannot be changed after index creation.                                                                                                                                                                                                | **Possible values**:<br/> - `l2`<br/> - `cosine`<br/> - `ip` <br/>**Default**: `l2` |   |
| `hnsw:construction_ef` | Controls the number of neighbours in the HNSW graph to explore when adding new vectors. The more neighbours HNSW explores the better and more exhaustive the results will be. Increasing the value will also increase memory consumption. This parameter cannot be changed after index creation. | **Possible values**: _Positive Integers_<br/>**Default**: `100`                     |   |
| `hnsw:M`               | Controls to how many neighbour nodes (M), a newly inserted vector. A higher value results in a mode densely connected graph. The impact on this is slower but more accurate searches with increased memory consumption. This parameter cannot be changed after index creation.                   | **Possible values**: _Positive Integers_<br/>**Default**: `16`                      |   |
| `hnsw:search_ef`       | Controls the number of neighbours in the HNSW graph to explore when searching. Increasing this requires more memory for the HNSW algo to explore the nodes during knn search. This parameter can be changed after index creation.                                                                | **Possible values**: _Positive Integers_<br/>**Default**: `10`                      |   |
| `hnsw:num_threads`     | Controls how many threads HNSW algo use. This parameter can be changed after index creation.                                                                                                                                                                                                     | **Possible values**: _Positive Integers_<br/>**Default**: `<number of CPU cores>`   |   |
| `hnsw:resize_factor`   | Controls the rate of growth of the graph (e.g. how many node capacity will be added) whenever the current graph capacity is reached. This parameter can be changed after index creation.                                                                                                         | **Possible values**: _Positive Floating Point_<br/>**Default**: `1.2`               |   |
| `hnsw:batch_size`      | Controls the size of the Bruteforce (in-memory) index. Once this threshold is crossed vectors from BF gets transferred to HNSW index. This value can be changed after index creation. The value must be less than `hnsw:sync_threshold`.                                                         | **Possible values**: _Positive Integers_<br/>**Default**: `100`                     |   |
| `hnsw:sync_threshold`  | Controls the threshold when using HNSW index is written to disk.                                                                                                                                                                                                                                 | **Possible values**: _Positive Integers_<br/>**Default**: `1000`                    |   |

!!! tip "Changing HNSW parameters"

    Some HNSW parameters cannot be changed after index creation via the standard method shown below. 
    If you which to change these parameters, you will need to clone the collection see an example [here](collections.md#cloning-a-collection).
### Example

Configuring HNSW parameters at creation time

```python
import chromadb

client = chromadb.HttpClient()  # Adjust as per your client
res = client.create_collection("my_collection", metadata={
    "hnsw:space": "cosine",
    "hnsw:construction_ef": 100,
    "hnsw:M": 16,
    "hnsw:search_ef": 10,
    "hnsw:num_threads": 4,
    "hnsw:resize_factor": 1.2,
    "hnsw:batch_size": 100,
    "hnsw:sync_threshold": 1000,
})
```

Updating HNSW parameters after creation

```python
import chromadb

client = chromadb.HttpClient()  # Adjust as per your client
res = client.get_or_create_collection("my_collection", metadata={
    "hnsw:search_ef": 200,
    "hnsw:num_threads": 8,
    "hnsw:resize_factor": 2,
    "hnsw:batch_size": 10000,
    "hnsw:sync_threshold": 1000000,
})
```

!!! tip "get_or_create_collection overrides"

    When using `get_or_create_collection()` with `metadata` parameter, existing metadata will be overridden with the new values.