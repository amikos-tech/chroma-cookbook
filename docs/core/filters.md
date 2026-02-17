# Filters

Chroma provides two types of filters:

- Metadata - filter documents based on metadata using `where` clause in either `Collection.query()` or `Collection.get()`
- Document - filter documents based on document content using `where_document` in `Collection.query()` or `Collection.get()`.

Those familiar with MongoDB queries will find Chroma's filters very similar.

!!! tip "Runnable Examples"

    Complete, runnable filtering examples for each language are available in the [examples/filtering](https://github.com/chroma-core/chroma-cookbook/tree/main/examples/filtering) directory:

    - [Python](https://github.com/chroma-core/chroma-cookbook/blob/main/examples/filtering/python/filter_examples.py)
    - [TypeScript](https://github.com/chroma-core/chroma-cookbook/blob/main/examples/filtering/typescript/filter_examples.ts)
    - [Go](https://github.com/chroma-core/chroma-cookbook/blob/main/examples/filtering/go/main.go)
    - [Rust](https://github.com/chroma-core/chroma-cookbook/blob/main/examples/filtering/rust/src/main.rs)

## Metadata Filters

### Schema

You can use the following JSON schema to validate your `where` filters:

```json
{
    "$schema": "https://json-schema.org/draft/2020-12/schema#",
    "title": "Chroma Metadata Where Filter Schema",
    "description": "Schema for Chroma metadata filters used in where clauses",
    "oneOf": [
        {
            "type": "object",
            "patternProperties": {
                "^[^$].*$": {
                    "oneOf": [
                        {
                            "type": ["string", "number", "boolean"]
                        },
                        {
                            "type": "object",
                            "properties": {
                                "$eq": {"type": ["string", "number", "boolean"]},
                                "$ne": {"type": ["string", "number", "boolean"]},
                                "$gt": {"type": "number"},
                                "$gte": {"type": "number"},
                                "$lt": {"type": "number"},
                                "$lte": {"type": "number"},
                                "$in": {
                                  "oneOf": [
                                    {
                                      "type": "array",
                                      "items": { "type": "string" },
                                      "minItems": 1
                                    },
                                    {
                                      "type": "array",
                                      "items": { "type": "number" },
                                      "minItems": 1
                                    },
                                    {
                                      "type": "array",
                                      "items": { "type": "boolean" },
                                      "minItems": 1
                                    }
                                  ]
                                },
                                "$nin": {
                                  "oneOf": [
                                    {
                                      "type": "array",
                                      "items": { "type": "string" },
                                      "minItems": 1
                                    },
                                    {
                                      "type": "array",
                                      "items": { "type": "number" },
                                      "minItems": 1
                                    },
                                    {
                                      "type": "array",
                                      "items": { "type": "boolean" },
                                      "minItems": 1
                                    }
                                  ]
                                },
                                "$contains": {"type": ["string", "number", "boolean"]},
                                "$not_contains": {"type": ["string", "number", "boolean"]}
                            },
                            "additionalProperties": false,
                            "minProperties": 1,
                            "maxProperties": 1
                        }
                    ]
                }
            },
            "minProperties": 1
        },
        {
            "type": "object",
            "properties": {
                "$and": {
                    "type": "array",
                    "items": {"$ref": "#"},
                    "minItems": 2
                },
                "$or": {
                    "type": "array",
                    "items": {"$ref": "#"},
                    "minItems": 2
                }
            },
            "additionalProperties": false,
            "minProperties": 1,
            "maxProperties": 1
        }
    ]
}
```


### Equality (`$eq`)

This filter matches attribute values that equal to a specified string, boolean, integer or float value. The value check is case-sensitive.

Supported value types are:  `string`, `boolean`, `integer` or `float` (or `number` in JS/TS)

Simple equality:

??? note "Single condition"

    If you are using simple equality expression `{"metadata_field": "is_equal_to_this"}`, you can only specify a single condition.

=== "Python"

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where={"metadata_field": "is_equal_to_this"}
    )
    ```

=== "TypeScript"

    ```typescript
    const results = await collection.query({
        queryTexts: ["This is a query document"],
        nResults: 2,
        where: { metadata_field: "is_equal_to_this" },
    });
    ```

=== "Go"

    ```go
    results, _ := collection.Query(ctx,
        chroma.WithQueryTexts("This is a query document"),
        chroma.WithNResults(2),
        chroma.WithWhere(chroma.EqString("metadata_field", "is_equal_to_this")),
    )
    ```

=== "Rust"

    ```rust
    let results = collection.get(
        None,
        Some(Where::Metadata(MetadataExpression {
            key: "metadata_field".to_string(),
            comparison: MetadataComparison::Primitive(
                PrimitiveOperator::Equal,
                MetadataValue::Str("is_equal_to_this".to_string()),
            ),
        })),
        None, None, None,
    ).await?;
    ```

Alternative syntax:

=== "Python"

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where={"metadata_field": {"$eq": "is_equal_to_this"}}
    )
    ```

=== "TypeScript"

    ```typescript
    const results = await collection.query({
        queryTexts: ["This is a query document"],
        nResults: 2,
        where: { metadata_field: { $eq: "is_equal_to_this" } },
    });
    ```

=== "Go"

    ```go
    results, _ := collection.Query(ctx,
        chroma.WithQueryTexts("This is a query document"),
        chroma.WithNResults(2),
        chroma.WithWhere(chroma.EqString("metadata_field", "is_equal_to_this")),
    )
    ```

=== "Rust"

    ```rust
    let results = collection.get(
        None,
        Some(Where::Metadata(MetadataExpression {
            key: "metadata_field".to_string(),
            comparison: MetadataComparison::Primitive(
                PrimitiveOperator::Equal,
                MetadataValue::Str("is_equal_to_this".to_string()),
            ),
        })),
        None, None, None,
    ).await?;
    ```

??? note "Validation Failures"

    When validation fails, similar to this message is expected to be returned by Chroma - `ValueError: Expected where value to be a str, int, float, or operator expression, got X in get.` with `X` refering to the inferred type of the data.

### Inequality (`$ne`)

This filter matches attribute values that are not equal to a specified string, boolean, integer or float value. The value check is case-sensitive.

Supported value types are:  `string`, `boolean`, `integer` or `float` (or `number` in JS/TS)

=== "Python"

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where={"metadata_field": {"$ne": "is_not_equal_to_this"}}
    )
    ```

=== "TypeScript"

    ```typescript
    const results = await collection.query({
        queryTexts: ["This is a query document"],
        nResults: 2,
        where: { metadata_field: { $ne: "is_not_equal_to_this" } },
    });
    ```

=== "Go"

    ```go
    results, _ := collection.Query(ctx,
        chroma.WithQueryTexts("This is a query document"),
        chroma.WithNResults(2),
        chroma.WithWhere(chroma.NotEqString("metadata_field", "is_not_equal_to_this")),
    )
    ```

=== "Rust"

    ```rust
    let results = collection.get(
        None,
        Some(Where::Metadata(MetadataExpression {
            key: "metadata_field".to_string(),
            comparison: MetadataComparison::Primitive(
                PrimitiveOperator::NotEqual,
                MetadataValue::Str("is_not_equal_to_this".to_string()),
            ),
        })),
        None, None, None,
    ).await?;
    ```

### Greater Than (`$gt`)

This filter matches attribute values that are strictly greater than a specified numeric (`integer` or `float`) value.

!!! note "Greater Than"

    The `$gt` operator is only supported for numerical values - int or float values.

=== "Python"

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where={"metadata_field": {"$gt": 5}}
    )
    ```

=== "TypeScript"

    ```typescript
    const results = await collection.query({
        queryTexts: ["This is a query document"],
        nResults: 2,
        where: { metadata_field: { $gt: 5 } },
    });
    ```

=== "Go"

    ```go
    results, _ := collection.Query(ctx,
        chroma.WithQueryTexts("This is a query document"),
        chroma.WithNResults(2),
        chroma.WithWhere(chroma.GtInt("metadata_field", 5)),
    )
    ```

=== "Rust"

    ```rust
    let results = collection.get(
        None,
        Some(Where::Metadata(MetadataExpression {
            key: "metadata_field".to_string(),
            comparison: MetadataComparison::Primitive(
                PrimitiveOperator::GreaterThan,
                MetadataValue::Int(5),
            ),
        })),
        None, None, None,
    ).await?;
    ```

### Greater Than or Equal (`$gte`)

This filter matches attribute values that are greater than or equal a specified numeric (`integer` or `float`) value.

!!! note "Greater Than or Equal"

    The `$gte` operator is only supported for numerical values - int or float values.

=== "Python"

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where={"metadata_field": {"$gte": 5.1}}
    )
    ```

=== "TypeScript"

    ```typescript
    const results = await collection.query({
        queryTexts: ["This is a query document"],
        nResults: 2,
        where: { metadata_field: { $gte: 5.1 } },
    });
    ```

=== "Go"

    ```go
    results, _ := collection.Query(ctx,
        chroma.WithQueryTexts("This is a query document"),
        chroma.WithNResults(2),
        chroma.WithWhere(chroma.GteFloat("metadata_field", 5.1)),
    )
    ```

=== "Rust"

    ```rust
    let results = collection.get(
        None,
        Some(Where::Metadata(MetadataExpression {
            key: "metadata_field".to_string(),
            comparison: MetadataComparison::Primitive(
                PrimitiveOperator::GreaterThanOrEqual,
                MetadataValue::Float(5.1),
            ),
        })),
        None, None, None,
    ).await?;
    ```

### Less Than (`$lt`)

This filter matches attribute values that are less than specified numeric (`integer` or `float`) value.

Supported values: `integer` or `float`

=== "Python"

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where={"metadata_field": {"$lt": 5}}
    )
    ```

=== "TypeScript"

    ```typescript
    const results = await collection.query({
        queryTexts: ["This is a query document"],
        nResults: 2,
        where: { metadata_field: { $lt: 5 } },
    });
    ```

=== "Go"

    ```go
    results, _ := collection.Query(ctx,
        chroma.WithQueryTexts("This is a query document"),
        chroma.WithNResults(2),
        chroma.WithWhere(chroma.LtInt("metadata_field", 5)),
    )
    ```

=== "Rust"

    ```rust
    let results = collection.get(
        None,
        Some(Where::Metadata(MetadataExpression {
            key: "metadata_field".to_string(),
            comparison: MetadataComparison::Primitive(
                PrimitiveOperator::LessThan,
                MetadataValue::Int(5),
            ),
        })),
        None, None, None,
    ).await?;
    ```

### Less Than or Equal (`$lte`)

This filter matches attribute values that are less than or equal specified numeric (`integer` or `float`) value.

Supported values: `integer` or `float`

=== "Python"

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where={"metadata_field": {"$lte": 5.1}}
    )
    ```

=== "TypeScript"

    ```typescript
    const results = await collection.query({
        queryTexts: ["This is a query document"],
        nResults: 2,
        where: { metadata_field: { $lte: 5.1 } },
    });
    ```

=== "Go"

    ```go
    results, _ := collection.Query(ctx,
        chroma.WithQueryTexts("This is a query document"),
        chroma.WithNResults(2),
        chroma.WithWhere(chroma.LteFloat("metadata_field", 5.1)),
    )
    ```

=== "Rust"

    ```rust
    let results = collection.get(
        None,
        Some(Where::Metadata(MetadataExpression {
            key: "metadata_field".to_string(),
            comparison: MetadataComparison::Primitive(
                PrimitiveOperator::LessThanOrEqual,
                MetadataValue::Float(5.1),
            ),
        })),
        None, None, None,
    ).await?;
    ```

### In (`$in`)

This filter matches attribute values that are in the given list of values.

Supported value types are:  `string`, `boolean`, `integer` or `float` (or `number` in JS/TS)

!!! note "In"

    The `$in` operator is only supported for list of values of the same type.

=== "Strings"

    === "Python"

        ```python
        results = collection.query(
            query_texts=["This is a query document"],
            n_results=2,
            where={"metadata_field": {"$in": ["value1", "value2"]}}
        )
        ```

    === "TypeScript"

        ```typescript
        const results = await collection.query({
            queryTexts: ["This is a query document"],
            nResults: 2,
            where: { metadata_field: { $in: ["value1", "value2"] } },
        });
        ```

    === "Go"

        ```go
        results, _ := collection.Query(ctx,
            chroma.WithQueryTexts("This is a query document"),
            chroma.WithNResults(2),
            chroma.WithWhere(chroma.InString("metadata_field", "value1", "value2")),
        )
        ```

    === "Rust"

        ```rust
        let results = collection.get(
            None,
            Some(Where::Metadata(MetadataExpression {
                key: "metadata_field".to_string(),
                comparison: MetadataComparison::Set(
                    SetOperator::In,
                    MetadataSetValue::Str(vec!["value1".into(), "value2".into()]),
                ),
            })),
            None, None, None,
        ).await?;
        ```

=== "Integers"

    === "Python"

        ```python
        results = collection.query(
            query_texts=["This is a query document"],
            n_results=2,
            where={"metadata_field": {"$in": [1, 2, 3]}}
        )
        ```

    === "TypeScript"

        ```typescript
        const results = await collection.query({
            queryTexts: ["This is a query document"],
            nResults: 2,
            where: { metadata_field: { $in: [1, 2, 3] } },
        });
        ```

    === "Go"

        ```go
        results, _ := collection.Query(ctx,
            chroma.WithQueryTexts("This is a query document"),
            chroma.WithNResults(2),
            chroma.WithWhere(chroma.InInt("metadata_field", 1, 2, 3)),
        )
        ```

    === "Rust"

        ```rust
        let results = collection.get(
            None,
            Some(Where::Metadata(MetadataExpression {
                key: "metadata_field".to_string(),
                comparison: MetadataComparison::Set(
                    SetOperator::In,
                    MetadataSetValue::Int(vec![1, 2, 3]),
                ),
            })),
            None, None, None,
        ).await?;
        ```

=== "Invalid Example"

    ```python
    # All values in $in must be the same type - this will fail
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where={"metadata_field": {"$in": [1, "2", 1.1]}}
    )
    ```

### Not In (`$nin`)

This filter matches attribute that do not have the given key or the values of which are not in the given list of values.

Supported value types are:  `string`, `boolean`, `integer` or `float` (or `number` in JS/TS)

!!! note "Not In"

    The `$nin` operator is only supported for list of values of the same type.

=== "Strings"

    === "Python"

        ```python
        results = collection.query(
            query_texts=["This is a query document"],
            n_results=2,
            where={"metadata_field": {"$nin": ["value1", "value2"]}}
        )
        ```

    === "TypeScript"

        ```typescript
        const results = await collection.query({
            queryTexts: ["This is a query document"],
            nResults: 2,
            where: { metadata_field: { $nin: ["value1", "value2"] } },
        });
        ```

    === "Go"

        ```go
        results, _ := collection.Query(ctx,
            chroma.WithQueryTexts("This is a query document"),
            chroma.WithNResults(2),
            chroma.WithWhere(chroma.NinString("metadata_field", "value1", "value2")),
        )
        ```

    === "Rust"

        ```rust
        let results = collection.get(
            None,
            Some(Where::Metadata(MetadataExpression {
                key: "metadata_field".to_string(),
                comparison: MetadataComparison::Set(
                    SetOperator::NotIn,
                    MetadataSetValue::Str(vec!["value1".into(), "value2".into()]),
                ),
            })),
            None, None, None,
        ).await?;
        ```

=== "Integers"

    === "Python"

        ```python
        results = collection.query(
            query_texts=["This is a query document"],
            n_results=2,
            where={"metadata_field": {"$nin": [1, 2, 3]}}
        )
        ```

    === "TypeScript"

        ```typescript
        const results = await collection.query({
            queryTexts: ["This is a query document"],
            nResults: 2,
            where: { metadata_field: { $nin: [1, 2, 3] } },
        });
        ```

    === "Go"

        ```go
        results, _ := collection.Query(ctx,
            chroma.WithQueryTexts("This is a query document"),
            chroma.WithNResults(2),
            chroma.WithWhere(chroma.NinInt("metadata_field", 1, 2, 3)),
        )
        ```

    === "Rust"

        ```rust
        let results = collection.get(
            None,
            Some(Where::Metadata(MetadataExpression {
                key: "metadata_field".to_string(),
                comparison: MetadataComparison::Set(
                    SetOperator::NotIn,
                    MetadataSetValue::Int(vec![1, 2, 3]),
                ),
            })),
            None, None, None,
        ).await?;
        ```

=== "Invalid Example"

    ```python
    # All values in $nin must be the same type - this will fail
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where={"metadata_field": {"$nin": [1, "2", 1.1]}}
    )
    ```

### Array Metadata

!!! note "Chroma >= 1.5.0"

    Array metadata and the `$contains`/`$not_contains` operators require Chroma 1.5.0 or later.

Chroma supports storing arrays in metadata fields. All elements in an array must be of the same type.

Supported array element types: `string`, `integer`, `float`, `boolean`

**Constraints:**

- Empty arrays are not allowed
- Nested arrays (arrays of arrays) are not supported
- All elements must be the same type (no mixed-type arrays)

#### Storing Array Metadata

Here is an example of a research paper collection using array metadata to store multi-value fields like topics, authors, and review scores:

=== "Python"

    ```python
    import chromadb

    client = chromadb.Client()
    collection = client.create_collection("research_papers")

    collection.add(
        ids=["paper-1", "paper-2", "paper-3"],
        documents=[
            "We introduce a transformer-based architecture for low-resource language translation.",
            "A study on the effects of soil microbiome diversity on crop yield in arid climates.",
            "Applying reinforcement learning to optimize energy consumption in smart grid networks.",
        ],
        metadatas=[
            {
                "authors": ["Chen", "Okafor", "Müller"],
                "topics": ["nlp", "transformers", "low-resource"],
                "review_scores": [8, 7, 9],
                "year": 2024,
            },
            {
                "authors": ["Patel", "Johansson"],
                "topics": ["agriculture", "microbiome", "climate"],
                "review_scores": [6, 7, 7],
                "year": 2023,
            },
            {
                "authors": ["Chen", "Williams"],
                "topics": ["reinforcement-learning", "energy", "smart-grid"],
                "review_scores": [9, 8, 9],
                "year": 2024,
            },
        ],
    )
    ```

=== "TypeScript"

    ```typescript
    import { ChromaClient } from "chromadb";

    const client = new ChromaClient();
    const collection = await client.createCollection({ name: "research_papers" });

    await collection.add({
        ids: ["paper-1", "paper-2", "paper-3"],
        documents: [
            "We introduce a transformer-based architecture for low-resource language translation.",
            "A study on the effects of soil microbiome diversity on crop yield in arid climates.",
            "Applying reinforcement learning to optimize energy consumption in smart grid networks.",
        ],
        metadatas: [
            {
                authors: ["Chen", "Okafor", "Müller"],
                topics: ["nlp", "transformers", "low-resource"],
                review_scores: [8, 7, 9],
                year: 2024,
            },
            {
                authors: ["Patel", "Johansson"],
                topics: ["agriculture", "microbiome", "climate"],
                review_scores: [6, 7, 7],
                year: 2023,
            },
            {
                authors: ["Chen", "Williams"],
                topics: ["reinforcement-learning", "energy", "smart-grid"],
                review_scores: [9, 8, 9],
                year: 2024,
            },
        ],
    });
    ```

=== "Go"

    !!! info "Go Client"

        Array metadata support in the Go client is pending. See the [chroma-go repository](https://github.com/amikos-tech/chroma-go) for updates.

=== "Rust"

    ```rust
    let mut metadata1 = Metadata::new();
    metadata1.insert("authors".into(), vec!["Chen", "Okafor", "Müller"].into());
    metadata1.insert("topics".into(), vec!["nlp", "transformers", "low-resource"].into());
    metadata1.insert("review_scores".into(), vec![8i64, 7, 9].into());
    metadata1.insert("year".into(), MetadataValue::Int(2024));

    let mut metadata2 = Metadata::new();
    metadata2.insert("authors".into(), vec!["Patel", "Johansson"].into());
    metadata2.insert("topics".into(), vec!["agriculture", "microbiome", "climate"].into());
    metadata2.insert("review_scores".into(), vec![6i64, 7, 7].into());
    metadata2.insert("year".into(), MetadataValue::Int(2023));

    let mut metadata3 = Metadata::new();
    metadata3.insert("authors".into(), vec!["Chen", "Williams"].into());
    metadata3.insert("topics".into(), vec!["reinforcement-learning", "energy", "smart-grid"].into());
    metadata3.insert("review_scores".into(), vec![9i64, 8, 9].into());
    metadata3.insert("year".into(), MetadataValue::Int(2024));

    collection.add(
        vec!["paper-1".into(), "paper-2".into(), "paper-3".into()],
        vec![embed1, embed2, embed3],
        Some(vec![
            Some("We introduce a transformer-based architecture for low-resource language translation.".into()),
            Some("A study on the effects of soil microbiome diversity on crop yield in arid climates.".into()),
            Some("Applying reinforcement learning to optimize energy consumption in smart grid networks.".into()),
        ]),
        None,
        Some(vec![Some(metadata1), Some(metadata2), Some(metadata3)]),
    ).await?;
    ```

#### Contains (`$contains`)

Returns records where an array metadata field includes a specific value. The filter value must be a scalar matching the array's element type.

=== "Python"

    ```python
    # Find papers authored by "Chen"
    results = collection.get(
        where={"authors": {"$contains": "Chen"}}
    )
    # Returns paper-1 and paper-3
    ```

=== "TypeScript"

    ```typescript
    // Find papers authored by "Chen"
    const results = await collection.get({
        where: { authors: { $contains: "Chen" } },
    });
    // Returns paper-1 and paper-3
    ```

=== "Go"

    !!! info "Go Client"

        Array metadata `$contains` in the Go client is pending. See the [chroma-go repository](https://github.com/amikos-tech/chroma-go) for updates.

=== "Rust"

    ```rust
    // Find papers authored by "Chen" (Search API - Chroma Cloud)
    let results = collection.search(vec![
        SearchPayload::default()
            .r#where(Key::field("authors").contains("Chen"))
            .limit(Some(10), 0),
    ]).await?;
    // Returns paper-1 and paper-3
    ```

=== "Python"

    ```python
    # Find papers that received a review score of 9
    results = collection.get(
        where={"review_scores": {"$contains": 9}}
    )
    # Returns paper-1 and paper-3
    ```

=== "TypeScript"

    ```typescript
    // Find papers that received a review score of 9
    const results = await collection.get({
        where: { review_scores: { $contains: 9 } },
    });
    // Returns paper-1 and paper-3
    ```

=== "Go"

    !!! info "Go Client"

        Array metadata `$contains` in the Go client is pending. See the [chroma-go repository](https://github.com/amikos-tech/chroma-go) for updates.

=== "Rust"

    ```rust
    // Find papers that received a review score of 9 (Search API - Chroma Cloud)
    let results = collection.search(vec![
        SearchPayload::default()
            .r#where(Key::field("review_scores").contains(9))
            .limit(Some(10), 0),
    ]).await?;
    // Returns paper-1 and paper-3
    ```

#### Not Contains (`$not_contains`)

Returns records where an array metadata field does not include a specific value.

=== "Python"

    ```python
    # Find papers not tagged with "nlp"
    results = collection.get(
        where={"topics": {"$not_contains": "nlp"}}
    )
    # Returns paper-2 and paper-3
    ```

=== "TypeScript"

    ```typescript
    // Find papers not tagged with "nlp"
    const results = await collection.get({
        where: { topics: { $not_contains: "nlp" } },
    });
    // Returns paper-2 and paper-3
    ```

=== "Go"

    !!! info "Go Client"

        Array metadata `$not_contains` in the Go client is pending. See the [chroma-go repository](https://github.com/amikos-tech/chroma-go) for updates.

=== "Rust"

    ```rust
    // Find papers not tagged with "nlp" (Search API - Chroma Cloud)
    let results = collection.search(vec![
        SearchPayload::default()
            .r#where(Key::field("topics").not_contains("nlp"))
            .limit(Some(10), 0),
    ]).await?;
    // Returns paper-2 and paper-3
    ```

#### Combining Array Filters

Array filters work with `$and`/`$or` logical operators and can be mixed with scalar filters:

=== "Python"

    ```python
    # Papers by "Chen" published in 2024 that cover "energy"
    results = collection.query(
        query_texts=["renewable energy optimization"],
        where={
            "$and": [
                {"authors": {"$contains": "Chen"}},
                {"topics": {"$contains": "energy"}},
                {"year": {"$eq": 2024}},
            ]
        },
    )
    # Returns paper-3
    ```

=== "TypeScript"

    ```typescript
    // Papers by "Chen" published in 2024 that cover "energy"
    const results = await collection.query({
        queryTexts: ["renewable energy optimization"],
        where: {
            $and: [
                { authors: { $contains: "Chen" } },
                { topics: { $contains: "energy" } },
                { year: { $eq: 2024 } },
            ],
        },
    });
    // Returns paper-3
    ```

=== "Go"

    !!! info "Go Client"

        Array metadata `$contains` in the Go client is pending. See the [chroma-go repository](https://github.com/amikos-tech/chroma-go) for updates.

=== "Rust"

    ```rust
    // Papers by "Chen" published in 2024 that cover "energy" (Search API - Chroma Cloud)
    let results = collection.search(vec![
        SearchPayload::default()
            .r#where(
                (Key::field("authors").contains("Chen"))
                    & (Key::field("topics").contains("energy"))
                    & (Key::field("year").eq(2024)),
            )
            .rank(knn_query.clone())
            .limit(Some(10), 0),
    ]).await?;
    // Returns paper-3
    ```

### Logical Operator: And (`$and`)

The `$and` logical operator joins two or more simple (`$eq`, `$ne`, `$gt` etc.) filters together and matches records for which all of the conditions in the list are satisfied.

=== "Python"

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where={"$and": [{"metadata_field1": "value1"}, {"metadata_field2": "value2"}]}
    )
    ```

