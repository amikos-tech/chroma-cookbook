# Configuration

!!! warn "Work in Progress"

    This page is a work in progress and may not be complete.

## Common Configurations Options

## Server Configuration

### Core

#### `IS_PERSISTENT`

Defines whether Chroma should persist data or not.

Possible values:

- `TRUE`
- `FALSE`

Default: `FALSE`


**How to use**:

=== "CLI"

    ```bash
    export IS_PERSISTENT=TRUE
    chroma run --path ./chroma
    ```

=== "Python"

    ```python
    from chromadb.config import Settings
    settings = Settings(is_persistent=True)
    # run the server with the settings
    ```

=== "Docker"

    ```bash
    docker run -d --rm --name chromadb -v ./chroma:/chroma/chroma -e IS_PERSISTENT=TRUE chromadb/chroma:0.6.3
    ```



#### `PERSIST_DIRECTORY`

Defines the directory where Chroma should persist data. This can be relative or absolute path. The directory must be
writeable to Chroma process.

Default: `./chroma`

#### `ALLOW_RESET`

Defines whether Chroma should allow resetting the index (delete all data).

Possible values:

- `TRUE`
- `FALSE`

Default: `FALSE`

#### `CHROMA_MEMORY_LIMIT_BYTES`

#### `CHROMA_SEGMENT_CACHE_POLICY`

### Telemetry and Observability

In the current Chroma version (as of time or writing `0.6.3`) the only type of telemetry supported are traces.

The following configuration options allow you to configure the tracing service that accepts OpenTelemetry traces via the OLTP GRPC endpoint.

In addition to traces Chroma also performs anonymized product telemetry. The product telemetry is enabled by default.

#### `CHROMA_OTEL_COLLECTION_ENDPOINT`

Defines the endpoint of the tracing service that accepts OpenTelemetry traces via the OLTP GRPC endpoint.

Value type: `Valid URL`

Default: None

**Example**:

```bash
export CHROMA_OTEL_COLLECTION_ENDPOINT=http://localhost:4317
```


#### `CHROMA_OTEL_SERVICE_NAME`

Defines the name of the service that will be used in the tracing service.

Default: `chroma`

**Example**:

```bash
export CHROMA_OTEL_SERVICE_NAME=chroma-dev
```

#### `CHROMA_OTEL_COLLECTION_HEADERS`

Defines the headers that will be sent with each trace/span.

Default: None

**Example**:

```bash
export CHROMA_OTEL_COLLECTION_HEADERS='{"X-API-KEY":"1234567890"}'
```

#### `CHROMA_OTEL_GRANULARITY`

Defines the granularity of the traces.

Possible values:

- `none` - No spans are emitted.
- `operation` - Spans are emitted for each operation.
- `operation_and_segment` - Spans are emitted for almost all method calls.
- `all` - Spans are emitted for almost all method calls.

Default: `none`

**Example**:

```bash
export CHROMA_OTEL_GRANULARITY=all
```

#### `CHROMA_PRODUCT_TELEMETRY_IMPL`

!!! warning "Do not change"

    Do not change the default implementation as it may impact Chroma stability, instead use the `ANONYMIZED_TELEMETRY` configuration.

Defines the implementation of the product telemetry.

Default: `chromadb.telemetry.product.posthog.Posthog`


#### `CHROMA_TELEMETRY_IMPL`

This is identical to `CHROMA_PRODUCT_TELEMETRY_IMPL` but for the anonymized telemetry but is kept for backwards compatibility.

#### `ANONYMIZED_TELEMETRY`

Enables or disables anonymized product telemetry.

Possible values:

- `TRUE` - Enables anonymized telemetry.
- `FALSE` - Disables anonymized telemetry.

Default: `TRUE` (enabled)

