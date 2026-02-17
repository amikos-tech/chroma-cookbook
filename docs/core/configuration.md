# Configuration

## 1.0 Configuration (Current)

Starting with Chroma 1.0, collection index settings are configured via the `configuration` dict parameter at
collection creation time. This replaces the legacy `metadata`-based approach.

```python
collection = client.create_collection(
    "my_collection",
    configuration={
        "hnsw": {
            "space": "cosine",
            "ef_construction": 200,
            "max_neighbors": 32,
        }
    },
)
```

!!! note "Configuration vs Metadata"

    The `configuration` dict is separate from `metadata`. Metadata is for user-defined key-value pairs.
    Configuration controls the vector index behavior. You cannot specify both `hnsw` and `spann` in the
    same configuration - only one index type is allowed per collection.

### HNSW Index Configuration

HNSW (Hierarchical Navigable Small World) is the default vector index for Chroma. It provides fast approximate
nearest neighbor search for single-node and self-hosted deployments.

#### Parameters

| Parameter | Description | Default | Constraints | Mutable |
|-----------|-------------|---------|-------------|---------|
| `space` | Distance metric | `l2` | `l2`, `cosine`, `ip` | No |
| `ef_construction` | Neighbors explored during index build | `100` | Positive integer | No |
| `ef_search` | Neighbors explored during search | `100` | Positive integer | Yes |
| `max_neighbors` | Max connections per node (M parameter) | `16` | Positive integer | No |
| `num_threads` | Threads used by HNSW | CPU cores | Positive integer | Yes |
| `resize_factor` | Graph growth rate when capacity is reached | `1.2` | Positive float | Yes |
| `batch_size` | In-memory bruteforce index size before HNSW flush | `100` | >= 2 | Yes |
| `sync_threshold` | Threshold for syncing HNSW index to disk | `1000` | >= 2 | Yes |

#### Examples

=== "Python"

    **Create with configuration:**

    ```python
    import chromadb

    client = chromadb.HttpClient()  # or PersistentClient()
    collection = client.create_collection(
        "my_collection",
        configuration={
            "hnsw": {
                "space": "cosine",
                "ef_construction": 200,
                "ef_search": 100,
                "max_neighbors": 32,
                "num_threads": 4,
                "resize_factor": 1.2,
                "batch_size": 100,
                "sync_threshold": 1000,
            }
        },
    )
    ```

    **Update mutable parameters after creation:**

    ```python
    collection.modify(
        configuration={
            "hnsw": {
                "ef_search": 200,
                "num_threads": 8,
            }
        }
    )
    ```

=== "TypeScript"

    ```typescript
    import { ChromaClient } from "chromadb";

    const client = new ChromaClient();
    const collection = await client.createCollection({
        name: "my_collection",
        configuration: {
            hnsw: {
                space: "cosine",
                ef_construction: 200,
                ef_search: 100,
                max_neighbors: 32,
                num_threads: 4,
                resize_factor: 1.2,
                batch_size: 100,
                sync_threshold: 1000,
            },
        },
    });
    ```

=== "Go"

    ```go
    package main

    import (
        "context"
        chroma "github.com/amikos-tech/chroma-go"
        "github.com/amikos-tech/chroma-go/types"
    )

    func main() {
        ctx := context.Background()
        client, _ := chroma.NewHTTPClient(ctx,
            chroma.WithDefaultDatabase("default_database"),
            chroma.WithDefaultTenant("default_tenant"),
        )
        col, _ := client.CreateCollection(ctx, "my_collection", false,
            types.WithHNSWConfiguration(
                types.WithSpace("cosine"),
                types.WithEfConstruction(200),
                types.WithEfSearch(100),
                types.WithMaxNeighbors(32),
            ),
        )
    }
    ```

### SPANN Index Configuration

!!! info "Chroma Cloud Only"

    SPANN is the vector index used in **Chroma Cloud** and distributed Chroma deployments.
    It is not available in single-node self-hosted Chroma. If you are running Chroma locally,
    use HNSW configuration instead.

