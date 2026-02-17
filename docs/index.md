# Get Cooking

This is a collection of small guides and recipes to help you get started with Chroma.

!!! note "Chroma 1.0"

    New updated content for Chroma 1.0.x is coming soon. Official announcement [here](https://trychroma.com/project/1.0.0).

    It is the goal of this site to make your Chroma experience as pleasant as possible regardless of your technical expertise.

Latest ChromaDB version: [1.5.0](https://github.com/chroma-core/chroma/releases/tag/1.5.0)


## New and Noteworthy

- 🏷️ [Array Metadata Filters](core/filters.md#array-metadata) - Chroma 1.5.0 adds support for array metadata with `$contains`/`$not_contains` operators - 📅`17-Feb-2026`
- 🔑 [Authentication in Chroma v1.0.x](security/auth-1.0.x.md) - Chroma 1.0.x does not support native Authentication, in this article we cover how to secure your Chroma 1.0.x instance - 📅`28-May-2025`
- ☁️ [Chroma Chart](https://github.com/amikos-tech/chromadb-chart) - We've released a new Chroma chart version that now supports Chroma 1.0.x or later. Go check it out! - 📅`23-May-2025`
- 🔍 [Filters](core/filters.md) - New and improved guide to filtering.
- 🔄 [Chroma Maintenance](running/maintenance.md) - Learn how to keep your Chroma database in tip-top shape - 📅`08-Feb-2025`
- ⚒️ [Configuration](core/configuration.md) - Updated descriptions and added examples of Chroma configuration options - 📅`21-Nov-2024`
- 🏎️ [Performance Tips](running/performance-tips.md) - Learn how to optimize the performance of yourChroma - 📅`16-Oct-2024`
- ⁉️[FAQs](faq/index.md) - Updated FAQ sections - 📅`15-Oct-2024`
- 🔥 [SSL-Terminating Proxies](security/ssl-proxies.md) - Learn how to secure Chroma server with `Envoy` or `Nginx` proxies - 📅`31-Jul-2024`
- 🗑️ [WAL Pruning](core/advanced/wal-pruning.md#chroma-cli) - Learn how to prune (cleanup) your Chroma database (WAL) with Chroma's built-in CLI `vacuum` command - 📅`30-Jul-2024`
- ✨ [Multi-Category Filtering](strategies/multi-category-filters.md) - Learn how to filter data based on multiple categories - 📅`15-Jul-2024`
- 🔒 [Chroma Auth](security/auth.md) - Learn how to secure your Chroma deployment with Authentication - 📅`11-Jul-2024`
- 📦 [Async Http Client](core/clients.md#http-client) - Chroma now supports async HTTP clients - 📅`19-Jun-2024`
- 🔒 [Security](security/index.md) - Learn how to secure your Chroma deployment - 📅`13-Jun-2024`
- 🔧 [Installation](core/install.md) - Learn about the different ways to install Chroma - 📅`08-Jun-2024`
- 🧠 [Memory Management](strategies/memory-management.md) - Learn how to manage memory in ChromaDB - 📅`30-May-2024`
- 📐 [Resource Requirements](core/resources.md) - Recently updated with temporary storage requirements - 📅`28-May-2024`

## Getting Started

We suggest you first head to the [Concepts](core/concepts.md) section to get familiar with ChromaDB concepts, such as
Documents, Metadata, Embeddings, etc.

Once you're comfortable with the concepts, you can jump to the [Installation](core/install.md) section to install
ChromaDB.

**Core Topics:**

- [Filters](core/filters.md) - Learn to filter data in ChromaDB using metadata and document filters
- [Resource Requirements](core/resources.md) - Understand the resource requirements for running ChromaDB
- ✨[Multi-Tenancy](strategies/multi-tenancy/index.md) - Learn how to implement multi-tenancy in ChromaDB

## Running ChromaDB

- [CLI](running/running-chroma.md#chroma-cli) - Running ChromaDB via the CLI
- [Docker](running/running-chroma.md#docker) - Running ChromaDB in Docker
- [Docker Compose](running/running-chroma.md#docker-compose-cloned-repo) - Running ChromaDB in Docker Compose
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
- [Time-based Queries](strategies/time-based-queries.md) - Querying data based on timestamps
- ✨ `Coming Soon` Testing with Chroma - learn how to test your GenAI apps that include Chroma.
- ✨ `Coming Soon` Monitoring Chroma - learn how to monitor your Chroma instance.
- ✨ `Coming Soon` Building Chroma clients - learn how to build clients for Chroma.
- ✨ `Coming Soon` Creating the perfect Embedding Function (wrapper) - learn the best practices for creating your own
  embedding function.
- ✨ [Multi-User Basic Auth Plugin](strategies/multi-tenancy/multi-user-basic-auth.md) - learn how to build a multi-user
  basic authentication plugin for Chroma.
- ✨ [CORS Configuration For JS Browser apps](strategies/cors.md) - learn how to configure CORS for Chroma.
- ✨ [Running Chroma with SystemD](strategies/systemd-service.md) - learn how to start Chroma upon system boot.

## Get Help

Missing something? Let us know by [opening an issue](https://github.com/amikos-tech/chroma-cookbook/issues/new), reach
out on [Discord](https://discord.gg/MMeYNTmh3x) (look for `@taz`).