=== "TypeScript"

    ```typescript
    const results = await collection.query({
        queryTexts: ["This is a query document"],
        nResults: 2,
        where: { $and: [{ metadata_field1: "value1" }, { metadata_field2: "value2" }] },
    });
    ```

=== "Go"

    ```go
    results, _ := collection.Query(ctx,
        chroma.WithQueryTexts("This is a query document"),
        chroma.WithNResults(2),
        chroma.WithWhere(chroma.And(
            chroma.EqString("metadata_field1", "value1"),
            chroma.EqString("metadata_field2", "value2"),
        )),
    )
    ```

=== "Rust"

    ```rust
    let results = collection.get(
        None,
        Some(Where::Composite(CompositeExpression {
            operator: BooleanOperator::And,
            children: vec![
                Where::Metadata(MetadataExpression {
                    key: "metadata_field1".to_string(),
                    comparison: MetadataComparison::Primitive(
                        PrimitiveOperator::Equal,
                        MetadataValue::Str("value1".to_string()),
                    ),
                }),
                Where::Metadata(MetadataExpression {
                    key: "metadata_field2".to_string(),
                    comparison: MetadataComparison::Primitive(
                        PrimitiveOperator::Equal,
                        MetadataValue::Str("value2".to_string()),
                    ),
                }),
            ],
        })),
        None, None, None,
    ).await?;
    ```

