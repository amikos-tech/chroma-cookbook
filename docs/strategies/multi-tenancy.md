# Multi-tenancy Strategies

!!! note "Single-note Chroma"

    The below strategies are applicable to single-node Chroma only.

## Introduction

There are several multi-tenancy strategies available to users of Chroma. The actual strategy will depend on the needs of
the user and the application. The strategies below apply to multi-user environments, but do no factor in partly-shared
resources like groups or teams.

- **Doc-Per-User**: In this scenario, the app maintains multiple collections and each collection document is associated
  with a single user.
- **Doc-Per-Collection**: In this scenario, the app maintains multiple collections and each collection is
  associated with a single user.
- **Doc-Per-Database**: In this scenario, the app maintains multiple databases with a single tenant and each database is
  associated with a single user.
- **Doc-Per-Tenant**: In this scenario, the app maintains multiple tenants and each tenant is associated with a single
  user.

## Doc-Per-User

![multi-tenancy-user-per-doc.png](../assets/images/multi-tenancy-user-per-doc.png)

To implement this strategy you need to add some sort of user identification to each document that belongs to a user.
For this example we will assume it is `user_id`.

```python
import chromadb

client = chromadb.PersistentClient()
collection = client.get_or_create_collection("my-collection")
collection.add(
    documents=["This is document1", "This is document2"],
    metadatas=[{"user_id": "user1"}, {"user_id": "user2"}],
    ids=["doc1", "doc2"],
)
```

At query time you will have to provide the `user_id` as a filter to your query like so:

```python
results = collection.query(
    query_texts=["This is a query document"],
    where=[{"user_id": "user1"}],
)
```

To successfully implement this strategy your code needs to consistently add and filter on the `user_id` metadata to
ensure separation of data.

**Drawbacks**:

- Error-prone: Messing up the filtering can lead to data being leaked across users.
- Scalability: As the number of users and documents grow, doing filtering on metadata can become slow.

## Doc-Per-Collection

![multi-tenancy-user-per-collection.png](../assets/images/multi-tenancy-user-per-collection.png)

To implement this strategy you need to create a collection for each user. For this example we will assume it is
`user_id`.

```python
import chromadb

client = chromadb.PersistentClient()
user_id = "user1"
collection = client.get_or_create_collection(f"user-collection:{user_id}")
collection.add(
    documents=["This is document1", "This is document2"],
    ids=["doc1", "doc2"],
)
```

At query time you will have to provide the `user_id` as a filter to your query like so:

```python
user_id = "user1"
user_collection = client.get_collection(f"user-collection:{user_id}")
results = user_collection.query(
    query_texts=["This is a query document"],
)
```

To successfully implement this strategy your code needs to consistently create and query the correct collection for the
user.

**Drawbacks**:

- Error-prone: Messing up the collection name can lead to data being leaked across users.
- Shared document search: If you want to maintain some documents shared then you will have to create a separate
  collection for those documents and allow users to query the shared collection as well.

## Doc-Per-Database

![multi-tenancy-user-per-db.png](../assets/images/multi-tenancy-user-per-db.png)

TBD

## Doc-Per-Tenant

![multi-tenancy-user-per-tenant.png](../assets/images/multi-tenancy-user-per-tenant.png)

TBD