SPANN (Space Partition tree AND graph based Nearest neighbor search) is Chroma's distributed vector index,
based on the [SPFresh](https://arxiv.org/abs/2206.14286) paper. It is designed for large-scale datasets where
the full index cannot fit in a single machine's memory.

#### How SPANN Works

```
                           SPANN Architecture
  ┌───────────────────────────────────────────────────────────┐
  │                    Query: "find similar"                   │
  │                           │                                │
  │                           ▼                                │
  │              ┌─────────────────────┐                       │
  │              │   HNSW Centroid     │  O(log C) lookup      │
  │              │   Index             │  C = num centroids    │
  │              │  ┌──┐ ┌──┐ ┌──┐    │                       │
  │              │  │c1│─│c2│─│c3│··· │                       │
  │              │  └──┘ └──┘ └──┘    │                       │
  │              └────────┬───────────┘                       │
  │                       │ top-K centroids                    │
  │              ┌────────▼───────────┐                       │
  │              │  Probe posting     │  search_nprobe         │
  │              │  lists for each    │  centroids probed      │
  │              │  selected centroid │                        │
  │              └────────┬───────────┘                       │
  │                       │                                    │
  │      ┌────────────────┼────────────────┐                  │
  │      ▼                ▼                ▼                   │
  │  ┌────────┐      ┌────────┐      ┌────────┐              │
  │  │Posting │      │Posting │      │Posting │              │
  │  │List c1 │      │List c2 │      │List c3 │   Blockfile  │
  │  │┌─┐┌─┐ │      │┌─┐┌─┐ │      │┌─┐┌─┐ │   storage    │
  │  ││d││d│…│      ││d││d│…│      ││d││d│…│              │
  │  │└─┘└─┘ │      │└─┘└─┘ │      │└─┘└─┘ │              │
  │  └────────┘      └────────┘      └────────┘              │
  │                       │                                    │
  │              ┌────────▼───────────┐                       │
  │              │  Score, dedupe,    │                        │
  │              │  return results    │                        │
  │              └────────────────────┘                       │
  └───────────────────────────────────────────────────────────┘

  SPFresh Maintenance (automatic):
  ┌───────────────────────────────────────────────────────────┐
  │  Posting list too large (> split_threshold)?              │
  │    → Split via balanced 2-means clustering                │
  │    → New centroid added to HNSW index                     │
  │    → Nearby points reassigned for better recall           │
  │                                                           │
  │  Posting list too small (< merge_threshold)?              │
  │    → Merge with nearest neighbor centroid                  │
  │    → Old centroid removed from HNSW index                 │
  └───────────────────────────────────────────────────────────┘
```

**Key concepts:**

- **Centroids** are cluster representatives stored in a small HNSW graph for fast lookup
- **Posting lists** store the actual document embeddings grouped by their nearest centroid
- **Multi-posting** allows a document to appear in multiple posting lists for better recall
- **SPFresh maintenance** automatically splits large clusters and merges small ones to keep cluster sizes balanced

#### Parameters

| Parameter | Description | Default | Constraints | Mutable |
|-----------|-------------|---------|-------------|---------|
| `space` | Distance metric | `l2` | `l2`, `cosine`, `ip` | No |
| `search_nprobe` | Number of centroids probed during search | `64` | Max 128 | Yes |
| `write_nprobe` | Number of centroids considered during insert | `32` | Max 128 | No |
| `ef_construction` | HNSW build effort for centroid index | `200` | Max 200 | No |
| `ef_search` | HNSW search effort for centroid index | `200` | Max 200 | Yes |
| `max_neighbors` | Max connections in centroid HNSW graph | `64` | Max 64 | No |
| `reassign_neighbor_count` | Nearby clusters checked during split reassignment | `64` | Max 64 | No |
| `split_threshold` | Posting list size that triggers a split | `50` | 25 - 200 | No |
| `merge_threshold` | Posting list size that triggers a merge | `25` | 12 - 100 | No |

!!! tip "Tuning Guidance"

    - **`search_nprobe`** is the primary knob for search quality vs latency. Higher values improve recall
      but increase search time. Start with the default (64) and adjust based on your recall requirements.
    - **`split_threshold`** and **`merge_threshold`** control cluster granularity. Smaller split thresholds
      create more, smaller clusters (better for high-dimensional data). The merge threshold should always
      be less than the split threshold.
    - **`space`** must match your embedding model's expected distance metric. Use `cosine` for normalized
      embeddings (most common), `l2` for Euclidean distance, or `ip` for inner product.

#### Examples

=== "Python"

    **Create with SPANN configuration:**

    ```python
    import chromadb

    client = chromadb.CloudClient(
        tenant="my-tenant",
        database="my-database",
    )
    collection = client.create_collection(
        "my_collection",
        configuration={
            "spann": {
                "space": "cosine",
                "search_nprobe": 64,
                "ef_search": 200,
            }
        },
    )
    ```

    **Update mutable parameters after creation:**

    ```python
    collection.modify(
        configuration={
            "spann": {
                "search_nprobe": 96,
                "ef_search": 200,
            }
        }
    )
    ```

=== "TypeScript"

    ```typescript
    import { ChromaClient } from "chromadb";

    const client = new ChromaClient({
        // Cloud client configuration
    });
    const collection = await client.createCollection({
        name: "my_collection",
        configuration: {
            spann: {
                space: "cosine",
                search_nprobe: 64,
                ef_search: 200,
            },
        },
    });
    ```

=== "Go"

    ```go
    package main

    import (
        "context"
        chroma "github.com/amikos-tech/chroma-go/v2"
        v2 "github.com/amikos-tech/chroma-go/v2/pkg/api/v2"
    )

    func main() {
        ctx := context.Background()
        client, _ := chroma.NewCloudClient(ctx,
            chroma.WithTenant("my-tenant"),
            chroma.WithDatabase("my-database"),
        )
        col, _ := client.CreateCollection(ctx, "my_collection",
            v2.WithVectorIndexCreate(v2.NewVectorIndexConfig(
                v2.WithSpace(v2.SpaceCosine),
                v2.WithSpann(v2.NewSpannConfig(
                    v2.WithSpannSearchNprobe(64),
                    v2.WithSpannEfSearch(200),
                )),
            )),
        )
    }
    ```

### Embedding Function Configuration

Starting with Chroma v1.1.13, embedding functions are persisted server-side. You can configure
the embedding function at collection creation time, and it will be automatically used on subsequent
`get_collection` calls.

=== "Python"

    **Set via argument (recommended):**

    ```python
    from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction

    ef = OpenAIEmbeddingFunction(model_name="text-embedding-3-small")
    collection = client.create_collection("my_collection", embedding_function=ef)

    # On subsequent access, the EF is auto-resolved:
    collection = client.get_collection("my_collection")  # no ef needed
    ```

    **Set via configuration dict:**

    ```python
    collection = client.create_collection(
        "my_collection",
        configuration={
            "embedding_function": {
                "name": "openai",
                "config": {
                    "model_name": "text-embedding-3-small",
                    "api_key_env_var": "OPENAI_API_KEY",
                },
            }
        },
    )
    ```

    **Custom API key environment variable:**

    ```python
    ef = OpenAIEmbeddingFunction(
        model_name="text-embedding-3-small",
        api_key_env_var="MY_CUSTOM_OPENAI_KEY",  # defaults to OPENAI_API_KEY
    )
    collection = client.create_collection("my_collection", embedding_function=ef)
    ```

=== "TypeScript"

    ```typescript
    const collection = await client.createCollection({
        name: "my_collection",
        configuration: {
            embedding_function: {
                name: "openai",
                config: {
                    model_name: "text-embedding-3-small",
                    apiKeyEnvVar: "OPENAI_API_KEY",
                },
            },
        },
    });
    ```

=== "Go"

    ```go
    package main

    import (
        "context"
        "os"

        chroma "github.com/amikos-tech/chroma-go/v2"
        v2 "github.com/amikos-tech/chroma-go/v2/pkg/api/v2"
        openai "github.com/amikos-tech/chroma-go/v2/pkg/embeddings/openai"
    )

    func main() {
        ctx := context.Background()
        client, _ := chroma.NewHTTPClient(ctx,
            chroma.WithDefaultDatabase("default_database"),
            chroma.WithDefaultTenant("default_tenant"),
        )

        ef, _ := openai.NewOpenAIEmbeddingFunction(os.Getenv("OPENAI_API_KEY"),
            openai.WithModel(openai.TextEmbedding3Small),
        )
        col, _ := client.CreateCollection(ctx, "my_collection",
            v2.WithEmbeddingFunctionCreate(ef),
        )
    }
    ```

---

## 1.x Server Configuration

Chroma 1.x is configured via a YAML configuration file. The server loads configuration from the path
specified by the `CONFIG_PATH` environment variable. Individual settings can be overridden with
`CHROMA_`-prefixed environment variables (use `__` for nested properties).

```bash
# Start with a custom config file
CONFIG_PATH=/etc/chroma/config.yaml chroma run

# Override individual settings via environment variables
CHROMA_PORT=9000 chroma run
CHROMA_CORS_ALLOW_ORIGINS='["*"]' chroma run
CHROMA_ALLOW_RESET=true chroma run
```

### HTTP Server Settings

| Parameter | Description | Default | Env Override |
|-----------|-------------|---------|--------------|
| `port` | HTTP server port | `8000` | `CHROMA_PORT` |
| `listen_address` | Bind address | `0.0.0.0` | `CHROMA_LISTEN_ADDRESS` |
| `max_payload_size_bytes` | Max request body size | `41943040` (40 MB) | `CHROMA_MAX_PAYLOAD_SIZE_BYTES` |
| `cors_allow_origins` | Allowed CORS origins | None | `CHROMA_CORS_ALLOW_ORIGINS` |
| `persist_path` | Data directory | `./chroma` | `CHROMA_PERSIST_PATH` |

### General Settings

| Parameter | Description | Default | Env Override |
|-----------|-------------|---------|--------------|
| `allow_reset` | Enable the `/reset` endpoint | `false` | `CHROMA_ALLOW_RESET` |
| `default_knn_index` | Default vector index type | `hnsw` | `CHROMA_DEFAULT_KNN_INDEX` |
| `enable_schema` | Enable schema validation | `true` | `CHROMA_ENABLE_SCHEMA` |

### SQLite Settings

| Parameter | Description | Default |
|-----------|-------------|---------|
| `sqlitedb.hash_type` | Migration hash algorithm | `md5` |
| `sqlitedb.migration_mode` | How migrations are handled | `apply` |

### OpenTelemetry

Chroma 1.x emits traces via OpenTelemetry (OTLP gRPC). To enable tracing, set the
`open_telemetry` section in your config file or use environment variables.

| Parameter | Description | Default |
|-----------|-------------|---------|
| `open_telemetry.endpoint` | OTLP gRPC endpoint | None (disabled) |
| `open_telemetry.service_name` | Service name in traces | `chromadb` |
| `open_telemetry.filters` | Per-crate log level filters | `[{crate_name: "chroma_frontend", filter_level: "trace"}]` |

#### Local OTEL Stack with Docker Compose

The following docker-compose setup runs Chroma with a local OpenTelemetry Collector
and Jaeger for trace visualization.

```yaml
version: "3.8"

services:
  chroma:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - chroma-data:/chroma/chroma
      - ./chroma-config.yaml:/etc/chroma/config.yaml
    environment:
      - CONFIG_PATH=/etc/chroma/config.yaml
    depends_on:
      - otel-collector

  otel-collector:
    image: otel/opentelemetry-collector:0.107.0
    ports:
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
    volumes:
      - ./otel-config.yaml:/etc/otelcol/config.yaml

  jaeger:
    image: jaegertracing/all-in-one:1.56
    ports:
      - "16686:16686" # Jaeger UI
      - "14268:14268"
    environment:
      - SPAN_STORAGE_TYPE=badger
      - BADGER_EPHEMERAL=false
      - BADGER_DIRECTORY_KEY=/badger/key
      - BADGER_DIRECTORY_VALUE=/badger/data

volumes:
  chroma-data:
```

**`chroma-config.yaml`:**

```yaml
persist_path: "/chroma/chroma"
open_telemetry:
  service_name: "chroma"
  endpoint: "http://otel-collector:4317"
  filters:
    - crate_name: "chroma_frontend"
      filter_level: "info"
```

**`otel-config.yaml`:**

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:

exporters:
  otlp/jaeger:
    endpoint: jaeger:4317
    tls:
      insecure: true

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp/jaeger]
```

After `docker compose up`, open **http://localhost:16686** to view traces in Jaeger.

### Example Configurations

**Minimal single-node:**

```yaml
persist_path: "./chroma"
```

**Single-node with all common options:**

```yaml
# HTTP server
port: 8000
listen_address: "0.0.0.0"
max_payload_size_bytes: 41943040
cors_allow_origins: ["*"]

