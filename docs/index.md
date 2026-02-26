# Home

This is a collection of small guides and recipes to help you get started with Chroma.

Latest ChromaDB version: [1.5.1](https://github.com/chroma-core/chroma/releases/tag/1.5.1)

<div class="api-changelog" markdown="1">

??? info "API Changelog (1.5.1 and 1.5.0)"

    **Version [1.5.1](https://github.com/chroma-core/chroma/releases/tag/1.5.1) (February 19, 2026)**

    | Area | API-facing change | Reference |
    |---|---|---|
    | Advanced Search | Removed beta label from Advanced Search API | [#6396](https://github.com/chroma-core/chroma/pull/6396) |
    | Collections | Reject `fork_collection` for multi-region databases | [#6400](https://github.com/chroma-core/chroma/pull/6400) |
    | Schema / FTS | Added option to disable FTS in schema | [#6214](https://github.com/chroma-core/chroma/pull/6214) |

    **Version [1.5.0](https://github.com/chroma-core/chroma/releases/tag/1.5.0) (February 9, 2026)**

    | Area | API-facing change | Reference |
    |---|---|---|
    | Search | Exported search options parameter | [#6160](https://github.com/chroma-core/chroma/pull/6160) |
    | Collections | Rust sysdb impl for `get collections` | [#6146](https://github.com/chroma-core/chroma/pull/6146) |
    | Collections | Rust sysdb impl for `get collection with segments` | [#6147](https://github.com/chroma-core/chroma/pull/6147) |
    | Collections | Rust sysdb impl for `update collection` | [#6163](https://github.com/chroma-core/chroma/pull/6163) |
    | Schema | Added option to enable quantization in schema | [#6295](https://github.com/chroma-core/chroma/pull/6295) |

</div>


## New and Noteworthy

- ✅ [Metadata Schema Validation](strategies/metadata-schema-validation.md) - Added app-layer metadata contract patterns with short snippets and runnable Python/TypeScript/Go/Rust examples - 📅`26-Feb-2026`
- 🧩 [Deployment Patterns](running/deployment-patterns.md) - Added two practical deployment walkthroughs: embed Chroma directly in a Python app, or run it as a standalone server and connect with `HttpClient` - 📅`24-Feb-2026`
- 📊 [Resource Requirements](core/resources.md) - Added an interactive sizing calculator, clearer RAM formulas, and explicit disk caveats for large documents and FTS index overhead - 📅`21-Feb-2026`
- 🚀 [Running Chroma](running/running-chroma.md) - Refreshed CLI/Docker/Compose/Minikube guidance, aligned Helm chart notes, and added collapsed optional YAML config examples - 📅`20-Feb-2026`
- 🧭 [Core Concepts](core/concepts.md) - Reworked into General vs Power Users tracks, with interactive local/distributed execution diagrams and data-flow visuals - 📅`19-Feb-2026`
- 🎯 [Collections Query IDs](core/collections.md#constrain-query-candidates-by-id) - Documented `query(..., ids=...)` for restricting similarity search to specific records - 📅`17-Feb-2026`
- 🔍 [Filters](core/filters.md) - Added multi-language filter examples and `$regex`/`$not_regex` operators - 📅`17-Feb-2026`
- 🔧 [Installation](core/install.md) - Updated package names and added Go/Rust install examples - 📅`17-Feb-2026`
- ⚒️ [Configuration](core/configuration.md) - Added 1.0 docs for HNSW, SPANN index, and embedding functions - 📅`17-Feb-2026`
- 📦 [Clients](core/clients.md#cloud-client) - Added Cloud Client section and updated client examples - 📅`17-Feb-2026`
- 📚 [Collections](core/collections.md) - Updated to current APIs with multi-language examples - 📅`17-Feb-2026`
- 🏷️ [Array Metadata Filters](core/filters.md#array-metadata) - Chroma 1.5.0 adds support for array metadata with `$contains`/`$not_contains` operators - 📅`17-Feb-2026`
- 🔑 [Authentication in Chroma v1.0.x](security/auth-1.0.x.md) - Chroma 1.0.x does not support native Authentication, in this article we cover how to secure your Chroma 1.0.x instance - 📅`28-May-2025`

## Getting Started

We suggest you first head to the [Concepts](core/concepts.md) section. It now has two tracks:

- [For General Users](core/concepts.md#for-general-users) - tenancy, collections, metadata, embeddings, and cloud data-flow basics
- [For Power Users](core/concepts.md#for-power-users) - local SQLite + HNSW path, distributed frontend dispatch path, and core internals

Once you're comfortable with the concepts, you can jump to the [Installation](core/install.md) section to install
ChromaDB.

**Core Topics:**

- [Filters](core/filters.md) - Learn to filter data in ChromaDB using metadata and document filters
- [Resource Requirements](core/resources.md) - Understand the resource requirements for running ChromaDB
- ✨[Multi-Tenancy](strategies/multi-tenancy/index.md) - Learn how to implement multi-tenancy in ChromaDB

## Running ChromaDB

- [Deployment Patterns](running/deployment-patterns.md) - Decide between embedded (`PersistentClient`) and standalone server (`HttpClient`) with copy/paste examples
- [CLI](running/running-chroma.md#chroma-cli) - Running ChromaDB via the CLI
- [Docker](running/running-chroma.md#docker) - Running ChromaDB in Docker
- [Docker Compose](running/running-chroma.md#docker-compose) - Running ChromaDB in Docker Compose
- [Kubernetes](running/running-chroma.md#minikube-with-helm-chart) - Running ChromaDB in Kubernetes (Minikube)

## Integrations

- ✨[LangChain](integrations/langchain/index.md) - Integrating ChromaDB with LangChain
- ✨[LlamaIndex](integrations/llamaindex/index.md) - Integrating ChromaDB with LlamaIndex
- ✨[Ollama](integrations/ollama/index.md) - Integrating ChromaDB with Ollama

## The Ecosystem

### Clients

Below is a list of available clients for ChromaDB.

- [Python Client](ecosystem/clients.md#python) (Official Chroma client)
- [JavaScript Client](ecosystem/clients.md#javascript) (Official Chroma client)
- [Ruby Client](ecosystem/clients.md#ruby-client) (Community maintained)
- [Java Client](ecosystem/clients.md#java-client) (Community maintained)
- [Go Client](ecosystem/clients.md#go-client) (Community maintained)
- [C# Client](ecosystem/clients.md#c-client) (Microsoft maintained)
- [Rust Client](ecosystem/clients.md#rust-client) (Community maintained)
- [Elixir Client](ecosystem/clients.md#elixir-client) (Community maintained)
- [Dart Client](ecosystem/clients.md#dart-client) (Community maintained)
- [PHP Client](ecosystem/clients.md#php-client) (Community maintained)
- [PHP (Laravel)](ecosystem/clients.md#php-laravel-client) Client (Community maintained)

### User Interfaces

- [VectorAdmin](https://github.com/Mintplex-Labs/vector-admin) (MintPlex Labs) - An open-source web-based admin
  interface for vector databases, including ChromaDB
- [ChromaDB UI](https://github.com/thakkaryash94/chroma-ui) (Community maintained) - A web-based UI for ChromaDB
- [phpMyChroma](https://github.com/pari/phpMyChroma) (Community maintained) - A tiny PHP 8+ web client that allows you to browse Chroma and perform semantic search

### CLI Tooling

- [Chroma CLI](https://github.com/amikos-tech/chroma-cli) (Community maintained) - Early Alpha
- [Chroma Data Pipes](https://github.com/amikos-tech/chromadb-data-pipes) (Community maintained) - A CLI tool for
  importing and exporting data from ChromaDB
- [Chroma Ops](https://github.com/amikos-tech/chromadb-ops) (Community maintained) - A maintenance CLI tool for ChromaDB

## Strategies

- [Backup](strategies/backup.md) - Backing up ChromaDB data
- [Batch Imports](strategies/batching.md) - Importing data in batches
- [Multi-Tenancy](strategies/multi-tenancy/index.md) - Running multiple ChromaDB instances
- [Keyword Search](strategies/keyword-search.md) - Searching for keywords in ChromaDB
- [Memory Management](strategies/memory-management.md) - Managing memory in ChromaDB
- [Metadata Schema Validation](strategies/metadata-schema-validation.md) - Enforcing metadata contracts in your app layer (Pydantic/Zod/Go validator/Rust validator)
- [Time-based Queries](strategies/time-based-queries.md) - Querying data based on timestamps
- ✨ `Coming Soon` Testing with Chroma - learn how to test your GenAI apps that include Chroma.
- ✨ `Coming Soon` Monitoring Chroma - learn how to monitor your Chroma instance.
- ✨ `Coming Soon` Building Chroma clients - learn how to build clients for Chroma.
- ✨ `Coming Soon` Creating the perfect Embedding Function (wrapper) - learn the best practices for creating your own
  embedding function.
- ✨ [Multi-User Basic Auth Plugin](strategies/multi-tenancy/multi-user-basic-auth.md) - learn how to build a multi-user
  basic authentication plugin for Chroma.
- ✨ [CORS Configuration For JS Browser apps](strategies/cors.md) - learn how to configure CORS for Chroma.
- ✨ [Running Chroma with SystemD](running/systemd-service.md) - learn how to start Chroma upon system boot.

## Get Help

Missing something? Let us know by [opening an issue](https://github.com/amikos-tech/chroma-cookbook/issues/new), reach
out on [Discord](https://discord.gg/MMeYNTmh3x) (look for `@taz`), or message us on
[Twitter](https://twitter.com/AmikosTech).
