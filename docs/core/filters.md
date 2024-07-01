# Filters

Chroma provides two types of filters:

- Metadata - filter documents based on metadata using `where` clause in either `Collection.query()` or `Collection.get()`
- Document - filter documents based on document content using `where_document` in `Collection.query()` or `Collection.get()`.

Those familiar with MongoDB queries will find Chroma's filters very similar.

## Metadata Filters


### Equality

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

### Inequality

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where={"metadata_field": {"$ne": "is_not_equal_to_this"}}
)
```

### Greater Than

!!! note "Greater Than"

    The `$gt` operator is only supported for numerical values - int or float values.

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where={"metadata_field": {"$gt": 5}}
)
```

### Greater Than or Equal

!!! note "Greater Than or Equal"

    The `$gte` operator is only supported for numerical values - int or float values.

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where={"metadata_field": {"$gte": 5.1}}
)
```

### Less Than

!!! note "Less Than"

    The `$lt` operator is only supported for numerical values - int or float values.

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where={"metadata_field": {"$lt": 5}}
)
```

### Less Than or Equal

!!! note "Less Than or Equal"

    The `$lte` operator is only supported for numerical values - int or float values.

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where={"metadata_field": {"$lte": 5.1}}
)
```

### In

In works on all data types - string, int, float, and bool.

!!! note "In"

    The `$in` operator is only supported for list of values of the same type.

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where={"metadata_field": {"$in": ["value1", "value2"]}}
)
```

### Not In

Not In works on all data types - string, int, float, and bool.

!!! note "Not In"

    The `$nin` operator is only supported for list of values of the same type.

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where={"metadata_field": {"$nin": ["value1", "value2"]}}
)
```

### Logical Operator: And

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where={"$and": [{"metadata_field1": "value1"}, {"metadata_field2": "value2"}]}
)
```

Logical Operators can be nested.

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where={"$and": [{"metadata_field1": "value1"}, {"$or": [{"metadata_field2": "value2"}, {"metadata_field3": "value3"}]}]}
)
```

### Logical Operator: Or

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where={"$or": [{"metadata_field1": "value1"}, {"metadata_field2": "value2"}]}
)
```

## Document Filters

### Contains

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where_document={"$contains": "search_string"}
)
```

### Not Contains

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where_document={"$not_contains": "search_string"}
)
```

### Logical Operator: And

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

### Logical Operator: Or

```python
results = collection.query(
    query_texts=["This is a query document"],
    n_results=2,
    where_document={"$or": [{"$not_contains": "search_string1"}, {"$not_contains": "search_string2"}]}
)
```
