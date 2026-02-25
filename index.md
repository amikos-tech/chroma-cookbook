# Home

This is a collection of small guides and recipes to help you get started with Chroma.

Latest ChromaDB version: [1.5.1](https://github.com/chroma-core/chroma/releases/tag/1.5.1)

API Changelog (1.5.1 and 1.5.0)

**Version [1.5.1](https://github.com/chroma-core/chroma/releases/tag/1.5.1) (February 19, 2026)**

| Area            | API-facing change                                   | Reference                                                |
| --------------- | --------------------------------------------------- | -------------------------------------------------------- |
| Advanced Search | Removed beta label from Advanced Search API         | [#6396](https://github.com/chroma-core/chroma/pull/6396) |
| Collections     | Reject `fork_collection` for multi-region databases | [#6400](https://github.com/chroma-core/chroma/pull/6400) |
| Schema / FTS    | Added option to disable FTS in schema               | [#6214](https://github.com/chroma-core/chroma/pull/6214) |

**Version [1.5.0](https://github.com/chroma-core/chroma/releases/tag/1.5.0) (February 9, 2026)**

| Area        | API-facing change                                  | Reference                                                |
| ----------- | -------------------------------------------------- | -------------------------------------------------------- |
| Search      | Exported search options parameter                  | [#6160](https://github.com/chroma-core/chroma/pull/6160) |
| Collections | Rust sysdb impl for `get collections`              | [#6146](https://github.com/chroma-core/chroma/pull/6146) |
| Collections | Rust sysdb impl for `get collection with segments` | [#6147](https://github.com/chroma-core/chroma/pull/6147) |
| Collections | Rust sysdb impl for `update collection`            | [#6163](https://github.com/chroma-core/chroma/pull/6163) |
| Schema      | Added option to enable quantization in schema      | [#6295](https://github.com/chroma-core/chroma/pull/6295) |

## New and Noteworthy

- 🧩 [Deployment Patterns](https://cookbook.chromadb.dev/running/deployment-patterns/index.md) - Added two practical deployment walkthroughs: embed Chroma directly in a Python app, or run it as a standalone server and connect with `HttpClient` - 📅`24-Feb-2026`
- 📊 [Resource Requirements](https://cookbook.chromadb.dev/core/resources/index.md) - Added an interactive sizing calculator, clearer RAM formulas, and explicit disk caveats for large documents and FTS index overhead - 📅`21-Feb-2026`
- 🚀 [Running Chroma](https://cookbook.chromadb.dev/running/running-chroma/index.md) - Refreshed CLI/Docker/Compose/Minikube guidance, aligned Helm chart notes, and added collapsed optional YAML config examples - 📅`20-Feb-2026`
- 🧭 [Core Concepts](https://cookbook.chromadb.dev/core/concepts/index.md) - Reworked into General vs Power Users tracks, with interactive local/distributed execution diagrams and data-flow visuals - 📅`19-Feb-2026`
- 🎯 [Collections Query IDs](https://cookbook.chromadb.dev/core/collections/#constrain-query-candidates-by-id) - Documented `query(..., ids=...)` for restricting similarity search to specific records - 📅`17-Feb-2026`
- 🔍 [Filters](https://cookbook.chromadb.dev/core/filters/index.md) - Added multi-language filter examples and `$regex`/`$not_regex` operators - 📅`17-Feb-2026`
- 🔧 [Installation](https://cookbook.chromadb.dev/core/install/index.md) - Updated package names and added Go/Rust install examples - 📅`17-Feb-2026`
- ⚒️ [Configuration](https://cookbook.chromadb.dev/core/configuration/index.md) - Added 1.0 docs for HNSW, SPANN index, and embedding functions - 📅`17-Feb-2026`
- 📦 [Clients](https://cookbook.chromadb.dev/core/clients/#cloud-client) - Added Cloud Client section and updated client examples - 📅`17-Feb-2026`
- 📚 [Collections](https://cookbook.chromadb.dev/core/collections/index.md) - Updated to current APIs with multi-language examples - 📅`17-Feb-2026`
- 🏷️ [Array Metadata Filters](https://cookbook.chromadb.dev/core/filters/#array-metadata) - Chroma 1.5.0 adds support for array metadata with `$contains`/`$not_contains` operators - 📅`17-Feb-2026`
- 🔑 [Authentication in Chroma v1.0.x](https://cookbook.chromadb.dev/security/auth-1.0.x/index.md) - Chroma 1.0.x does not support native Authentication, in this article we cover how to secure your Chroma 1.0.x instance - 📅`28-May-2025`

## Getting Started

We suggest you first head to the [Concepts](https://cookbook.chromadb.dev/core/concepts/index.md) section. It now has two tracks:

- [For General Users](https://cookbook.chromadb.dev/core/concepts/#for-general-users) - tenancy, collections, metadata, embeddings, and cloud data-flow basics
- [For Power Users](https://cookbook.chromadb.dev/core/concepts/#for-power-users) - local SQLite + HNSW path, distributed frontend dispatch path, and core internals

Once you're comfortable with the concepts, you can jump to the [Installation](https://cookbook.chromadb.dev/core/install/index.md) section to install ChromaDB.

**Core Topics:**

- [Filters](https://cookbook.chromadb.dev/core/filters/index.md) - Learn to filter data in ChromaDB using metadata and document filters
- [Resource Requirements](https://cookbook.chromadb.dev/core/resources/index.md) - Understand the resource requirements for running ChromaDB
- ✨[Multi-Tenancy](https://cookbook.chromadb.dev/strategies/multi-tenancy/index.md) - Learn how to implement multi-tenancy in ChromaDB

## Running ChromaDB

- [Deployment Patterns](https://cookbook.chromadb.dev/running/deployment-patterns/index.md) - Decide between embedded (`PersistentClient`) and standalone server (`HttpClient`) with copy/paste examples
- [CLI](https://cookbook.chromadb.dev/running/running-chroma/#chroma-cli) - Running ChromaDB via the CLI
- [Docker](https://cookbook.chromadb.dev/running/running-chroma/#docker) - Running ChromaDB in Docker
- [Docker Compose](https://cookbook.chromadb.dev/running/running-chroma/#docker-compose) - Running ChromaDB in Docker Compose
- [Kubernetes](https://cookbook.chromadb.dev/running/running-chroma/#minikube-with-helm-chart) - Running ChromaDB in Kubernetes (Minikube)

## Integrations

- ✨[LangChain](https://cookbook.chromadb.dev/integrations/langchain/index.md) - Integrating ChromaDB with LangChain
- ✨[LlamaIndex](https://cookbook.chromadb.dev/integrations/llamaindex/index.md) - Integrating ChromaDB with LlamaIndex
- ✨[Ollama](https://cookbook.chromadb.dev/integrations/ollama/index.md) - Integrating ChromaDB with Ollama

## The Ecosystem

### Clients

Below is a list of available clients for ChromaDB.

- [Python Client](https://cookbook.chromadb.dev/ecosystem/clients/#python) (Official Chroma client)
- [JavaScript Client](https://cookbook.chromadb.dev/ecosystem/clients/#javascript) (Official Chroma client)
- [Ruby Client](https://cookbook.chromadb.dev/ecosystem/clients/#ruby-client) (Community maintained)
- [Java Client](https://cookbook.chromadb.dev/ecosystem/clients/#java-client) (Community maintained)
- [Go Client](https://cookbook.chromadb.dev/ecosystem/clients/#go-client) (Community maintained)
- [C# Client](https://cookbook.chromadb.dev/ecosystem/clients/#c-client) (Microsoft maintained)
- [Rust Client](https://cookbook.chromadb.dev/ecosystem/clients/#rust-client) (Community maintained)
- [Elixir Client](https://cookbook.chromadb.dev/ecosystem/clients/#elixir-client) (Community maintained)
- [Dart Client](https://cookbook.chromadb.dev/ecosystem/clients/#dart-client) (Community maintained)
- [PHP Client](https://cookbook.chromadb.dev/ecosystem/clients/#php-client) (Community maintained)
- [PHP (Laravel)](https://cookbook.chromadb.dev/ecosystem/clients/#php-laravel-client) Client (Community maintained)

### User Interfaces

- [VectorAdmin](https://github.com/Mintplex-Labs/vector-admin) (MintPlex Labs) - An open-source web-based admin interface for vector databases, including ChromaDB
- [ChromaDB UI](https://github.com/thakkaryash94/chroma-ui) (Community maintained) - A web-based UI for ChromaDB
- [phpMyChroma](https://github.com/pari/phpMyChroma) (Community maintained) - A tiny PHP 8+ web client that allows you to browse Chroma and perform semantic search

### CLI Tooling

- [Chroma CLI](https://github.com/amikos-tech/chroma-cli) (Community maintained) - Early Alpha
- [Chroma Data Pipes](https://github.com/amikos-tech/chromadb-data-pipes) (Community maintained) - A CLI tool for importing and exporting data from ChromaDB
- [Chroma Ops](https://github.com/amikos-tech/chromadb-ops) (Community maintained) - A maintenance CLI tool for ChromaDB

## Strategies

- [Backup](https://cookbook.chromadb.dev/strategies/backup/index.md) - Backing up ChromaDB data
- [Batch Imports](https://cookbook.chromadb.dev/strategies/batching/index.md) - Importing data in batches
- [Multi-Tenancy](https://cookbook.chromadb.dev/strategies/multi-tenancy/index.md) - Running multiple ChromaDB instances
- [Keyword Search](https://cookbook.chromadb.dev/strategies/keyword-search/index.md) - Searching for keywords in ChromaDB
- [Memory Management](https://cookbook.chromadb.dev/strategies/memory-management/index.md) - Managing memory in ChromaDB
- [Time-based Queries](https://cookbook.chromadb.dev/strategies/time-based-queries/index.md) - Querying data based on timestamps
- ✨ `Coming Soon` Testing with Chroma - learn how to test your GenAI apps that include Chroma.
- ✨ `Coming Soon` Monitoring Chroma - learn how to monitor your Chroma instance.
- ✨ `Coming Soon` Building Chroma clients - learn how to build clients for Chroma.
- ✨ `Coming Soon` Creating the perfect Embedding Function (wrapper) - learn the best practices for creating your own embedding function.
- ✨ [Multi-User Basic Auth Plugin](https://cookbook.chromadb.dev/strategies/multi-tenancy/multi-user-basic-auth/index.md) - learn how to build a multi-user basic authentication plugin for Chroma.
- ✨ [CORS Configuration For JS Browser apps](https://cookbook.chromadb.dev/strategies/cors/index.md) - learn how to configure CORS for Chroma.
- ✨ [Running Chroma with SystemD](https://cookbook.chromadb.dev/running/systemd-service/index.md) - learn how to start Chroma upon system boot.

## Get Help

Missing something? Let us know by [opening an issue](https://github.com/amikos-tech/chroma-cookbook/issues/new), reach out on [Discord](https://discord.gg/MMeYNTmh3x) (look for `@taz`), or message us on [Twitter](https://twitter.com/AmikosTech).
