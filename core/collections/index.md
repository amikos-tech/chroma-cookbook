# Collections

Collections are the grouping mechanism for embeddings, documents, and metadata.

Runnable Examples

Complete, runnable collection examples for each language are available in the [examples/collections](https://github.com/amikos-tech/chroma-cookbook/tree/main/examples/collections) directory:

- [Python](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/collections/python/collection_examples.py)
- [TypeScript](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/collections/typescript/collection_examples.ts)
- [Go](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/collections/go/main.go)
- [Rust](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/collections/rust/src/main.rs)

All examples require a running Chroma server: `docker run -p 8000:8000 chromadb/chroma`

## Collection Basics

### Collection Properties

Each collection is characterized by the following properties:

- `name`: The name of the collection. The name can be changed as long as it is unique within the database ( use `collection.modify(name="new_name")` to change the name of the collection
- `metadata`: A dictionary of metadata associated with the collection. The metadata is a dictionary of key-value pairs. Keys can be strings, values can be strings, integers, floats, or booleans. Metadata can be changed using `collection.modify(metadata={"key": "value"})` (Note: Metadata is always overwritten when modified)
- `configuration`: A dictionary of HNSW index configuration options. Configuration is set at collection creation time via the `configuration` parameter. See the example below.
- `embedding_function`: The embedding function used to embed documents in the collection.

Defaults:

- Embedding Function - by default if `embedding_function` parameter is not provided at `create_collection()` or `get_or_create_collection()` time, Chroma uses `chromadb.utils.embedding_functions.DefaultEmbeddingFunction` to embed documents. The default embedding function uses [Onnx Runtime](https://onnxruntime.ai/) with [`all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) model.
- Distance metric - by default Chroma uses L2 (Euclidean Distance Squared) distance metric for newly created collections. You can change it at creation time using the `configuration` parameter: `configuration={"hnsw": {"space": "cosine"}}`. Possible values are `l2`, `cosine`, and `ip` (inner product). (Note: `cosine` value returns `cosine distance` rather than `cosine similarity`. I.e. values close to 0 means the embeddings are more similar.)
- Batch size, defined by `configuration={"hnsw": {"batch_size": 100}}`. Default is 100. The batch size defines the size of the in-memory bruteforce index. Once the threshold is reached, vectors are added to the HNSW index and the bruteforce index is cleared. Greater values may improve ingest performance. When updating also consider changing sync threshold.
- Sync threshold, defined by `configuration={"hnsw": {"sync_threshold": 1000}}`. Default is 1000. The sync threshold defines the limit at which the HNSW index is synced to disk. This limit only applies to newly added vectors.

Keep in Mind

Collection distance metric cannot be changed after the collection is created. To change the distance metric see [Cloning a Collection](#cloning-a-collection).

Embedding Function Persistence

Since Chroma v1.1.13, the embedding function configuration (EF) is persisted server-side. You no longer need to pass `embedding_function` when calling `get_collection` — Chroma will use the EF that was set at collection creation time.

Name Restrictions

Collection names in Chroma must adhere to the following restrictions:

(1) contains 3-512 characters (2) starts and ends with a lowercase letter or a digit (3) can contain dots, dashes, and underscores in between (4) cannot contain two consecutive periods (`..`) (5) is not a valid IPv4 address

### Creating a collection

Official Docs

For more information on the `create_collection` or `get_or_create_collection` methods, see the [official ChromaDB documentation](https://docs.trychroma.com/reference/python/client#getorcreatecollection).

Parameters:

| Name                 | Description                                                                 | Default Value                                                 | Type              |
| -------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------- |
| `name`               | Name of the collection to create. Parameter is required                     | N/A                                                           | String            |
| `metadata`           | Metadata associated with the collection. This is an optional parameter      | `None`                                                        | Dictionary        |
| `configuration`      | HNSW index configuration for the collection. This is an optional parameter  | `None`                                                        | Dictionary        |
| `embedding_function` | Embedding function to use for the collection. This is an optional parameter | `chromadb.utils.embedding_functions.DefaultEmbeddingFunction` | EmbeddingFunction |

```python
import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
col = client.create_collection("test")
```

```typescript
import { ChromaClient } from "chromadb";

const client = new ChromaClient();
const collection = await client.createCollection({ name: "test" });
```

```go
package main

import (
    "context"
    chroma "github.com/amikos-tech/chroma-go"
)

func main() {
    ctx := context.Background()
    client, _ := chroma.NewHTTPClient(ctx, chroma.WithDefaultDatabase("default_database"), chroma.WithDefaultTenant("default_tenant"))
    col, _ := client.CreateCollection(ctx, "test", false)
}
```

```rust
use chroma::{ChromaHttpClient, ChromaHttpClientOptions};

#[tokio::main]
async fn main() {
    let client = ChromaHttpClient::new(ChromaHttpClientOptions::default());
    let collection = client.create_collection("test", None, None).await.unwrap();
}
```

Alternatively you can use the `get_or_create_collection` method to create a collection if it doesn't exist already.

```python
import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
col = client.get_or_create_collection("test", metadata={"key": "value"})
```

```typescript
import { ChromaClient } from "chromadb";

const client = new ChromaClient();
const collection = await client.getOrCreateCollection({
    name: "test",
    metadata: { key: "value" },
});
```

```go
col, _ := client.GetOrCreateCollection(ctx, "test")
```

```rust
let collection = client.get_or_create_collection("test", None, None).await.unwrap();
```

Creating a collection with custom HNSW configuration:

```python
import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
col = client.create_collection(
    "test",
    configuration={
        "hnsw": {
            "space": "cosine",
            "ef_construction": 200,
            "max_neighbors": 32,
        }
    },
)
```

```typescript
import { ChromaClient } from "chromadb";

const client = new ChromaClient();
const collection = await client.createCollection({
    name: "test",
    configuration: {
        hnsw: {
            space: "cosine",
            ef_construction: 200,
            max_neighbors: 32,
        },
    },
});
```

### Embedding Function Configuration and Persistence

Starting with Chroma v1.1.13, embedding functions are persisted server-side in the collection configuration. After you create a collection, later `get_collection` / `getCollection` calls will auto-resolve the persisted embedding function.

You can configure embedding functions in two ways:

1. Pass `embedding_function` when creating a collection
1. Set `configuration.embedding_function` with `name` and `config`

API keys are auto-discovered from provider standard environment variables (for example `OPENAI_API_KEY`). If you use a non-standard variable, set `api_key_env_var` (Python) or `apiKeyEnvVar` (TypeScript).

The persisted `embedding_function` payload follows provider schemas in the upstream Chroma registry:

- [Embedding Function Schemas](https://github.com/chroma-core/chroma/tree/main/schemas/embedding_functions)
- [OpenAI Schema Example](https://github.com/chroma-core/chroma/blob/main/schemas/embedding_functions/openai.json)
- [Schema README](https://github.com/chroma-core/chroma/blob/main/schemas/embedding_functions/README.md)

Cross-checked dense provider/package mapping:

| Provider                      | Python | TypeScript (NPM · GitHub)                                                                                                                                                           | Go (pkg.go.dev · GitHub)                                                                                                                                                         |
| ----------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI                        | ✅     | ✅ [npm](https://www.npmjs.com/package/@chroma-core/openai) · [src](https://github.com/chroma-core/chroma/tree/main/clients/js/packages/chromadb-core/src/embeddings)               | ✅ [pkg](https://pkg.go.dev/github.com/amikos-tech/chroma-go/v2/pkg/embeddings/openai) · [src](https://github.com/amikos-tech/chroma-go/tree/main/pkg/embeddings/openai)         |
| Google Gemini                 | ✅     | ✅ [npm](https://www.npmjs.com/package/@chroma-core/google-gemini) · [src](https://github.com/chroma-core/chroma/tree/main/clients/js/packages/chromadb-core/src/embeddings)        | ✅ [pkg](https://pkg.go.dev/github.com/amikos-tech/chroma-go/v2/pkg/embeddings/gemini) · [src](https://github.com/amikos-tech/chroma-go/tree/main/pkg/embeddings/gemini)         |
| Cohere                        | ✅     | ✅ [npm](https://www.npmjs.com/package/@chroma-core/cohere) · [src](https://github.com/chroma-core/chroma/tree/main/clients/js/packages/chromadb-core/src/embeddings)               | ✅ [pkg](https://pkg.go.dev/github.com/amikos-tech/chroma-go/v2/pkg/embeddings/cohere) · [src](https://github.com/amikos-tech/chroma-go/tree/main/pkg/embeddings/cohere)         |
| Cloudflare Workers AI         | ✅     | ✅ [npm](https://www.npmjs.com/package/@chroma-core/cloudflare-worker-ai) · [src](https://github.com/chroma-core/chroma/tree/main/clients/js/packages/chromadb-core/src/embeddings) | ✅ [pkg](https://pkg.go.dev/github.com/amikos-tech/chroma-go/v2/pkg/embeddings/cloudflare) · [src](https://github.com/amikos-tech/chroma-go/tree/main/pkg/embeddings/cloudflare) |
| Hugging Face                  | ✅     | -                                                                                                                                                                                   | ✅ [pkg](https://pkg.go.dev/github.com/amikos-tech/chroma-go/v2/pkg/embeddings/hf) · [src](https://github.com/amikos-tech/chroma-go/tree/main/pkg/embeddings/hf)                 |
| Hugging Face Embedding Server | ✅     | ✅ [npm](https://www.npmjs.com/package/@chroma-core/huggingface-server) · [src](https://github.com/chroma-core/chroma/tree/main/clients/js/packages/chromadb-core/src/embeddings)   | ✅ [pkg](https://pkg.go.dev/github.com/amikos-tech/chroma-go/v2/pkg/embeddings/hf) · [src](https://github.com/amikos-tech/chroma-go/tree/main/pkg/embeddings/hf)                 |
| Instructor                    | ✅     | -                                                                                                                                                                                   | -                                                                                                                                                                                |
| Jina AI                       | ✅     | ✅ [npm](https://www.npmjs.com/package/@chroma-core/jina) · [src](https://github.com/chroma-core/chroma/tree/main/clients/js/packages/chromadb-core/src/embeddings)                 | ✅ [pkg](https://pkg.go.dev/github.com/amikos-tech/chroma-go/v2/pkg/embeddings/jina) · [src](https://github.com/amikos-tech/chroma-go/tree/main/pkg/embeddings/jina)             |
| Mistral                       | ✅     | ✅ [npm](https://www.npmjs.com/package/@chroma-core/mistral) · [src](https://github.com/chroma-core/chroma/tree/main/clients/js/packages/chromadb-core/src/embeddings)              | ✅ [pkg](https://pkg.go.dev/github.com/amikos-tech/chroma-go/v2/pkg/embeddings/mistral) · [src](https://github.com/amikos-tech/chroma-go/tree/main/pkg/embeddings/mistral)       |
| Morph                         | ✅     | ✅ [npm](https://www.npmjs.com/package/@chroma-core/morph) · [src](https://github.com/chroma-core/chroma/tree/main/clients/js/packages/chromadb-core/src/embeddings)                | ✅ [pkg](https://pkg.go.dev/github.com/amikos-tech/chroma-go/v2/pkg/embeddings/morph) · [src](https://github.com/amikos-tech/chroma-go/tree/main/pkg/embeddings/morph)           |
| Ollama                        | ✅     | ✅ [npm](https://www.npmjs.com/package/@chroma-core/ollama) · [src](https://github.com/chroma-core/chroma/tree/main/clients/js/packages/chromadb-core/src/embeddings)               | ✅ [pkg](https://pkg.go.dev/github.com/amikos-tech/chroma-go/v2/pkg/embeddings/ollama) · [src](https://github.com/amikos-tech/chroma-go/tree/main/pkg/embeddings/ollama)         |
| Nomic                         | ✅     | -                                                                                                                                                                                   | ✅ [pkg](https://pkg.go.dev/github.com/amikos-tech/chroma-go/v2/pkg/embeddings/nomic) · [src](https://github.com/amikos-tech/chroma-go/tree/main/pkg/embeddings/nomic)           |
| OpenCLIP (Multimodal)         | ✅     | -                                                                                                                                                                                   | -                                                                                                                                                                                |
| Roboflow (Multimodal)         | ✅     | -                                                                                                                                                                                   | ✅ [pkg](https://pkg.go.dev/github.com/amikos-tech/chroma-go/v2/pkg/embeddings/roboflow) · [src](https://github.com/amikos-tech/chroma-go/tree/main/pkg/embeddings/roboflow)     |
| Sentence Transformers         | ✅     | ✅ [npm](https://www.npmjs.com/package/@chroma-core/sentence-transformer) · [src](https://github.com/chroma-core/chroma/tree/main/clients/js/packages/chromadb-core/src/embeddings) | -                                                                                                                                                                                |
| Text2Vec                      | ✅     | -                                                                                                                                                                                   | -                                                                                                                                                                                |
| Together AI                   | ✅     | ✅ [npm](https://www.npmjs.com/package/@chroma-core/together-ai) · [src](https://github.com/chroma-core/chroma/tree/main/clients/js/packages/chromadb-core/src/embeddings)          | ✅ [pkg](https://pkg.go.dev/github.com/amikos-tech/chroma-go/v2/pkg/embeddings/together) · [src](https://github.com/amikos-tech/chroma-go/tree/main/pkg/embeddings/together)     |
| VoyageAI                      | ✅     | ✅ [npm](https://www.npmjs.com/package/@chroma-core/voyageai) · [src](https://github.com/chroma-core/chroma/tree/main/clients/js/packages/chromadb-core/src/embeddings)             | ✅ [pkg](https://pkg.go.dev/github.com/amikos-tech/chroma-go/v2/pkg/embeddings/voyage) · [src](https://github.com/amikos-tech/chroma-go/tree/main/pkg/embeddings/voyage)         |
| Amazon Bedrock                | ✅     | -                                                                                                                                                                                   | ✅ [pkg](https://pkg.go.dev/github.com/amikos-tech/chroma-go/v2/pkg/embeddings/bedrock) · [src](https://github.com/amikos-tech/chroma-go/tree/main/pkg/embeddings/bedrock)       |
| Baseten                       | ✅     | -                                                                                                                                                                                   | ✅ [pkg](https://pkg.go.dev/github.com/amikos-tech/chroma-go/v2/pkg/embeddings/baseten) · [src](https://github.com/amikos-tech/chroma-go/tree/main/pkg/embeddings/baseten)       |
| Chroma Cloud Qwen             | ✅     | ✅ [npm](https://www.npmjs.com/package/@chroma-core/chroma-cloud-qwen) · [src](https://github.com/chroma-core/chroma/tree/main/clients/js/packages/chromadb-core/src/embeddings)    | -                                                                                                                                                                                |

Sparse embedding function integrations include:

- Chroma BM25
- Chroma Cloud Splade
- Hugging Face sparse

For broader language/provider support, see:

- [Chroma Ecosystem Clients](https://cookbook.chromadb.dev/ecosystem/clients/index.md)
- [Chroma Integrations](https://docs.trychroma.com/integrations/chroma-integrations)
- [Upstream embedding functions reference](https://github.com/chroma-core/chroma/blob/main/docs/mintlify/docs/embeddings/embedding-functions.mdx)
- [Upstream collection configuration reference](https://github.com/chroma-core/chroma/blob/main/docs/mintlify/docs/collections/configure.mdx)

Cross-check Scope

Python/TypeScript support was cross-checked against Chroma Docs integrations and embedding functions pages. Go package mappings were cross-checked against `github.com/amikos-tech/chroma-go/v2/pkg/embeddings/*`.

Configure a persisted EF at collection creation:

```python
import chromadb
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction

client = chromadb.HttpClient()

# 1) Set via embedding_function argument
ef = OpenAIEmbeddingFunction(model_name="text-embedding-3-small")
col = client.create_collection("with_openai_ef", embedding_function=ef)

# 2) Later calls auto-resolve persisted EF (no ef needed here)
same_col = client.get_collection("with_openai_ef")
```

```typescript
import { ChromaClient } from "chromadb";

const client = new ChromaClient();

const collection = await client.createCollection({
    name: "with_openai_ef",
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

const sameCollection = await client.getCollection({ name: "with_openai_ef" });
```

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

    ef, _ := openai.NewOpenAIEmbeddingFunction(os.Getenv("OPENAI_API_KEY"))
    _, _ = client.CreateCollection(ctx, "with_openai_ef", v2.WithEmbeddingFunctionCreate(ef))

    // Persisted EF is auto-resolved server-side
    _, _ = client.GetCollection(ctx, "with_openai_ef")
}
```

Custom API key environment variable names:

```python
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction

ef = OpenAIEmbeddingFunction(
    model_name="text-embedding-3-small",
    api_key_env_var="MY_CUSTOM_OPENAI_KEY",
)
```

```typescript
import { OpenAIEmbeddingFunction } from "@chroma-core/openai";

const ef = new OpenAIEmbeddingFunction({
    modelName: "text-embedding-3-small",
    apiKeyEnvVar: "MY_CUSTOM_OPENAI_KEY",
});
```

Custom embedding function patterns:

```python
from typing import Any, Dict
from chromadb import Documents, EmbeddingFunction, Embeddings
from chromadb.utils.embedding_functions import register_embedding_function

@register_embedding_function
class MyEmbeddingFunction(EmbeddingFunction):
    def __call__(self, input: Documents) -> Embeddings:
        # Produce embeddings for input documents
        return [[0.0] * 3 for _ in input]

    @staticmethod
    def name() -> str:
        return "my-embedding-function"

    def get_config(self) -> Dict[str, Any]:
        return {"model": "my-model-v1"}

    @staticmethod
    def build_from_config(config: Dict[str, Any]) -> "MyEmbeddingFunction":
        return MyEmbeddingFunction()
```

```typescript
import type { ChromaClient, EmbeddingFunction } from "chromadb";

type MyConfig = { model: string };

class MyEmbeddingFunction implements EmbeddingFunction {
    public readonly name = "my-embedding-function";

    constructor(private readonly config: MyConfig) {}

    async generate(texts: string[]): Promise<number[][]> {
        return texts.map(() => [0, 0, 0]);
    }

    getConfig(): MyConfig {
        return this.config;
    }

    validateConfigUpdate(next: Record<string, unknown>) {
        if ("model" in next) {
            throw new Error("Model cannot be updated");
        }
    }

    static buildFromConfig(config: MyConfig, _client?: ChromaClient): MyEmbeddingFunction {
        return new MyEmbeddingFunction(config);
    }
}
```

```go
package myef

import (
    "context"

    "github.com/amikos-tech/chroma-go/v2/pkg/embeddings"
)

type MyEmbeddingFunction struct{}

func (m *MyEmbeddingFunction) EmbedDocuments(_ context.Context, texts []string) ([]embeddings.Embedding, error) {
    out := make([]embeddings.Embedding, len(texts))
    for i := range texts {
        out[i] = embeddings.NewEmbeddingFromFloat32([]float32{0, 0, 0})
    }
    return out, nil
}

func (m *MyEmbeddingFunction) EmbedQuery(_ context.Context, _ string) (embeddings.Embedding, error) {
    return embeddings.NewEmbeddingFromFloat32([]float32{0, 0, 0}), nil
}

func (m *MyEmbeddingFunction) Name() string { return "my-embedding-function" }

func (m *MyEmbeddingFunction) GetConfig() embeddings.EmbeddingFunctionConfig {
    return embeddings.EmbeddingFunctionConfig{"model": "my-model-v1"}
}

func (m *MyEmbeddingFunction) DefaultSpace() embeddings.DistanceMetric { return embeddings.COSINE }

func (m *MyEmbeddingFunction) SupportedSpaces() []embeddings.DistanceMetric {
    return []embeddings.DistanceMetric{embeddings.COSINE}
}

func newMyEmbeddingFunctionFromConfig(_ embeddings.EmbeddingFunctionConfig) (embeddings.EmbeddingFunction, error) {
    return &MyEmbeddingFunction{}, nil
}

func init() {
    _ = embeddings.RegisterDense("my-embedding-function", newMyEmbeddingFunctionFromConfig)
}
```

Metadata with `get_or_create_collection()`

If the collection exists and metadata is provided in the method it will attempt to overwrite the existing metadata.

### Deleting a collection

Official Docs

For more information on the `delete_collection` method, see the [official ChromaDB documentation](https://docs.trychroma.com/reference/python/client#deletecollection).

Destructive Operation

Deleting a collection permanently removes all its data (embeddings, documents, and metadata). This action cannot be undone.

Parameters:

| Name   | Description                                             | Default Value | Type   |
| ------ | ------------------------------------------------------- | ------------- | ------ |
| `name` | Name of the collection to delete. Parameter is required | N/A           | String |

```python
import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
client.delete_collection("test")
```

```typescript
import { ChromaClient } from "chromadb";

const client = new ChromaClient();
await client.deleteCollection({ name: "test" });
```

```go
_, err := client.DeleteCollection(ctx, "test")
```

```rust
client.delete_collection("test").await.unwrap();
```

### Listing all collections

Official Docs

For more information on the `list_collections` method, see the [official ChromaDB documentation](https://docs.trychroma.com/reference/python/client#listcollections).

The `list_collections` method returns `Collection` objects (name, metadata, configuration, and counts). Use `offset` and `limit` to paginate through large tenants or databases.

Parameters:

| Name     | Description                                                                                                                                                                           | Default Value | Type             |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------- |
| `offset` | The starting offset for listing collections. This is an optional parameter                                                                                                            | `None`        | Positive Integer |
| `limit`  | The number of collections to return. If the remaining collections from `offset` are fewer than this number then returned collection will also be fewer. This is an optional parameter | `None`        | Positive Integer |

```python
import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
collections = client.list_collections()  # returns list of collection names

# with pagination
collections = client.list_collections(limit=10, offset=0)
```

```typescript
import { ChromaClient } from "chromadb";

const client = new ChromaClient();
const collections = await client.listCollections({ limit: 10, offset: 0 });

// fetch the next page by advancing the offset
const nextPage = await client.listCollections({ limit: 10, offset: 10 });
```

```go
collections, _ := client.ListCollections(ctx)

// with pagination
collections, _ = client.ListCollections(ctx, chroma.ListWithLimit(10), chroma.ListWithOffset(0))
```

```rust
let collections = client.list_collections(100, None).await.unwrap();

// with pagination
let collections = client.list_collections(10, Some(0)).await.unwrap();
```

### Getting a collection

Official Docs

For more information on the `get_collection` method, see the [official ChromaDB documentation](https://docs.trychroma.com/reference/python/client#getcollection).

Embedding Function Persistence

Since Chroma v1.1.13, the embedding function is persisted server-side. You no longer need to pass `embedding_function` when calling `get_collection`. If you do pass one, it will override the persisted configuration for that client session.

Parameters:

| Name                 | Description                                                                                      | Default Value | Type              |
| -------------------- | ------------------------------------------------------------------------------------------------ | ------------- | ----------------- |
| `name`               | Name of the collection to get. Parameter is required                                             | N/A           | String            |
| `embedding_function` | Embedding function override for the collection. Optional — uses the persisted EF if not provided | `None`        | EmbeddingFunction |

```python
import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
col = client.get_collection("test")
```

```typescript
import { ChromaClient } from "chromadb";

const client = new ChromaClient();
const collection = await client.getCollection({ name: "test" });
```

```go
col, _ := client.GetCollection(ctx, "test")
```

```rust
let collection = client.get_collection("test").await.unwrap();
```

### Modifying a collection

Official Docs

For more information on the `modify` method, see the [official ChromaDB documentation](https://docs.trychroma.com/reference/python/collection#modify).

Modify method on collection

The `modify` method is called on the collection and not on the client, unlike the rest of the collection lifecycle methods.

Metadata Overwrite

Metadata is always overwritten when modified. If you want to add a new key-value pair to the metadata, you must first get the existing metadata and then add the new key-value pair to it.

Changing HNSW parameters

HNSW configuration parameters (space, M, ef_construction, etc.) cannot be changed after the collection is created. To change these parameters, clone the collection — see [Cloning a Collection](#cloning-a-collection).

Parameters:

| Name       | Description                                                            | Default Value | Type       |
| ---------- | ---------------------------------------------------------------------- | ------------- | ---------- |
| `name`     | The new name of the collection. Parameter is required                  | N/A           | String     |
| `metadata` | Metadata associated with the collection. This is an optional parameter | `None`        | Dictionary |

Both collection properties (`name` and `metadata`) can be modified, separately or together.

```python
import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
col = client.get_collection("test")
col.modify(name="test2", metadata={"key": "value"})
```

```typescript
import { ChromaClient } from "chromadb";

const client = new ChromaClient();
const collection = await client.getCollection({ name: "test" });
await collection.modify({ name: "test2", metadata: { key: "value" } });
```

### Counting Collections

Returns the number of collections for the currently configured tenant and database.

Official Docs

For more information on the `count_collections` method, see the [official ChromaDB documentation](https://docs.trychroma.com/reference/python/client#countcollections).

```python
import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
col = client.get_or_create_collection("test")  # create a new collection

collections_count = client.count_collections()  # int
```

```typescript
import { ChromaClient } from "chromadb";

const client = new ChromaClient();
const count = await client.countCollections();
```

### Convenience Methods

The following methods are available on a collection instance:

```python
import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
col = client.get_or_create_collection("test")
col.add(ids=["1", "2"], documents=["hello world", "hello chroma"])

# peek at the first N items in the collection (default 10)
col.peek()
col.peek(limit=5)

# count the number of items in the collection
col.count()
```

```typescript
import { ChromaClient } from "chromadb";

const client = new ChromaClient();
const collection = await client.getOrCreateCollection({ name: "test" });
await collection.add({
    ids: ["1", "2"],
    documents: ["hello world", "hello chroma"],
});

// peek at the first N items in the collection (default 10)
await collection.peek();
await collection.peek({ limit: 5 });

// count the number of items in the collection
await collection.count();
```

## Query and Get Results

`collection.get()` and `collection.query()` return column-oriented results.

- Column values are aligned by index. For `get()`, `ids[i]` refers to the same record as `documents[i]`, `metadatas[i]`, and `embeddings[i]` (if included).
- `query()` adds one level of nesting. `ids[q][k]` is the `k`-th match for query `q`, and aligns with `documents[q][k]`, `metadatas[q][k]`, and `distances[q][k]` (if included).
- Use `include` to control which optional fields are returned.
- Default `include` fields for `get()`: `documents` and `metadatas` (order may vary by client).
- Default `include` fields for `query()`: `documents`, `metadatas`, and `distances` (order may vary by client).
- `ids` are always returned, even when `include=[]`.

### Constrain Query Candidates By ID

Use the `ids` argument on `query()` to search only within a known subset of records. Provide one query input (`query_texts` or `query_embeddings`) and an `ids` list. By default, Chroma returns up to 10 results per query, capped by matching IDs.

```python
collection.query(
    query_texts=["climate"],
    ids=["doc-1", "doc-2", "doc-3"],
)
```

```typescript
await collection.query({
    queryTexts: ["climate"],
    ids: ["doc-1", "doc-2", "doc-3"],
});
```

```go
_, err := collection.Query(ctx,
    chroma.WithQueryTexts("climate"),
    chroma.WithIDs("doc-1", "doc-2", "doc-3"),
)
if err != nil {
    panic(err)
}
```

```rust
let _results = collection
    .query(
        vec![vec![0.1, 0.2, 0.3]],
        None,
        None,
        Some(vec![
            "doc-1".to_string(),
            "doc-2".to_string(),
            "doc-3".to_string(),
        ]),
        None,
    )
    .await?;
```

### Result Type Shapes

```python
class GetResult(TypedDict):
    ids: List[ID]
    embeddings: Optional[Union[Embeddings, PyEmbeddings, NDArray[Union[np.int32, np.float32]]]]
    documents: Optional[List[Document]]
    uris: Optional[URIs]
    data: Optional[Loadable]
    metadatas: Optional[List[Metadata]]
    included: Include

class QueryResult(TypedDict):
    ids: List[IDs]
    embeddings: Optional[
        Union[
            List[Embeddings],
            List[PyEmbeddings],
            List[NDArray[Union[np.int32, np.float32]]],
        ]
    ]
    documents: Optional[List[List[Document]]]
    uris: Optional[List[List[URI]]]
    data: Optional[List[Loadable]]
    metadatas: Optional[List[List[Metadata]]]
    distances: Optional[List[List[float]]]
    included: Include
```

```typescript
class GetResult<TMeta extends Metadata = Metadata> {
    readonly ids: string[];
    readonly documents: (string | null)[];
    readonly metadatas: (TMeta | null)[];
    readonly embeddings: number[][];
    readonly uris: (string | null)[];
    readonly include: Include[];
    rows(): Array<{
        id: string;
        document?: string | null;
        metadata?: TMeta | null;
        embedding?: number[];
        uri?: string | null;
    }>;
}

class QueryResult<TMeta extends Metadata = Metadata> {
    readonly ids: string[][];
    readonly documents: (string | null)[][];
    readonly metadatas: (TMeta | null)[][];
    readonly embeddings: (number[] | null)[][];
    readonly distances: (number | null)[][];
    readonly uris: (string | null)[][];
    readonly include: Include[];
    rows(): QueryRowResult<TMeta>[][];
}
```

```go
// Selected methods shown for brevity.
type GetResult interface {
    GetIDs() DocumentIDs
    GetDocuments() Documents
    GetMetadatas() DocumentMetadatas
    GetEmbeddings() embeddings.Embeddings
}

type QueryResult interface {
    GetIDGroups() []DocumentIDs
    GetDocumentsGroups() []Documents
    GetMetadatasGroups() []DocumentMetadatas
    GetEmbeddingsGroups() []embeddings.Embeddings
    GetDistancesGroups() []embeddings.Distances
}

type GetResultImpl struct {
    Ids        DocumentIDs
    Documents  Documents
    Metadatas  DocumentMetadatas
    Embeddings embeddings.Embeddings
    Include    []Include
}

type QueryResultImpl struct {
    IDLists         []DocumentIDs
    DocumentsLists  []Documents
    MetadatasLists  []DocumentMetadatas
    EmbeddingsLists []embeddings.Embeddings
    DistancesLists  []embeddings.Distances
    Include         []Include
}

// Row helpers for iteration
func (r *GetResultImpl) Rows() []ResultRow
func (r *GetResultImpl) At(index int) (ResultRow, bool)
// Query.Rows() returns the first query group; use RowGroups() for all groups.
func (r *QueryResultImpl) Rows() []ResultRow
func (r *QueryResultImpl) RowGroups() [][]ResultRow
func (r *QueryResultImpl) At(group, index int) (ResultRow, bool)
```

```rust
pub struct GetResponse {
    pub ids: Vec<String>,
    pub embeddings: Option<Vec<Vec<f32>>>,
    pub documents: Option<Vec<Option<String>>>,
    pub uris: Option<Vec<Option<String>>>,
    pub metadatas: Option<Vec<Option<Metadata>>>,
    pub include: Vec<Include>,
}

pub struct QueryResponse {
    pub ids: Vec<Vec<String>>,
    pub embeddings: Option<Vec<Vec<Option<Vec<f32>>>>>,
    pub documents: Option<Vec<Vec<Option<String>>>>,
    pub uris: Option<Vec<Vec<Option<String>>>>,
    pub metadatas: Option<Vec<Vec<Option<Metadata>>>>,
    pub distances: Option<Vec<Vec<Option<f32>>>>,
    pub include: Vec<Include>,
}
```

### Iteration Patterns

```python
# GET: zip aligned columns
result = collection.get(include=["documents", "metadatas"])
if result["documents"] is None or result["metadatas"] is None:
    raise ValueError("include must contain documents and metadatas")

for doc_id, doc, meta in zip(
    result["ids"],
    result["documents"],
    result["metadatas"],
):
    print(doc_id, doc, meta)

# QUERY: nested loop (queries -> matches)
q = collection.query(query_texts=["climate"], n_results=3, include=["documents", "distances"])
if q["documents"] is None or q["distances"] is None:
    raise ValueError("include must contain documents and distances")

for q_idx, ids in enumerate(q["ids"]):
    docs = q["documents"][q_idx]
    distances = q["distances"][q_idx]
    for doc_id, doc, distance in zip(ids, docs, distances):
        print(q_idx, doc_id, distance, doc)
```

```typescript
// Metadata type inference with generics
const getResult = await collection.get<{ page: number }>({
    include: ["documents", "metadatas"],
});

for (const row of getResult.rows()) {
    console.log(row.id, row.metadata?.page, row.document);
}

const queryResult = await collection.query<{ page: number }>({
    queryTexts: ["climate"],
    nResults: 3,
    include: ["documents", "metadatas", "distances"],
});

for (const [queryIndex, rows] of queryResult.rows().entries()) {
    for (const row of rows) {
        console.log(queryIndex, row.id, row.distance, row.metadata?.page);
    }
}
```

```go
// Keep example compact: panic on unexpected errors/types.
getResult, err := collection.Get(ctx, chroma.WithInclude(chroma.IncludeDocuments, chroma.IncludeMetadatas))
if err != nil {
    panic(err)
}
getRows, ok := getResult.(*chroma.GetResultImpl)
if !ok {
    panic(fmt.Sprintf("unexpected get result type %T", getResult))
}
for _, row := range getRows.Rows() {
    fmt.Println(row.ID, row.Document, row.Metadata)
}
if row, ok := getRows.At(0); ok {
    fmt.Println("first get row:", row.ID)
}

queryResult, err := collection.Query(ctx,
    chroma.WithQueryTexts("climate"),
    chroma.WithNResults(3),
    chroma.WithInclude(chroma.IncludeDocuments, chroma.IncludeMetadatas, chroma.IncludeDistances),
)
if err != nil {
    panic(err)
}
queryRows, ok := queryResult.(*chroma.QueryResultImpl)
if !ok {
    panic(fmt.Sprintf("unexpected query result type %T", queryResult))
}
// Query.Rows() gives rows for the first query group.
for _, row := range queryRows.Rows() {
    fmt.Println("q0", row.ID, row.Score, row.Document)
}
if row, ok := queryRows.At(0, 0); ok {
    fmt.Println("first query row:", row.ID)
}
// Query.RowGroups() gives all query groups (useful for multi-query inputs).
for queryIndex, rows := range queryRows.RowGroups() {
    for _, row := range rows {
        fmt.Println(queryIndex, row.ID, row.Score, row.Document)
    }
}
```

```rust
// `None` include uses the Rust defaults:
// IncludeList::default_get() and IncludeList::default_query().
let get_result = collection.get(None, None, Some(10), Some(0), None).await?;
for (i, id) in get_result.ids.iter().enumerate() {
    let doc = get_result
        .documents
        .as_ref()
        .and_then(|docs| docs.get(i))
        .and_then(|doc| doc.as_deref());
    println!("{id}: {:?}", doc);
}

let query_result = collection
    .query(vec![vec![0.1, 0.2, 0.3]], Some(3), None, None, None)
    .await?;
for (i, ids) in query_result.ids.iter().enumerate() {
    println!("query {i} has {} neighbors", ids.len());
}
for (query_index, ids) in query_result.ids.iter().enumerate() {
    for (rank, id) in ids.iter().enumerate() {
        let distance = query_result
            .distances
            .as_ref()
            .and_then(|groups| groups.get(query_index))
            .and_then(|group| group.get(rank))
            .and_then(|v| *v);
        println!("query={query_index} rank={rank} id={id} distance={distance:?}");
    }
}
```

## Iterating over a Collection

```python
import chromadb

client = chromadb.PersistentClient(path="my_local_data")  # or HttpClient()

collection = client.get_or_create_collection("local_collection")
collection.add(
    ids=[f"{i}" for i in range(1000)],
    documents=[f"document {i}" for i in range(1000)],
    metadatas=[{"doc_id": i} for i in range(1000)])
existing_count = collection.count()
batch_size = 10
for i in range(0, existing_count, batch_size):
    batch = collection.get(
        include=["metadatas", "documents", "embeddings"],
        limit=batch_size,
        offset=i)
    print(batch)  # do something with the batch
```

## Collection Utilities

### Copying Collections

The following example demonstrates how to copy a local collection to a remote ChromaDB server. (it also works in reverse)

```python
import chromadb

client = chromadb.PersistentClient(path="my_local_data")
remote_client = chromadb.HttpClient()

collection = client.get_or_create_collection("local_collection")
collection.add(
    ids=["1", "2"],
    documents=["hello world", "hello ChromaDB"],
    metadatas=[{"a": 1}, {"b": 2}])
remote_collection = remote_client.get_or_create_collection("remote_collection",
                                                           metadata=collection.metadata)
existing_count = collection.count()
batch_size = 10
for i in range(0, existing_count, batch_size):
    batch = collection.get(
        include=["metadatas", "documents", "embeddings"],
        limit=batch_size,
        offset=i)
    remote_collection.add(
        ids=batch["ids"],
        documents=batch["documents"],
        metadatas=batch["metadatas"],
        embeddings=batch["embeddings"])
```

Using ChromaDB Data Pipes

Using [ChromaDB Data Pipes](https://datapipes.chromadb.dev) package you can achieve the same result.

```bash
pip install chromadb-data-pipes
cdp export "file://path/to_local_data/local_collection" | \
cdp import "http://remote_chromadb:port/remote_collection" --create
```

Following shows an example of how to copy a collection from one local persistent DB to another local persistent DB.

```python
import chromadb

local_client = chromadb.PersistentClient(path="source")
remote_client = chromadb.PersistentClient(path="target")

collection = local_client.get_or_create_collection("my_source_collection")
collection.add(
    ids=["1", "2"],
    documents=["hello world", "hello ChromaDB"],
    metadatas=[{"a": 1}, {"b": 2}])
remote_collection = remote_client.get_or_create_collection("my_target_collection",
                                                           metadata=collection.metadata)
existing_count = collection.count()
batch_size = 10
for i in range(0, existing_count, batch_size):
    batch = collection.get(
        include=["metadatas", "documents", "embeddings"],
        limit=batch_size,
        offset=i)
    remote_collection.add(
        ids=batch["ids"],
        documents=batch["documents"],
        metadatas=batch["metadatas"],
        embeddings=batch["embeddings"])
```

Using ChromaDB Data Pipes

You can achieve the above with [ChromaDB Data Pipes](https://datapipes.chromadb.dev) package.

```bash
pip install chromadb-data-pipes
cdp export "file://source_persist_dir/target_collection" | \
cdp import "file://target_persist_dir/target_collection" --create
```

### Cloning a collection

Here are some reasons why you might want to clone a collection:

- Change distance function (via `configuration` — `hnsw.space`)
- Change HNSW hyper parameters (`max_neighbors`, `ef_construction`, `search_ef`)

```python
import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
col = client.get_or_create_collection("test")  # create a new collection with L2 (default)

col.add(ids=[f"{i}" for i in range(1000)], documents=[f"document {i}" for i in range(1000)])
newCol = client.get_or_create_collection("test1", configuration={
    "hnsw": {"space": "cosine"}})  # change the distance function to cosine

existing_count = col.count()
batch_size = 10
for i in range(0, existing_count, batch_size):
    batch = col.get(include=["metadatas", "documents", "embeddings"], limit=batch_size, offset=i)
    newCol.add(ids=batch["ids"], documents=batch["documents"], metadatas=batch["metadatas"],
               embeddings=batch["embeddings"])

print(newCol.count())
print(newCol.get(offset=0, limit=10))  # get first 10 documents
```

#### Changing the embedding function

To change the embedding function of a collection, it must be cloned to a new collection with the desired embedding function.

External API Dependency

This example requires an OpenAI API key (`OPENAI_API_KEY` environment variable). The [runnable example](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/collections/python/collection_examples.py) skips this section gracefully when the key is not set.

```python
import os
import chromadb
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction, DefaultEmbeddingFunction

client = chromadb.PersistentClient(path="test")  # or HttpClient()
default_ef = DefaultEmbeddingFunction()
col = client.create_collection("default_ef_collection",embedding_function=default_ef)
openai_ef = OpenAIEmbeddingFunction(api_key=os.getenv("OPENAI_API_KEY"), model_name="text-embedding-3-small")
col.add(ids=[f"{i}" for i in range(1000)], documents=[f"document {i}" for i in range(1000)])
newCol = client.get_or_create_collection("openai_ef_collection", embedding_function=openai_ef)

existing_count = col.count()
batch_size = 10
for i in range(0, existing_count, batch_size):
    batch = col.get(include=["metadatas", "documents"], limit=batch_size, offset=i)
    newCol.add(ids=batch["ids"], documents=batch["documents"], metadatas=batch["metadatas"])
# get first 10 documents with their OpenAI embeddings
print(newCol.get(offset=0, limit=10,include=["metadatas", "documents", "embeddings"]))
```

#### Cloning a subset of a collection with query

The below example demonstrates how to select a slice of an existing collection by using `where` and `where_document` query and creating a new collection with the selected slice.

Race Condition

The below example is not atomic and if data is changed between the initial selection query (`select_ids = col.get(...)` and the subsequent insertion query (`batch = col.get(...)`) the new collection may not contain the expected data.

```python
import chromadb

client = chromadb.PersistentClient(path="test")  # or HttpClient()
col = client.get_or_create_collection("test")  # create a new collection with L2 (default)

col.add(ids=[f"{i}" for i in range(1000)], documents=[f"document {i}" for i in range(1000)])
newCol = client.get_or_create_collection("test1", configuration={
    "hnsw": {"space": "cosine", "max_neighbors": 32}})
query_where = {"metadata_key": "value"}
query_where_document = {"$contains": "document"}
select_ids = col.get(where_document=query_where_document, where=query_where, include=[])  # get only IDs
batch_size = 10
for i in range(0, len(select_ids["ids"]), batch_size):
    batch = col.get(include=["metadatas", "documents", "embeddings"], limit=batch_size, offset=i, where=query_where,
                    where_document=query_where_document)
    newCol.add(ids=batch["ids"], documents=batch["documents"], metadatas=batch["metadatas"],
               embeddings=batch["embeddings"])

print(newCol.count())
print(newCol.get(offset=0, limit=10))  # get first 10 documents
```

### Updating Document/Record Metadata

In this example we loop through all documents of a collection and strip all metadata fields of leading and trailing whitespace. Change the `update_metadata` function to suit your needs.

```python
import chromadb

client = chromadb.PersistentClient(path="test")
col = client.get_or_create_collection("test")
count = col.count()


def update_metadata(metadata: dict):
    return {k: v.strip() for k, v in metadata.items()}


for i in range(0, count, 10):
    batch = col.get(include=["metadatas"], limit=10, offset=i)
    col.update(ids=batch["ids"], metadatas=[update_metadata(metadata) for metadata in batch["metadatas"]])
```

## Tips and Tricks

### Getting IDs Only

The below example demonstrates how to get only the IDs of a collection. This is useful if you need to work with IDs without the need to fetch any additional data. Chroma will accept and empty `include` array indicating that no other data than the IDs is returned.

```python
import chromadb

client = chromadb.PersistentClient(path="test")
col = client.get_or_create_collection("my_collection")
ids_only_result = col.get(include=[])
print(ids_only_result['ids'])
```
