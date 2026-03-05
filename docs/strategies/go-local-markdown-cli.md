# Go Local Markdown CLI with `PersistentClient`

This walkthrough highlights a new `chroma-go` capability: a **local in-process `PersistentClient`** that enables portable Go CLIs/tools without running a separate Chroma server or using Chroma Cloud.

The example is intentionally small, but shows a complete local retrieval loop:

1. `index <dir>`: read markdown files, chunk text, and upsert into local Chroma.
2. `search <query>`: query semantically, with optional metadata filters in a compact DSL (`key:value` or `<key:value>`).

## Why this example matters

- No external dependencies for vector storage/search.
- No API keys required.
- Great fit for local tools, dev assistants, and single-binary internal utilities.

!!! info "Requires `chroma-go` v0.4.0+"
    The `PersistentClient` API used in this example was introduced in [`chroma-go` v0.4.0](https://github.com/amikos-tech/chroma-go/releases/tag/v0.4.0).

## Implementation highlights

- CLI framework: [`cobra`](https://github.com/spf13/cobra)
- Markdown processing: [`goldmark`](https://github.com/yuin/goldmark)
- Chroma runtime: `NewPersistentClient(...)`
- Embeddings: `ort.NewDefaultEmbeddingFunction()` (`default_ef`, local)

## Run it

```bash
cd examples/persistent-cli/go
go mod tidy

go run . index ../sample-docs --reset

go run . search "incident response"
go run . search "incident response env:prod"
```

## Metadata filter DSL

Any `key:value` token in the query is interpreted as metadata filter and removed from semantic query text.

Examples:

- `incident response env:prod`
- `rollback checklist <team:platform>`

Under the hood, each filter maps to metadata `where` with equality (combined via `AND`).

## Going further

The word-window chunker in this example is intentionally simple. For production use cases consider more advanced strategies such as recursive or semantic chunking. [LangChainGo](https://tmc.github.io/langchaingo/docs/) provides ready-made text splitters that pair well with `chroma-go`.

## Source

- [Example README](https://github.com/amikos-tech/chroma-cookbook/tree/main/examples/persistent-cli)
- [Go source](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/persistent-cli/go/main.go)
