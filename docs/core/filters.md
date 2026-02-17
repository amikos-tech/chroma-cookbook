# Filters

Chroma provides two types of filters:

- Metadata - filter documents based on metadata using `where` clause in either `Collection.query()` or `Collection.get()`
- Document - filter documents based on document content using `where_document` in `Collection.query()` or `Collection.get()`.

Those familiar with MongoDB queries will find Chroma's filters very similar.

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
                            "additionalProperties": False,
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
            "additionalProperties": False,
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

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where={"metadata_field": "is_equal_to_this"}
)
```

Alternative syntax:

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where={"metadata_field": {"$eq": "is_equal_to_this"}}
)
```

??? note "Validation Failures"

    When validation fails, similar to this message is expected to be returned by Chroma - `ValueError: Expected where value to be a str, int, float, or operator expression, got X in get.` with `X` refering to the inferred type of the data.

### Inequality (`$ne`)

This filter matches attribute values that are not equal to a specified string, boolean, integer or float value. The value check is case-sensitive.

Supported value types are:  `string`, `boolean`, `integer` or `float` (or `number` in JS/TS)

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where={"metadata_field": {"$ne": "is_not_equal_to_this"}}
)
```

### Greater Than (`$gt`)

This filter matches attribute values that are strictly greater than a specified numeric (`interger` or `float`) value.

!!! note "Greater Than"

    The `$gt` operator is only supported for numerical values - int or float values.

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where={"metadata_field": {"$gt": 5}}
)
```

### Greater Than or Equal (`$gte`)

This filter matches attribute values that are greater than or equal a specified numeric (`interger` or `float`) value.

!!! note "Greater Than or Equal"

    The `$gte` operator is only supported for numerical values - int or float values.

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where={"metadata_field": {"$gte": 5.1}}
)
```

### Less Than (`$lt`)

This filter matches attribute values that are less than specified numeric (`interger` or `float`) value.

Supported values: `integer` or `float`

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where={"metadata_field": {"$lt": 5}}
)
```

### Less Than or Equal (`$lte`)

This filter matches attribute values that are less than or equal specified numeric (`interger` or `float`) value.

Supported values: `integer` or `float`

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where={"metadata_field": {"$lte": 5.1}}
)
```

### In (`$in`)

This filter matches attribute values that are in the given list of values.

Supported value types are:  `string`, `boolean`, `integer` or `float` (or `number` in JS/TS)

!!! note "In"

    The `$in` operator is only supported for list of values of the same type.

=== "Strings"

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where={"metadata_field": {"$in": ["value1", "value2"]}}
    )
    ```

=== "Integers"

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where={"metadata_field": {"$in": [1,2,3]}}
    )
    ```

=== "Invalid Example"

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where={"metadata_field": {"$in": [1,"2",1.1]}}
    )
    ```

### Not In (`$nin`)

This filter matches attribute that do not have the given key or the values of which are not in the given list of values.

Supported value types are:  `string`, `boolean`, `integer` or `float` (or `number` in JS/TS)

!!! note "Not In"

    The `$nin` operator is only supported for list of values of the same type.

=== "Strings"

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where={"metadata_field": {"$nin": ["value1", "value2"]}}
    )
    ```

=== "Integers"

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where={"metadata_field": {"$nin": [1,2,3]}}
    )
    ```

=== "Invalid Example"

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        n_results=2,
        where={"metadata_field": {"$nin": [1,"2",1.1]}}
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

#### Contains (`$contains`)

Returns records where an array metadata field includes a specific value. The filter value must be a scalar matching the array's element type.

```python
# Find papers authored by "Chen"
results = collection.get(
    where={"authors": {"$contains": "Chen"}}
)
# Returns paper-1 and paper-3
```

```python
# Find papers that received a review score of 9
results = collection.get(
    where={"review_scores": {"$contains": 9}}
)
# Returns paper-1 and paper-3
```

#### Not Contains (`$not_contains`)

Returns records where an array metadata field does not include a specific value.

```python
# Find papers not tagged with "nlp"
results = collection.get(
    where={"topics": {"$not_contains": "nlp"}}
)
# Returns paper-2 and paper-3
```

#### Combining Array Filters

Array filters work with `$and`/`$or` logical operators and can be mixed with scalar filters:

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

### Logical Operator: And (`$and`)

The `$and` logical operator joins two or more simple (`$eq`, `$ne`, `$gt` etc.) filters together and matches records for which all of the conditions in the list are satisfied.

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where={"$and": [{"metadata_field1": "value1"}, {"metadata_field2": "value2"}]}
)
```

### Logical Operator: Or (`$or`)

The `$or` logical operator that joins two or more simple (`$eq`, `$ne`, `$gt` etc.) filters together and matches records for which at least one of the conditions in the list is satisfied.

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where={"$or": [{"metadata_field1": "value1"}, {"metadata_field2": "value2"}]}
)
```

### Logical Operator Nesting

Logical Operators can be nested.

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where={"$and": [{"metadata_field1": "value1"}, {"$and": [{"metadata_field2": "value2"}, {"metadata_field3": "value3"}]}]}
)
```

## Document Filters

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
            "additionalProperties": False
        },
        {
            "properties": {
                "$not_contains": {
                    "type": "string"
                }
            },
            "required": ["$not_contains"],
            "additionalProperties": False
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
            "additionalProperties": False
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
            "additionalProperties": False
        }
    ]
}
```

### Contains (`$contains`)

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where_document={"$contains": "search_string"}
)
```

### Not Contains (`$not_contains`)

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where_document={"$not_contains": "search_string"}
)
```

### Logical Operator: And (`$and`)

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where_document={"$and": [{"$contains": "search_string1"}, {"$contains": "search_string2"}]}
)
```

Logical Operators can be nested.

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where_document={"$and": [{"$contains": "search_string1"}, {"$or": [{"$not_contains": "search_string2"}, {"$not_contains": "search_string3"}]}]}
)
```

### Logical Operator: Or (`$or`)

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where_document={"$or": [{"$not_contains": "search_string1"}, {"$not_contains": "search_string2"}]}
)
```

## Pagination

`Collection.get()` allows users to specify page details `limit` and `offset`.

```python
results = collection.get(limit=10, offset=20)
```