### Logical Operator: Or (`$or`)

The `$or` logical operator that joins two or more simple (`$eq`, `$ne`, `$gt` etc.) filters together and matches records for which at least one of the conditions in the list is satisfied.

=== "Python"

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where={"$or": [{"metadata_field1": "value1"}, {"metadata_field2": "value2"}]}
    )
    ```

=== "TypeScript"

    ```typescript
    const results = await collection.query({
        queryTexts: ["This is a query document"],
        nResults: 2,
        where: { $or: [{ metadata_field1: "value1" }, { metadata_field2: "value2" }] },
    });
    ```

=== "Go"

    ```go
    results, _ := collection.Query(ctx,
        chroma.WithQueryTexts("This is a query document"),
        chroma.WithNResults(2),
        chroma.WithWhere(chroma.Or(
            chroma.EqString("metadata_field1", "value1"),
            chroma.EqString("metadata_field2", "value2"),
        )),
    )
    ```

=== "Rust"

    ```rust
    let results = collection.get(
        None,
        Some(Where::Composite(CompositeExpression {
            operator: BooleanOperator::Or,
            children: vec![
                Where::Metadata(MetadataExpression {
                    key: "metadata_field1".to_string(),
                    comparison: MetadataComparison::Primitive(
                        PrimitiveOperator::Equal,
                        MetadataValue::Str("value1".to_string()),
                    ),
                }),
                Where::Metadata(MetadataExpression {
                    key: "metadata_field2".to_string(),
                    comparison: MetadataComparison::Primitive(
                        PrimitiveOperator::Equal,
                        MetadataValue::Str("value2".to_string()),
                    ),
                }),
            ],
        })),
        None, None, None,
    ).await?;
    ```

### Logical Operator Nesting

Logical Operators can be nested.

=== "Python"

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where={
            "$and": [
                {"metadata_field1": "value1"},
                {"$and": [{"metadata_field2": "value2"}, {"metadata_field3": "value3"}]},
            ]
        },
    )
    ```

