# Multi-Category/Tag Filters

Sometimes you may want to filter documents in Chroma based on multiple categories or tags e.g. `games` and `movies`.
Unfortunately, Chroma does not yet support complex data-types like lists or sets so that one can use a single metadata
field to store and filter by. It is also not possible to use fuzzy search `LIKE` queries on metadata fields.

To solve this problem without introducing a complex logic on the client side, we suggest the following approach.

When adding document to a collection add each category it belongs to as a boolean metadata field:

!!! note "No Empty Categories/Tags"

    Only add categories an item belongs to with flags set to `True`. 
    Do not add categories an item does not belong to and set the flag to `False`.

```python

collection.add(
    ids=[f"{uuid.uuid4()}"],
    documents=["This is a document"],
    metadatas=[{"games": True, "movies": True}],
)
```

When querying documents, you can filter by multiple categories by using the `where` parameter:

```python
results = collection.query(
    query_texts=["This is a query document"],
    where={"games": True},
)
# or a more complex query
results = collection.query(
    query_texts=["This is a query document"],
    where={"$or": [{"games": True}, {"movies": True}]},
)
```
