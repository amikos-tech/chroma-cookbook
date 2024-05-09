# Welcome to ChromaDB Cookbook

This is a collection of small guides and recipes to help you get started with ChromaDB.

Latest ChromaDB version: [0.5.0](https://github.com/chroma-core/chroma/releases/tag/0.5.0)

## Getting Started

We suggest you first head to the [Concepts](core/concepts.md) section to get familiar with ChromaDB concepts, such as
Documents, Metadata, Embeddings, etc.

Once you're comfortable with the concepts, you can jump to the [Installation](core/install.md) section to install
ChromaDB.

**New and Noteworthy:**

- 🔥[Ollama Embeddings](integrations/ollama/embeddings.md) - We've enhanced the content to include information about
  Ollama embedding models with recommendations which models to use - 📅`9-May-2024`

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

### CLI Tooling

- [Chroma CLI](https://github.com/amikos-tech/chroma-cli) (Community maintained) - Early Alpha
- [Chroma Data Pipes](https://github.com/amikos-tech/chromadb-data-pipes) (Community maintained) - A CLI tool for
  importing and exporting data from ChromaDB
- [Chroma Ops](https://github.com/amikos-tech/chromadb-ops) (Community maintained) - A maintenance CLI tool for ChromaDB

## Strategies

- [Backup](strategies/backup.md) - Backing up ChromaDB data
- [Batch Imports](strategies/batching.md) - Importing data in batches
- [Multi-Tenancy](strategies/multi-tenancy.md) - Running multiple ChromaDB instances
- [Keyword Search](strategies/keyword-search.md) - Searching for keywords in ChromaDB
- [Memory Management](strategies/memory-management.md) - Managing memory in ChromaDB
- [Time-based Queries](strategies/time-based-queries.md) - Querying data based on timestamps
- ✨'`Coming Soon` Testing with Chroma - learn how to test your GenAI apps that include Chroma.
- ✨'`Coming Soon` Monitoring Chroma - learn how to monitor your Chroma instance.
- ✨'`Coming Soon` Building Chroma clients - learn how to build clients for Chroma.
- ✨'`Coming Soon` Creating the perfect Embedding Function (wrapper) - learn the best practices for creating your own
  embedding function.
- ✨ [Multi-User Basic Auth Plugin](strategies/multi-tenancy/multi-user-basic-auth.md) - learn how to build a multi-user
  basic authentication plugin for Chroma.
- ✨ [CORS Configuration For JS Browser apps](strategies/cors.md) - learn how to configure CORS for Chroma.

## Get Help

Missing something? Let us know by [opening an issue](https://github.com/amikos-tech/chroma-cookbook/issues/new), reach
out on [Discord](https://discord.gg/MMeYNTmh3x) (look for `@taz`).