=== "TypeScript"

    ```typescript
    const results = await collection.query({
        queryTexts: ["This is a query document"],
        nResults: 2,
        where: {
            $and: [
                { metadata_field1: "value1" },
                { $and: [{ metadata_field2: "value2" }, { metadata_field3: "value3" }] },
            ],
        },
    });
    ```

=== "Go"

    ```go
    results, _ := collection.Query(ctx,
        chroma.WithQueryTexts("This is a query document"),
        chroma.WithNResults(2),
        chroma.WithWhere(chroma.And(
            chroma.EqString("metadata_field1", "value1"),
            chroma.And(
                chroma.EqString("metadata_field2", "value2"),
                chroma.EqString("metadata_field3", "value3"),
            ),
        )),
    )
    ```

=== "Rust"

    ```rust
    let results = collection.get(
        None,
        Some(Where::Composite(CompositeExpression {
            operator: BooleanOperator::And,
            children: vec![
                Where::Metadata(MetadataExpression {
                    key: "metadata_field1".to_string(),
                    comparison: MetadataComparison::Primitive(
                        PrimitiveOperator::Equal,
                        MetadataValue::Str("value1".to_string()),
                    ),
                }),
                Where::Composite(CompositeExpression {
                    operator: BooleanOperator::And,
                    children: vec![
                        Where::Metadata(MetadataExpression {
                            key: "metadata_field2".to_string(),
                            comparison: MetadataComparison::Primitive(
                                PrimitiveOperator::Equal,
                                MetadataValue::Str("value2".to_string()),
                            ),
                        }),
                        Where::Metadata(MetadataExpression {
                            key: "metadata_field3".to_string(),
                            comparison: MetadataComparison::Primitive(
                                PrimitiveOperator::Equal,
                                MetadataValue::Str("value3".to_string()),
                            ),
                        }),
                    ],
                }),
            ],
        })),
        None, None, None,
    ).await?;
    ```