Read more about how Chroma uses telemetry [here](https://docs.trychroma.com/telemetry).


**Example**:

```bash
export ANONYMIZED_TELEMETRY=FALSE
```

### Maintenance

#### `MIGRATIONS`

Defines how schema migrations are handled in Chroma.

Possible values:

- `none` - No migrations are applied.
- `validate` - Existing schema is validated.
- `apply` - Migrations are applied.

Default: `apply`

#### `MIGRATIONS_HASH_ALGORITHM`

Defines the algorithm used to hash the migrations. This configuration was introduces as some organizations have strict policies around use of cryptographic algorithms, considering the default `md5` being a weak hashing algorithm.

Possible values:

- `sha256` - Uses SHA-256 to hash the migrations.
- `md5` - Uses MD5 to hash the migrations.

Default: `md5`

**Example**:

```bash
export MIGRATIONS_HASH_ALGORITHM=sha256
```

### Operations and Distributed

#### `CHROMA_SYSDB_IMPL`

#### `CHROMA_PRODUCER_IMPL`

#### `CHROMA_CONSUMER_IMPL`

#### `CHROMA_SEGMENT_MANAGER_IMPL`

#### `CHROMA_SEGMENT_DIRECTORY_IMPL`

#### `CHROMA_MEMBERLIST_PROVIDER_IMPL`

#### `WORKER_MEMBERLIST_NAME`

#### `CHROMA_COORDINATOR_HOST`

#### `CHROMA_SERVER_GRPC_PORT`

#### `CHROMA_LOGSERVICE_HOST`

#### `CHROMA_LOGSERVICE_PORT`

#### `CHROMA_QUOTA_PROVIDER_IMPL`

#### `CHROMA_RATE_LIMITING_PROVIDER_IMPL`

### Authentication

#### `CHROMA_AUTH_TOKEN_TRANSPORT_HEADER`

#### `CHROMA_CLIENT_AUTH_PROVIDER`

#### `CHROMA_CLIENT_AUTH_CREDENTIALS`

#### `CHROMA_SERVER_AUTH_IGNORE_PATHS`

#### `CHROMA_OVERWRITE_SINGLETON_TENANT_DATABASE_ACCESS_FROM_AUTH`

#### `CHROMA_SERVER_AUTHN_PROVIDER`

#### `CHROMA_SERVER_AUTHN_CREDENTIALS`

#### `CHROMA_SERVER_AUTHN_CREDENTIALS_FILE`

### Authorization

#### `CHROMA_SERVER_AUTHZ_PROVIDER`

#### `CHROMA_SERVER_AUTHZ_CONFIG`

#### `CHROMA_SERVER_AUTHZ_CONFIG_FILE`

## Client Configuration

### Authentication

## HNSW Configuration

HNSW is the underlying library for Chroma vector indexing and search. Chroma exposes a number of parameters to configure
HNSW for your use case. All HNSW parameters are configured as metadata for a collection.

!!! tip "Changing HNSW parameters"

    Some HNSW parameters cannot be changed after index creation via the standard method shown below. 
    If you which to change these parameters, you will need to clone the collection see an example [here](collections.md#cloning-a-collection).

### `hnsw:space`

**Description**: Controls the distance metric of the HNSW index. The space cannot be changed after index creation.

**Default**: `l2`

**Constraints**:

- Possible values: `l2`, `cosine`, `ip`
- Parameter **_cannot_** be changed after index creation.

**Example**:

```python
res = client.create_collection("my_collection", metadata={ "hnsw:space": "cosine"})
```

### `hnsw:construction_ef`

**Description**: Controls the number of neighbours in the HNSW graph to explore when adding new vectors. The more
neighbours HNSW
explores the better and more exhaustive the results will be. Increasing the value will also increase memory consumption.

**Default**: `100`

**Constraints**:

- Values must be positive integers.
- Parameter **_cannot_** be changed after index creation.

**Example**:

```python
client.create_collection(
    "my_collection", 
    metadata={ "hnsw:construction_ef": 100}
)
```

### `hnsw:M`

**Description**: Controls the maximum number of neighbour connections (M), a newly inserted vector. A higher value
results in a mode densely connected graph. The impact on this is slower but more accurate searches with increased memory
consumption.

**Default**: `16`

**Constraints**:

- Values must be positive integers.
- Parameter **_cannot_** be changed after index creation.

**Example**:

```python
client.create_collection(
    "my_collection", 
    metadata={ "hnsw:M": 16}
)
```

### `hnsw:search_ef`

**Description**: Controls the number of neighbours in the HNSW graph to explore when searching. Increasing this requires
more memory for the HNSW algo to explore the nodes during knn search.

**Default**: `10`

**Constraints**:

- Values must be positive integers.
- Parameter **_can_** be changed after index creation.

**Example**:

```python
client.create_collection(
    "my_collection", 
    metadata={ "hnsw:search_ef": 10}
)
```

### `hnsw:num_threads`

**Description**: Controls how many threads HNSW algo use.

**Default**: `<number of CPU cores>`

**Constraints**:

- Values must be positive integers.
- Parameter **_can_** be changed after index creation.

**Example**:

```python
client.create_collection(
    "my_collection", 
    metadata={ "hnsw:num_threads": 4}
)
```

### `hnsw:resize_factor`

**Description**: Controls the rate of growth of the graph (e.g. how many node capacity will be added) whenever the
current graph capacity is reached.

**Default**: `1.2`

**Constraints**:

- Values must be positive floating point numbers.
- Parameter **_can_** be changed after index creation.

**Example**:

```python
client.create_collection(
    "my_collection", 
    metadata={ "hnsw:resize_factor": 1.2}
)
```

### `hnsw:batch_size`

**Description**: Controls the size of the Bruteforce (in-memory) index. Once this threshold is crossed vectors from BF
gets transferred to HNSW index. This value can be changed after index creation. The value must be less than
`hnsw:sync_threshold`.

**Default**: `100`

**Constraints**:

- Values must be positive integers.
- Parameter **_can_** be changed after index creation.

**Example**:

```python
client.create_collection(
    "my_collection", 
    metadata={ "hnsw:batch_size": 100}
)
```

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
client.create_collection(
    "my_collection", 
    metadata={
        "hnsw:space": "cosine",
        "hnsw:construction_ef": 100,
        "hnsw:M": 16,
        "hnsw:search_ef": 10,
        "hnsw:num_threads": 4,
        "hnsw:resize_factor": 1.2,
        "hnsw:batch_size": 100,
        "hnsw:sync_threshold": 1000,
    }
)
```

Updating HNSW parameters after creation

!!! warning "Updating HNSW parameters"

    Updating HNSW parameters after index creation is not supported as of version `0.5.5`.
