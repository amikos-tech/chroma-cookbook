# Keyword Search

This page covers local/OSS keyword filtering for collection `get()` and `query()` calls.
Use document filters (`where_document`) with `$contains` / `$not_contains` / `$regex` / `$not_regex`, optionally combined with metadata `where`, when you need semantic retrieval plus lexical constraints.
In Rust, the same behavior is expressed through the unified `Where` AST (for example `Where::Document(...)`).
Full-text matching is case-sensitive. For Cloud Search API hybrid ranking/fusion workflows, use the Cloud Search docs.

## Short Snippets

!!! note "Concept Snippets"

    The snippets below are intentionally small and may omit surrounding setup.
    Use the runnable examples for end-to-end scripts.

=== "Python"

    ```python
    results = collection.query(
        query_embeddings=[[0.15, 0.85, 0.25]],
        n_results=3,
        where_document={
            "$or": [
                {"$contains": "technology"},
                {"$contains": "freak"},
            ]
        },
    )
    ```

=== "TypeScript"

    ```typescript
    const results = await collection.query({
      queryEmbeddings: [[0.15, 0.85, 0.25]],
      nResults: 3,
      whereDocument: {
        $or: [{ $contains: "technology" }, { $contains: "freak" }],
      },
    });
    ```

=== "Go"

    ```go
    results, err := collection.Query(ctx,
      chroma.WithQueryEmbeddings(
        embeddings.NewEmbeddingFromFloat32([]float32{0.15, 0.85, 0.25}),
      ),
      chroma.WithNResults(3),
      chroma.WithWhereDocument(chroma.OrDocument(
        chroma.Contains("technology"),
        chroma.Contains("freak"),
      )),
    )
    ```

=== "Rust"

    Rust uses a unified `Where` AST for both metadata and document filters.

    ```rust
    let where_clause = Where::Composite(CompositeExpression {
        operator: BooleanOperator::Or,
        children: vec![
            Where::Document(DocumentExpression {
                operator: DocumentOperator::Contains,
                pattern: "technology".to_string(),
            }),
            Where::Document(DocumentExpression {
                operator: DocumentOperator::Contains,
                pattern: "freak".to_string(),
            }),
        ],
    });

    let results = collection
        .query(
            vec![vec![0.15, 0.85, 0.25]],
            Some(3),
            Some(where_clause),
            None,
            None,
        )
        .await?;
    ```

## Regex Filters

Use regex operators when substring matching is not expressive enough.

=== "Python"

    ```python
    regex_results = collection.query(
        query_embeddings=[[0.15, 0.85, 0.25]],
        n_results=3,
        where_document={"$regex": "technology.*pace"},
    )

    not_regex_results = collection.query(
        query_embeddings=[[0.15, 0.85, 0.25]],
        n_results=3,
        where_document={"$not_regex": "Innovation.*topic"},
    )
    ```

=== "TypeScript"

    ```typescript
    const regexResults = await collection.query({
      queryEmbeddings: [[0.15, 0.85, 0.25]],
      nResults: 3,
      whereDocument: { $regex: "technology.*pace" },
    });

    const notRegexResults = await collection.query({
      queryEmbeddings: [[0.15, 0.85, 0.25]],
      nResults: 3,
      whereDocument: { $not_regex: "Innovation.*topic" },
    });
    ```

=== "Go"

    ```go
    regexResults, err := collection.Query(ctx,
      chroma.WithQueryEmbeddings(
        embeddings.NewEmbeddingFromFloat32([]float32{0.15, 0.85, 0.25}),
      ),
      chroma.WithNResults(3),
      chroma.WithWhereDocument(chroma.Regex("technology.*pace")),
    )

    notRegexResults, err := collection.Query(ctx,
      chroma.WithQueryEmbeddings(
        embeddings.NewEmbeddingFromFloat32([]float32{0.15, 0.85, 0.25}),
      ),
      chroma.WithNResults(3),
      chroma.WithWhereDocument(chroma.NotRegex("Innovation.*topic")),
    )
    ```

=== "Rust"

    ```rust
    let regex_results = collection
        .query(
            vec![vec![0.15, 0.85, 0.25]],
            Some(3),
            Some(Where::Document(DocumentExpression {
                operator: DocumentOperator::Regex,
                pattern: "technology.*pace".to_string(),
            })),
            None,
            None,
        )
        .await?;

    let not_regex_results = collection
        .query(
            vec![vec![0.15, 0.85, 0.25]],
            Some(3),
            Some(Where::Document(DocumentExpression {
                operator: DocumentOperator::NotRegex,
                pattern: "Innovation.*topic".to_string(),
            })),
            None,
            None,
        )
        .await?;
    ```

## Composing Complex Queries

Use this canonical filter shape when you need semantic retrieval with richer document-text constraints:

```json
{
  "where_document": {
    "$and": [
      {
        "$or": [
          { "$contains": "technology" },
          { "$regex": "\\bAI\\b" }
        ]
      },
      {
        "$or": [
          { "$contains": "LLM" },
          { "$regex": "(GPU|CUDA)" }
        ]
      },
      { "$not_contains": "deprecated" },
      { "$not_regex": "(draft|obsolete)" }
    ]
  }
}
```

This expresses:

- `technology` substring OR exact-word `AI` regex.
- `LLM` substring OR `GPU`/`CUDA` regex.
- Excludes documents containing `deprecated`.
- Excludes documents matching `draft` or `obsolete` patterns.

Client mapping:

- Python: pass this object as `where_document=...`.
- TypeScript: pass as `whereDocument`.
- Go: map to `chroma.WithWhereDocument(...)`.
- Rust: express this with document nodes in the unified `Where` tree.

Hints:

- If you also pass metadata `where`, it is combined with `where_document` using an implicit `AND`.
- Use nested `$and`/`$or` in either clause to model richer logic.
- For debugging candidate selection, run `get(where=..., where_document=..., include=[])` first to inspect matching IDs before ranking.
- Keep `include` narrow to reduce payload size and response time.
- Full-text operators include contains/not-contains and regex/not-regex. In Rust these map to `DocumentOperator::{Contains, NotContains, Regex, NotRegex}`.
- Prefer anchored and specific regex patterns to avoid broad scans.

## Core References

- [Filters (`where` and `where_document` operators)](../core/filters.md)
- [Collections (`query` result shape, `include`, ID-constrained query)](../core/collections.md)
- [Concepts (search stages and query flow)](../core/concepts.md)
- [Advanced Queries (query-stage semantics and tradeoffs)](../core/advanced/queries.md)
- [Official Full Text Search docs](https://docs.trychroma.com/docs/querying-collections/full-text-search)

## Full Runnable Examples

All runnable examples assume a local Chroma server:

```bash
docker run --rm -p 8000:8000 chromadb/chroma:1.5.2
```

- [Overview and run commands](https://github.com/amikos-tech/chroma-cookbook/tree/main/examples/keyword-search)
- [Python](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/keyword-search/python/keyword_search.py)
- [TypeScript](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/keyword-search/typescript/keyword_search.ts)
- [Go](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/keyword-search/go/main.go)
- [Rust](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/keyword-search/rust/src/main.rs)
