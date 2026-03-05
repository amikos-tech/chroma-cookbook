# Persistent Local Markdown CLI (Go + Cobra)

This example shows a small but practical local-first CLI powered by:

- `chroma-go` `PersistentClient` (in-process, no external Chroma server)
- `default_ef` (`ort.NewDefaultEmbeddingFunction`) for fully local embeddings
- `cobra` for `index` and `search` commands
- `goldmark` for markdown processing

## What it does

1. `index <dir>`
- walks markdown files recursively
- extracts optional YAML front matter (for metadata)
- chunks text into overlapping word windows
- upserts chunks into local Chroma

2. `search <query>`
- runs semantic search over indexed chunks
- supports inline metadata filter DSL: `key:value` or `<key:value>`

## Run

```bash
cd examples/persistent-cli/go
go mod tidy

go run . index ../sample-docs --reset

go run . search "incident response"
go run . search "incident response env:prod"
go run . search "deployment checklist <team:platform>"
```

## Notes

- Requires [`chroma-go`](https://github.com/amikos-tech/chroma-go) **v0.4.0** or later.
- Everything is local. No API keys are required.
- Data persists under `--persist-path` (default: `./chroma_data`).
- First run may download local runtime artifacts used by the embedded stack/default EF.
- The filter DSL treats any `key:value` token as a metadata filter. Tokens that look like URLs (e.g. `http://...`) are ignored.
- For more advanced chunking strategies (recursive, semantic, etc.) see [LangChainGo](https://tmc.github.io/langchaingo/docs/).
