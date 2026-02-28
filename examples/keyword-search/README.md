# Keyword Search Examples

These examples demonstrate keyword-constrained retrieval with Chroma document filters (`where_document`).
Each example:

- seeds 3 records
- applies keyword filters (`$contains`, `$regex`, `$not_regex`)
- prints matching IDs/documents/metadata

## Prerequisite

Run Chroma locally:

```bash
docker run --rm -p 8000:8000 chromadb/chroma:1.5.2
```

## Python

```bash
cd examples/keyword-search/python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python keyword_search.py
```

## TypeScript

```bash
cd examples/keyword-search/typescript
npm install
npm run start
```

## Go

```bash
cd examples/keyword-search/go
go run .
```

## Rust

```bash
cd examples/keyword-search/rust
cargo run
```
