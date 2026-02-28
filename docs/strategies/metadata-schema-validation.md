# Metadata Schema Validation (Application Layer)

Chroma validates metadata value types, but it does not enforce a per-collection metadata contract.

If your app needs stable metadata shape (for example required keys, enums, ranges), enforce that before calling `add()` or `upsert()`.

## Shared Contract Used In Examples

The examples below all enforce the same metadata contract:

| Field | Type | Rule |
| --- | --- | --- |
| `tenant_id` | string | required, non-empty |
| `doc_type` | string | one of `policy`, `faq`, `runbook` |
| `published` | boolean | required |
| `priority` | integer | between `1` and `5` |
| `quality_score` | float | between `0.0` and `1.0` |

## Integration Blueprint

Use this as the default workflow when integrating schema enforcement into an app:

1. Define one metadata schema type per logical record family.
2. Centralize write/read helpers (`insert_validated_record`, `read_validated_record`) in your repository/service layer.
3. Route all write paths (`add`, `upsert`, ETL/backfill jobs) through the write helper.
4. Re-parse metadata from `get()` and `query()` responses into typed objects before downstream use.
5. Choose an explicit invalid-data policy (fail-fast or quarantine).

!!! tip "Where To Place This"

    Put these helpers where Chroma calls are centralized (repository/DAO/service).
    Avoid validating ad-hoc in controllers/handlers; that drifts quickly.

## Roundtrip Helper Pattern (Recommended)

In production code, wrap validation + persistence into helpers so all write paths are consistent.

=== "Python (Pydantic)"

    ```python
    def insert_validated_record(collection, record):
        validated = RecordMetadata.model_validate(record["metadata"])
        collection.add(
            ids=[record["id"]],
            documents=[record["document"]],
            embeddings=[record["embedding"]],
            metadatas=[validated.model_dump()],
        )

    def read_validated_record(collection, record_id):
        res = collection.get(ids=[record_id], include=["documents", "metadatas"])
        return RecordMetadata.model_validate(res["metadatas"][0])

    query_res = collection.query(
        query_embeddings=[[0.1, 0.2, 0.3]],
        n_results=3,
        where={"tenant_id": "acme"},
        include=["documents", "metadatas", "distances"],
    )
    ```

=== "TypeScript (Zod)"

    ```typescript
    const insertValidatedRecord = async (record: RawRecord) => {
      const validated = RecordMetadata.parse(record.metadata);
      await collection.add({
        ids: [record.id],
        documents: [record.document],
        embeddings: [record.embedding],
        metadatas: [validated],
      });
    };

    const readValidatedRecord = async (id: string) => {
      const res = await collection.get({ ids: [id], include: ["documents", "metadatas"] });
      return RecordMetadata.parse(res.metadatas?.[0]);
    };

    const queryRes = await collection.query({
      queryEmbeddings: [[0.1, 0.2, 0.3]],
      nResults: 3,
      where: { tenant_id: "acme" },
      include: ["documents", "metadatas", "distances"],
    });
    ```

=== "Go (go-playground/validator)"

    ```go
    insertValidatedRecord := func(record RawRecord) error {
      meta, _ := decodeMetadata(record.Metadata)
      if err := validate.Struct(meta); err != nil { return err }
      return collection.Add(ctx,
        chroma.WithIDs(chroma.DocumentID(record.ID)),
        chroma.WithTexts(record.Document),
        chroma.WithEmbeddings(embeddings.NewEmbeddingFromFloat32(record.Embedding)),
        chroma.WithMetadatas(toChromaMetadata(meta)),
      )
    }

    readValidatedRecord := func(id chroma.DocumentID) (RecordMetadata, error) {
      res, _ := collection.Get(ctx, chroma.WithIDs(id), chroma.WithInclude(chroma.IncludeDocuments, chroma.IncludeMetadatas))
      return parseMetadataFromChroma(res.GetMetadatas()[0], validate)
    }
    ```

    Parsing note:
    When reading metadata back, treat numeric fields defensively (`GetInt` first, then optional `GetFloat` fallback for whole-number values) before re-validating.

=== "Rust (serde + validator)"

    ```rust
    async fn insert_validated_record(collection: &chroma::ChromaCollection, record: &RawRecord) {
        let metadata: RecordMetadata = serde_json::from_value(record.metadata.clone())?;
        metadata.validate()?;
        collection.add(/* id + embedding + doc + validated metadata */).await?;
    }

    async fn read_validated_record(collection: &chroma::ChromaCollection, id: &str) {
        let response = collection.get(Some(vec![id.to_string()]), None, Some(1), Some(0), None).await?;
        let metadata = response.metadatas.unwrap()[0].as_ref().unwrap();
        let typed = parse_metadata_from_chroma(metadata)?;
    }
    ```

## Failure Policy Templates

Use one of these policies explicitly.

### Fail-Fast

Reject invalid records immediately and return an error to caller.

```python
try:
    validated = RecordMetadata.model_validate(raw_metadata)
except ValidationError as exc:
    raise ValueError(f"invalid metadata: {exc}")
```

### Quarantine

Store invalid payloads separately (for review/replay) and continue pipeline.

```python
try:
    validated = RecordMetadata.model_validate(raw_metadata)
except ValidationError as exc:
    quarantine_store.write({"raw": raw_metadata, "errors": exc.errors()})
    return  # skip write to Chroma
```

## Short Snippets (Concept-Only)

!!! note "Concept Snippets"

    The snippets below are intentionally minimal and may omit surrounding setup.
    Use the runnable examples for copy/paste-ready flows.

