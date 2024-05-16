# Configuration

!!! warn "Work in Progress"

    This page is a work in progress and may not be complete.

## Common Configurations Options

## Server Configuration

### Authentication

### Authorization

## Client Configuration

### Authentication

## HNSW Configuration

HNSW is the underlying library for Chroma vector indexing and search. Chroma exposes a number of parameters to configure
HNSW for your use case. All HNSW parameters are configured as metadata on the collection level.

!!! tip "Changing HNSW parameters"

    Some HNSW parameters cannot be changed after index creation via the standard method shown below. 
    If you which to change these parameters, you will need to clone the collection see an example [here](collections.md#cloning-a-collection).

### `hnsw:space`

**Description**: Controls the distance metric of the HNSW index. The space cannot be changed after index creation.

**Default**: `l2`

**Constraints**:

- Possible values: `l2`, `cosine`, `ip`
- Parameter **_cannot_** be changed after index creation.

### `hnsw:construction_ef`

**Description**: Controls the number of neighbours in the HNSW graph to explore when adding new vectors. The more
neighbours HNSW
explores the better and more exhaustive the results will be. Increasing the value will also increase memory consumption.

**Default**: `100`

**Constraints**:

- Values must be positive integers.
- Parameter **_cannot_** be changed after index creation.

### `hnsw:M`

**Description**: Controls the maximum number of neighbour connections (M), a newly inserted vector. A higher value
results in a mode densely connected graph. The impact on this is slower but more accurate searches with increased memory
consumption.

**Default**: `16`

**Constraints**:

- Values must be positive integers.
- Parameter **_cannot_** be changed after index creation.

### `hnsw:search_ef`

**Description**: Controls the number of neighbours in the HNSW graph to explore when searching. Increasing this requires
more memory for the HNSW algo to explore the nodes during knn search.

**Default**: `10`

**Constraints**:

- Values must be positive integers.
- Parameter **_can_** be changed after index creation.

### `hnsw:num_threads`

**Description**: Controls how many threads HNSW algo use.

**Default**: `<number of CPU cores>`

**Constraints**:

- Values must be positive integers.
- Parameter **_can_** be changed after index creation.

### `hnsw:resize_factor`

**Description**: Controls the rate of growth of the graph (e.g. how many node capacity will be added) whenever the
current graph capacity is reached.

**Default**: `1.2`

**Constraints**:

- Values must be positive floating point numbers.
- Parameter **_can_** be changed after index creation.

### `hnsw:batch_size`

**Description**: Controls the size of the Bruteforce (in-memory) index. Once this threshold is crossed vectors from BF
gets transferred to HNSW index. This value can be changed after index creation. The value must be less than
`hnsw:sync_threshold`.

**Default**: `100`

**Constraints**:

- Values must be positive integers.
- Parameter **_can_** be changed after index creation.

### `hnsw:sync_threshold`

**Description**: Controls the threshold when using HNSW index is written to disk.

**Default**: `1000`

**Constraints**:

- Values must be positive integers.
- Parameter **_can_** be changed after index creation.

### Examples

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