# Metadata Schema Validation Examples

These examples show how to enforce metadata schema at the application layer before writing records to Chroma.
Each example includes helper functions for full roundtrip behavior:

- validate metadata in app layer
- insert one record
- read it back and re-validate typed metadata
- run a filtered `query` and parse top result metadata

All examples validate the same contract:

- `tenant_id`: required non-empty string
- `doc_type`: enum (`policy`, `faq`, `runbook`)
- `published`: boolean
- `priority`: integer in `[1, 5]`
- `quality_score`: float in `[0.0, 1.0]`

## Prerequisite

Run Chroma locally:

```bash
docker run --rm -p 8000:8000 chromadb/chroma:1.5.1
```

## Python (Pydantic)

```bash
cd examples/metadata-schema/python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python schema_validation.py
```

## TypeScript (Zod)

```bash
cd examples/metadata-schema/typescript
npm install
npm run start
```

## Go (go-playground/validator)

```bash
cd examples/metadata-schema/go
go run .
```

## Rust (serde + validator)

```bash
cd examples/metadata-schema/rust
cargo run
```