## Document Filters

!!! info "Rust: Search API Required"

    In the Rust client, document filters use the Search API (`collection.search()`) with the `Key::Document` builder. The Search API requires Chroma Cloud.

### Schema

You can use the following JSON schema to validate `where_document` expressions:

```json
{
    "$schema": "https://json-schema.org/draft/2020-12/schema#",
    "title": "Chroma Document Filter Schema",
    "description": "Schema for Chroma document filters used in where_document clauses",
    "type": "object",
    "oneOf": [
        {
            "properties": {
                "$contains": {
                    "type": "string"
                }
            },
            "required": ["$contains"],
            "additionalProperties": false
        },
        {
            "properties": {
                "$not_contains": {
                    "type": "string"
                }
            },
            "required": ["$not_contains"],
            "additionalProperties": false
        },
        {
            "properties": {
                "$regex": {
                    "type": "string"
                }
            },
            "required": ["$regex"],
            "additionalProperties": false
        },
        {
            "properties": {
                "$not_regex": {
                    "type": "string"
                }
            },
            "required": ["$not_regex"],
            "additionalProperties": false
        },
        {
            "properties": {
                "$and": {
                    "type": "array",
                    "items": {"$ref": "#"},
                    "minItems": 2
                }
            },
            "required": ["$and"],
            "additionalProperties": false
        },
        {
            "properties": {
                "$or": {
                    "type": "array",
                    "items": {"$ref": "#"},
                    "minItems": 2
                }
            },
            "required": ["$or"],
            "additionalProperties": false
        }
    ]
}
```