# Storage
persist_path: "./chroma"
allow_reset: false

# SQLite
sqlitedb:
  hash_type: "md5"
  migration_mode: "apply"

# Telemetry (optional)
open_telemetry:
  service_name: "chroma"
  endpoint: "http://otel-collector:4317"
  filters:
    - crate_name: "chroma_frontend"
      filter_level: "trace"
```

**Docker single-node:**

```yaml
persist_path: "/data"
```

!!! tip "Environment Variable Nesting"

    Nested YAML properties are overridden using `__` as a separator. For example,
    `sqlitedb.hash_type` becomes `CHROMA_SQLITEDB__HASH_TYPE`.

---

## Pre-1.0 Configuration (Legacy)

!!! warning "Legacy Configuration"

    The configuration options below apply to Chroma versions prior to 1.0. For Chroma 1.0+, use the
    `configuration` dict parameter described above. Legacy `metadata`-based HNSW configuration
    (e.g. `metadata={"hnsw:space": "cosine"}`) is still supported for backwards compatibility but
    is deprecated.

### Common Configurations Options

### Server Configuration

#### Core

##### `IS_PERSISTENT`

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



##### `PERSIST_DIRECTORY`

Defines the directory where Chroma should persist data. This can be relative or absolute path. The directory must be
writeable to Chroma process.

Default: `./chroma`

##### `ALLOW_RESET`

Defines whether Chroma should allow resetting the index (delete all data).

Possible values:

- `TRUE`
- `FALSE`

Default: `FALSE`

##### `CHROMA_MEMORY_LIMIT_BYTES`

##### `CHROMA_SEGMENT_CACHE_POLICY`

#### Telemetry and Observability

In the current Chroma version (as of time or writing `0.6.3`) the only type of telemetry supported are traces.

The following configuration options allow you to configure the tracing service that accepts OpenTelemetry traces via the OLTP GRPC endpoint.

In addition to traces Chroma also performs anonymized product telemetry. The product telemetry is enabled by default.

##### `CHROMA_OTEL_COLLECTION_ENDPOINT`

Defines the endpoint of the tracing service that accepts OpenTelemetry traces via the OLTP GRPC endpoint.

Value type: `Valid URL`

Default: None

**Example**:

```bash
export CHROMA_OTEL_COLLECTION_ENDPOINT=http://localhost:4317
```


##### `CHROMA_OTEL_SERVICE_NAME`

Defines the name of the service that will be used in the tracing service.

Default: `chroma`

**Example**:

```bash
export CHROMA_OTEL_SERVICE_NAME=chroma-dev
```

##### `CHROMA_OTEL_COLLECTION_HEADERS`

Defines the headers that will be sent with each trace/span.

Default: None

**Example**:

```bash
export CHROMA_OTEL_COLLECTION_HEADERS='{"X-API-KEY":"1234567890"}'
```

##### `CHROMA_OTEL_GRANULARITY`

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

##### `CHROMA_PRODUCT_TELEMETRY_IMPL`

!!! warning "Do not change"

    Do not change the default implementation as it may impact Chroma stability, instead use the `ANONYMIZED_TELEMETRY` configuration.

Defines the implementation of the product telemetry.

Default: `chromadb.telemetry.product.posthog.Posthog`


##### `CHROMA_TELEMETRY_IMPL`

This is identical to `CHROMA_PRODUCT_TELEMETRY_IMPL` but for the anonymized telemetry but is kept for backwards compatibility.

##### `ANONYMIZED_TELEMETRY`

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

#### Maintenance

##### `MIGRATIONS`

Defines how schema migrations are handled in Chroma.

Possible values:

- `none` - No migrations are applied.
- `validate` - Existing schema is validated.
- `apply` - Migrations are applied.

Default: `apply`

##### `MIGRATIONS_HASH_ALGORITHM`

Defines the algorithm used to hash the migrations. This configuration was introduces as some organizations have strict policies around use of cryptographic algorithms, considering the default `md5` being a weak hashing algorithm.

Possible values:

- `sha256` - Uses SHA-256 to hash the migrations.
- `md5` - Uses MD5 to hash the migrations.

Default: `md5`

**Example**:

```bash
export MIGRATIONS_HASH_ALGORITHM=sha256
```

#### Operations and Distributed

##### `CHROMA_SYSDB_IMPL`

##### `CHROMA_PRODUCER_IMPL`

##### `CHROMA_CONSUMER_IMPL`

##### `CHROMA_SEGMENT_MANAGER_IMPL`

##### `CHROMA_SEGMENT_DIRECTORY_IMPL`

##### `CHROMA_MEMBERLIST_PROVIDER_IMPL`

##### `WORKER_MEMBERLIST_NAME`

##### `CHROMA_COORDINATOR_HOST`

##### `CHROMA_SERVER_GRPC_PORT`

##### `CHROMA_LOGSERVICE_HOST`

##### `CHROMA_LOGSERVICE_PORT`

##### `CHROMA_QUOTA_PROVIDER_IMPL`

##### `CHROMA_RATE_LIMITING_PROVIDER_IMPL`

#### Authentication

##### `CHROMA_AUTH_TOKEN_TRANSPORT_HEADER`

##### `CHROMA_CLIENT_AUTH_PROVIDER`

##### `CHROMA_CLIENT_AUTH_CREDENTIALS`

##### `CHROMA_SERVER_AUTH_IGNORE_PATHS`

##### `CHROMA_OVERWRITE_SINGLETON_TENANT_DATABASE_ACCESS_FROM_AUTH`

##### `CHROMA_SERVER_AUTHN_PROVIDER`

##### `CHROMA_SERVER_AUTHN_CREDENTIALS`

##### `CHROMA_SERVER_AUTHN_CREDENTIALS_FILE`

#### Authorization

##### `CHROMA_SERVER_AUTHZ_PROVIDER`

##### `CHROMA_SERVER_AUTHZ_CONFIG`

##### `CHROMA_SERVER_AUTHZ_CONFIG_FILE`

### Client Configuration

#### Authentication

### HNSW Configuration (Legacy)

HNSW parameters were previously configured as collection metadata with the `hnsw:` prefix.
This approach still works for backwards compatibility but is deprecated in favor of the
`configuration` dict.

!!! tip "Changing HNSW parameters"

    Some HNSW parameters cannot be changed after index creation via the standard method shown below.
    If you which to change these parameters, you will need to clone the collection see an example [here](collections.md#cloning-a-collection).

#### `hnsw:space`

**Description**: Controls the distance metric of the HNSW index. The space cannot be changed after index creation.

**Default**: `l2`

**Constraints**:

- Possible values: `l2`, `cosine`, `ip`
- Parameter **_cannot_** be changed after index creation.

**Example**:

```python
res = client.create_collection("my_collection", metadata={ "hnsw:space": "cosine"})
```

#### `hnsw:construction_ef`

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

#### `hnsw:M`

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

#### `hnsw:search_ef`

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

#### `hnsw:num_threads`

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

#### `hnsw:resize_factor`

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

#### `hnsw:batch_size`

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

#### `hnsw:sync_threshold`

**Description**: Controls the threshold when using HNSW index is written to disk.

**Default**: `1000`

**Constraints**:

- Values must be positive integers.
- Parameter **_can_** be changed after index creation.

#### Examples

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