=== "Python (Pydantic)"

    ```python
    from typing import Literal
    from pydantic import BaseModel, Field

    class RecordMetadata(BaseModel):
        tenant_id: str = Field(min_length=1)
        doc_type: Literal["policy", "faq", "runbook"]
        published: bool
        priority: int = Field(ge=1, le=5)
        quality_score: float = Field(ge=0.0, le=1.0)

    validated = RecordMetadata.model_validate(raw_metadata).model_dump()
    collection.add(ids=["doc-1"], embeddings=[[0.1, 0.2, 0.3]], metadatas=[validated])
    ```

=== "TypeScript (Zod)"

    ```typescript
    import { z } from "zod";

    const RecordMetadata = z.object({
      tenant_id: z.string().min(1),
      doc_type: z.enum(["policy", "faq", "runbook"]),
      published: z.boolean(),
      priority: z.number().int().min(1).max(5),
      quality_score: z.number().min(0).max(1),
    }).strict();

    const validated = RecordMetadata.parse(rawMetadata);
    await collection.add({
      ids: ["doc-1"],
      embeddings: [[0.1, 0.2, 0.3]],
      metadatas: [validated],
    });
    ```

    Runtime note:
    If you use the JS client with server-side default embedding-function metadata, include `@chroma-core/default-embed` in dependencies.

=== "Go (go-playground/validator)"

    ```go
    type RecordMetadata struct {
      TenantID     string  `validate:"required,min=1"`
      DocType      string  `validate:"required,oneof=policy faq runbook"`
      Published    bool
      Priority     int64   `validate:"gte=1,lte=5"`
      QualityScore float64 `validate:"gte=0,lte=1"`
    }

    validate := validator.New()
    if err := validate.Struct(meta); err != nil {
      return err
    }
    ```

=== "Rust (serde + validator)"

    ```rust
    #[derive(Deserialize, Validate)]
    struct RecordMetadata {
        #[validate(length(min = 1))]
        tenant_id: String,
        doc_type: DocType,
        published: bool,
        #[validate(range(min = 1, max = 5))]
        priority: i64,
        #[validate(range(min = 0.0, max = 1.0))]
        quality_score: f64,
    }

    let metadata: RecordMetadata = serde_json::from_value(raw)?;
    metadata.validate()?;
    ```

## Full Runnable Examples

All runnable examples assume a local Chroma server:

```bash
docker run --rm -p 8000:8000 chromadb/chroma:1.5.2
```

- [Overview and run commands](https://github.com/amikos-tech/chroma-cookbook/tree/main/examples/metadata-schema)
- [Python + Pydantic](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/metadata-schema/python/schema_validation.py)
- [TypeScript + Zod](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/metadata-schema/typescript/schema_validation.ts)
- [Go + validator](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/metadata-schema/go/main.go)
- [Rust + serde/validator](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/metadata-schema/rust/src/main.rs)

## Schema Evolution

Both validation strategies are valid:

1. Typed-model source of truth (`pydantic`/`zod`/Go validators/Rust validators).
2. JSON-Schema source of truth (portable and reusable across languages).

Schema evolution is the versioning/governance layer and works with either strategy.

If metadata contracts change over time, add a `schema_version` field and evolve intentionally.

1. Write new records with latest `schema_version`.
2. Read old records by version and normalize before business logic.
3. Backfill old records when practical.

### Versioning In Collection Metadata

You can also keep the active schema version in **collection metadata** so every writer/reader can discover it.

```python
import json

SCHEMA_V2 = {
    "type": "object",
    "properties": {
        "tenant_id": {"type": "string", "minLength": 1},
        "doc_type": {"enum": ["policy", "faq", "runbook"]},
        "published": {"type": "boolean"},
        "priority": {"type": "integer", "minimum": 1, "maximum": 5},
        "quality_score": {"type": "number", "minimum": 0, "maximum": 1},
    },
    "required": ["tenant_id", "doc_type", "published", "priority", "quality_score"],
}

collection = client.get_or_create_collection(
    "support_docs",
    metadata={
        "metadata_schema_name": "support_docs",
        "metadata_schema_version": 2,
        "metadata_schema_json": json.dumps(SCHEMA_V2),  # optional
    },
)
```

!!! note "Collection Metadata Update Behavior"

    `collection.modify(metadata=...)` overwrites collection metadata.
    Read + merge existing keys before writing updates.

### Loading Schema From JSON Stored As Metadata String

Yes. This is supported because collection metadata values can be strings.

```python
import json
from jsonschema import Draft202012Validator

raw = collection.metadata.get("metadata_schema_json")
if raw is not None:
    validator = Draft202012Validator(json.loads(raw))
    validator.validate(candidate_metadata)
```

### Complexity Tradeoff

- For small teams/single service: storing schema JSON in collection metadata can be fine.
- As systems grow (multiple services, bigger schemas, stricter governance): prefer storing `schema_name` + `schema_version` + optional `schema_hash` in collection metadata, and keep full schemas in a code repo or schema registry.
- If JSON Schema is your source of truth, consider generating typed models from it to keep runtime portability plus language-level ergonomics.

## Practical Guidance

- Validate on every write path (`add`, `upsert`, update jobs).
- Decide policy explicitly: fail-fast or quarantine.
- Pick one primary source of truth for the contract (typed models or JSON Schema) and avoid unmanaged dual-authoring drift.
- Keep filter-critical fields (e.g., `tenant_id`, `doc_type`, flags) strongly typed to avoid inconsistent query behavior.
- Re-parse and re-validate metadata after `get()`/`query()` if your app relies on strict typed contracts.