### Contains (`$contains`)

!!! note "Case-Sensitive"

    The `$contains` document filter performs a case-sensitive full-text search. For example, `{"$contains": "Hello"}` will not match a document containing only `"hello"`.

=== "Python"

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where_document={"$contains": "search_string"}
    )
    ```

=== "TypeScript"

    ```typescript
    const results = await collection.query({
        queryTexts: ["This is a query document"],
        nResults: 2,
        whereDocument: { $contains: "search_string" },
    });
    ```

=== "Go"

    ```go
    results, _ := collection.Query(ctx,
        chroma.WithQueryTexts("This is a query document"),
        chroma.WithNResults(2),
        chroma.WithWhereDocument(chroma.Contains("search_string")),
    )
    ```

=== "Rust"

    ```rust
    let results = collection.search(vec![
        SearchPayload::default()
            .r#where(Key::Document.contains("search_string"))
            .rank(knn_query.clone())
            .limit(Some(2), 0),
    ]).await?;
    ```

### Not Contains (`$not_contains`)

=== "Python"

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where_document={"$not_contains": "search_string"}
    )
    ```

=== "TypeScript"

    ```typescript
    const results = await collection.query({
        queryTexts: ["This is a query document"],
        nResults: 2,
        whereDocument: { $not_contains: "search_string" },
    });
    ```

