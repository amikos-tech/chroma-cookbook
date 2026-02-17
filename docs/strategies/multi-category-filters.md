# Multi-Category/Tag Filters

Sometimes you may want to filter documents in Chroma based on multiple categories or tags e.g. `games` and `movies`.

## Adding Categories

=== "Array Metadata (Chroma >= 1.5.0)"

    Store categories directly as an array metadata field:

    ```python
    collection.add(
        ids=[f"{uuid.uuid4()}"],
        documents=["This is a document"],
        metadatas=[{"categories": ["games", "movies"]}],
    )
    ```

=== "Boolean Fields (Pre-1.5.0)"

    On older Chroma versions that don't support array metadata, add each category as a separate boolean field:

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

## Querying by Category

=== "Array Metadata (Chroma >= 1.5.0)"

    Use `$contains` to match documents with a specific category:

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        where={"categories": {"$contains": "games"}},
    )
    ```

    Match documents in any of several categories with `$or`:

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        where={
            "$or": [
                {"categories": {"$contains": "games"}},
                {"categories": {"$contains": "movies"}},
            ]
        },
    )
    ```

    Exclude a category with `$not_contains`:

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        where={"categories": {"$not_contains": "sports"}},
    )
    ```

=== "Boolean Fields (Pre-1.5.0)"

    Filter by a single category:

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        where={"games": True},
    )
    ```

    Filter by multiple categories with `$or`:

    ```python
    results = collection.query(
        query_texts=["This is a query document"],
        where={"$or": [{"games": True}, {"movies": True}]},
    )
    ```