=== "Go"

    ```go
    results, _ := collection.Query(ctx,
        chroma.WithQueryTexts("This is a query document"),
        chroma.WithNResults(2),
        chroma.WithWhereDocument(chroma.NotContains("search_string")),
    )
    ```

=== "Rust"

    ```rust
    let results = collection.search(vec![
        SearchPayload::default()
            .r#where(Key::Document.not_contains("search_string"))
            .rank(knn_query.clone())
            .limit(Some(2), 0),
    ]).await?;
    ```

### Regex (`$regex`)

Matches documents whose content matches the given regular expression pattern.

=== "Python"

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where_document={"$regex": "search.*pattern"}
    )
    ```

=== "TypeScript"

    ```typescript
    const results = await collection.query({
        queryTexts: ["This is a query document"],
        nResults: 2,
        whereDocument: { $regex: "search.*pattern" },
    });
    ```

=== "Go"

    ```go
    results, _ := collection.Query(ctx,
        chroma.WithQueryTexts("This is a query document"),
        chroma.WithNResults(2),
        chroma.WithWhereDocument(chroma.Regex("search.*pattern")),
    )
    ```

=== "Rust"

    ```rust
    let results = collection.search(vec![
        SearchPayload::default()
            .r#where(Key::Document.regex("search.*pattern"))
            .rank(knn_query.clone())
            .limit(Some(2), 0),
    ]).await?;
    ```

### Not Regex (`$not_regex`)

Matches documents whose content does not match the given regular expression pattern.

=== "Python"

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where_document={"$not_regex": "exclude.*pattern"}
    )
    ```

=== "TypeScript"

    ```typescript
    const results = await collection.query({
        queryTexts: ["This is a query document"],
        nResults: 2,
        whereDocument: { $not_regex: "exclude.*pattern" },
    });
    ```

=== "Go"

    ```go
    results, _ := collection.Query(ctx,
        chroma.WithQueryTexts("This is a query document"),
        chroma.WithNResults(2),
        chroma.WithWhereDocument(chroma.NotRegex("exclude.*pattern")),
    )
    ```

=== "Rust"

    ```rust
    let results = collection.search(vec![
        SearchPayload::default()
            .r#where(Key::Document.not_regex("exclude.*pattern"))
            .rank(knn_query.clone())
            .limit(Some(2), 0),
    ]).await?;
    ```

### Logical Operator: And (`$and`)

=== "Python"

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where_document={
            "$and": [
                {"$contains": "search_string1"},
                {"$contains": "search_string2"},
            ]
        },
    )
    ```

=== "TypeScript"

    ```typescript
    const results = await collection.query({
        queryTexts: ["This is a query document"],
        nResults: 2,
        whereDocument: {
            $and: [{ $contains: "search_string1" }, { $contains: "search_string2" }],
        },
    });
    ```

=== "Go"

    ```go
    results, _ := collection.Query(ctx,
        chroma.WithQueryTexts("This is a query document"),
        chroma.WithNResults(2),
        chroma.WithWhereDocument(chroma.AndDocument(
            chroma.Contains("search_string1"),
            chroma.Contains("search_string2"),
        )),
    )
    ```

=== "Rust"

    ```rust
    let results = collection.search(vec![
        SearchPayload::default()
            .r#where(
                (Key::Document.contains("search_string1"))
                    & (Key::Document.contains("search_string2")),
            )
            .rank(knn_query.clone())
            .limit(Some(2), 0),
    ]).await?;
    ```

Logical Operators can be nested.

=== "Python"

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where_document={
            "$and": [
                {"$contains": "search_string1"},
                {
                    "$or": [
                        {"$not_contains": "search_string2"},
                        {"$not_contains": "search_string3"},
                    ]
                },
            ]
        },
    )
    ```

=== "TypeScript"

    ```typescript
    const results = await collection.query({
        queryTexts: ["This is a query document"],
        nResults: 2,
        whereDocument: {
            $and: [
                { $contains: "search_string1" },
                {
                    $or: [
                        { $not_contains: "search_string2" },
                        { $not_contains: "search_string3" },
                    ],
                },
            ],
        },
    });
    ```

=== "Go"

    ```go
    results, _ := collection.Query(ctx,
        chroma.WithQueryTexts("This is a query document"),
        chroma.WithNResults(2),
        chroma.WithWhereDocument(chroma.AndDocument(
            chroma.Contains("search_string1"),
            chroma.OrDocument(
                chroma.NotContains("search_string2"),
                chroma.NotContains("search_string3"),
            ),
        )),
    )
    ```

=== "Rust"

    ```rust
    let results = collection.search(vec![
        SearchPayload::default()
            .r#where(
                (Key::Document.contains("search_string1"))
                    & ((Key::Document.not_contains("search_string2"))
                        | (Key::Document.not_contains("search_string3"))),
            )
            .rank(knn_query.clone())
            .limit(Some(2), 0),
    ]).await?;
    ```

### Logical Operator: Or (`$or`)

=== "Python"

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where_document={
            "$or": [
                {"$not_contains": "search_string1"},
                {"$not_contains": "search_string2"},
            ]
        },
    )
    ```

=== "TypeScript"

    ```typescript
    const results = await collection.query({
        queryTexts: ["This is a query document"],
        nResults: 2,
        whereDocument: {
            $or: [
                { $not_contains: "search_string1" },
                { $not_contains: "search_string2" },
            ],
        },
    });
    ```

=== "Go"

    ```go
    results, _ := collection.Query(ctx,
        chroma.WithQueryTexts("This is a query document"),
        chroma.WithNResults(2),
        chroma.WithWhereDocument(chroma.OrDocument(
            chroma.NotContains("search_string1"),
            chroma.NotContains("search_string2"),
        )),
    )
    ```

=== "Rust"

    ```rust
    let results = collection.search(vec![
        SearchPayload::default()
            .r#where(
                (Key::Document.not_contains("search_string1"))
                    | (Key::Document.not_contains("search_string2")),
            )
            .rank(knn_query.clone())
            .limit(Some(2), 0),
    ]).await?;
    ```

## Pagination

`Collection.get()` allows users to specify page details `limit` and `offset`.

=== "Python"

    ```python
    results = collection.get(limit=10, offset=20)
    ```

=== "TypeScript"

    ```typescript
    const results = await collection.get({ limit: 10, offset: 20 });
    ```

=== "Go"

    ```go
    results, _ := collection.Get(ctx,
        chroma.WithLimit(10),
        chroma.WithOffset(20),
    )
    ```

=== "Rust"

    ```rust
    let results = collection.get(
        None,       // ids
        None,       // where
        Some(10),   // limit
        Some(20),   // offset
        None,       // include
    ).await?;
    ```
