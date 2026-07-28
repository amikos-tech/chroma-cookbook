# Build Fine-Grained RAG Permissions with SpiceDB and Chroma, Part 2: Implementation

!!! note "Source Code"

    The full, runnable source code for this two-part guide can be found
    [here](https://github.com/authzed/examples/tree/main/chroma-spicedb-rag).

[Part 1](authorization-model-with-spicedb.md) built the model: a SpiceDB schema
where a user can `view` a `document`, and a way to ask "can this user see this
document?" Now we make the retriever ask that question. Every time.

The plan is simple to state. Each vector in Chroma carries a `doc_id` in its
metadata that points back to a `document:<id>` in SpiceDB. At query time we make
sure the documents that reach the model are only the ones the asking user is
allowed to `view`. There are two honest ways to do that, and we'll build both.

## Prerequisites

- SpiceDB and Chroma running locally. The
  [companion repo](https://github.com/authzed/examples/tree/main/chroma-spicedb-rag)'s
  `docker compose up -d` starts both, or run SpiceDB as shown in
  [Part 1](authorization-model-with-spicedb.md).
- Python 3.10+.
- [Ollama](https://ollama.com/) with a small model pulled, for the final
  end-to-end step: `ollama pull llama3.2`.

## Setup

```bash
pip install chromadb authzed ollama
```

We'll keep the clients and a couple of helpers in one place. Note the SpiceDB
client is `SyncClient`, the synchronous flavor, talking to a local, insecure
gRPC endpoint:

```python
# common.py
import os

import chromadb
from authzed.api.v1 import SyncClient, ObjectReference, SubjectReference, Consistency
from grpcutil import insecure_bearer_token_credentials

SPICEDB_ENDPOINT = os.environ.get("SPICEDB_ENDPOINT", "localhost:50051")
SPICEDB_TOKEN = os.environ.get("SPICEDB_TOKEN", "somerandomkeyhere")
CHROMA_HOST = os.environ.get("CHROMA_HOST", "localhost")
CHROMA_PORT = int(os.environ.get("CHROMA_PORT", "8000"))

COLLECTION_NAME = "rag_documents"
USER = "kim"

# Read-your-writes: after seeding relationships we want checks to see them
# immediately, so the demo uses full consistency. More on this below.
FULLY_CONSISTENT = Consistency(fully_consistent=True)


def spicedb_client():
    return SyncClient(SPICEDB_ENDPOINT, insecure_bearer_token_credentials(SPICEDB_TOKEN))


def chroma_client():
    return chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)


def resource(doc_id):
    return ObjectReference(object_type="document", object_id=doc_id)


def user_subject(uid=USER):
    return SubjectReference(object=ObjectReference(object_type="user", object_id=uid))
```

## Indexing: link every vector to a document

The one rule that makes all of this work: **every record you add to Chroma
carries the `doc_id` of the SpiceDB `document` it belongs to.** Here we index a
handful of sample documents using Chroma's default embedding function
(all-MiniLM-L6-v2, downloaded on first use, no API key required):

```python
# index_documents.py
from common import chroma_client, COLLECTION_NAME
from data import DOCUMENTS


def main():
    client = chroma_client()
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    collection = client.create_collection(COLLECTION_NAME)

    collection.add(
        ids=[d["id"] for d in DOCUMENTS],
        documents=[d["text"] for d in DOCUMENTS],
        metadatas=[{"doc_id": d["id"]} for d in DOCUMENTS],
    )
    print(f"indexed {collection.count()} documents into '{COLLECTION_NAME}'")


if __name__ == "__main__":
    main()
```

One document is one record here to keep things readable. In a real corpus you'd
chunk each document into many vectors. Just repeat the parent `doc_id` on every
chunk's metadata, and everything below works unchanged. The `doc_id` is the
join key between "what the vector store knows" and "what the authorization
system knows."

## Seeding relationships

Kim should see some documents and not others. We write `viewer` relationships
for the ones she's allowed to read (the schema write and the full corpus live in
the companion repo's `bootstrap.py` and `data.py`):

```python
from authzed.api.v1 import WriteRelationshipsRequest, RelationshipUpdate, Relationship
from common import spicedb_client, resource, user_subject, USER
from data import AUTHORIZED_IDS

client = spicedb_client()
updates = [
    RelationshipUpdate(
        operation=RelationshipUpdate.OPERATION_TOUCH,
        relationship=Relationship(
            resource=resource(doc_id),
            relation="viewer",
            subject=user_subject(USER),
        ),
    )
    for doc_id in AUTHORIZED_IDS
]
client.WriteRelationships(WriteRelationshipsRequest(updates=updates))
```

`OPERATION_TOUCH` is the idempotent write: create the relationship if it isn't
there, leave it alone if it is. Re-running the seed doesn't blow up.

## Strategy 1: pre-filter

Ask SpiceDB *first*. `LookupResources` answers a lovely question in one call:
"give me every document this user can `view`." Then constrain the Chroma query
to exactly that set with a `$in` metadata filter, and the vector search never
even considers a document Kim can't see.

```python
# query_prefilter.py
from authzed.api.v1 import LookupResourcesRequest
from common import spicedb_client, chroma_client, user_subject, COLLECTION_NAME, USER, FULLY_CONSISTENT

QUESTION = "What confidential salary information do we have?"


def authorized_doc_ids(client, uid=USER):
    resp = client.LookupResources(LookupResourcesRequest(
        resource_object_type="document",
        permission="view",
        subject=user_subject(uid),
        consistency=FULLY_CONSISTENT,
    ))
    return [item.resource_object_id for item in resp]


def main():
    sc = spicedb_client()
    ids = authorized_doc_ids(sc)
    print("authorized doc_ids:", sorted(ids))

    collection = chroma_client().get_collection(COLLECTION_NAME)
    results = collection.query(
        query_texts=[QUESTION],
        where={"doc_id": {"$in": ids}},
        n_results=3,
    )
    print("returned ids:", results["ids"][0])
```

Run it, and note what happens even though the question is practically *begging*
for the salary document:

```text
authorized doc_ids: ['eng-oncall', 'office-wifi', 'roadmap-q3']
returned ids: ['eng-oncall', 'roadmap-q3', 'office-wifi']
```

`salary-bands` never shows up. It was never a candidate, because SpiceDB never
put it on the list.

**When to reach for this:** large corpora where each user can see a small slice.
The filter shrinks the search space before it's searched, which is efficient and
leak-proof by construction. The one caveat: if a user can see hundreds of
thousands of documents, an `$in` list of that size gets unwieldy, and the next
strategy fits better.

## Strategy 2: post-filter

The other direction: let Chroma retrieve *first*, then throw out anything the
user isn't allowed to see. One `CheckBulkPermissions` call checks every returned
document at once.

```python
# query_postfilter.py
from authzed.api.v1 import (
    CheckBulkPermissionsRequest,
    CheckBulkPermissionsRequestItem,
    CheckPermissionResponse,
)
from common import spicedb_client, chroma_client, resource, user_subject, COLLECTION_NAME, USER, FULLY_CONSISTENT

QUESTION = "What confidential salary information do we have?"
HAS = CheckPermissionResponse.PERMISSIONSHIP_HAS_PERMISSION


def filter_authorized(sc, doc_ids, uid=USER):
    if not doc_ids:
        return []
    resp = sc.CheckBulkPermissions(CheckBulkPermissionsRequest(
        consistency=FULLY_CONSISTENT,
        items=[
            CheckBulkPermissionsRequestItem(
                resource=resource(doc_id),
                permission="view",
                subject=user_subject(uid),
            )
            for doc_id in doc_ids
        ],
    ))
    return [
        pair.request.resource.object_id
        for pair in resp.pairs
        if pair.item.permissionship == HAS
    ]


def main():
    collection = chroma_client().get_collection(COLLECTION_NAME)
    results = collection.query(query_texts=[QUESTION], n_results=5)
    candidate_ids = [m["doc_id"] for m in results["metadatas"][0]]
    print("candidate ids:", candidate_ids)

    sc = spicedb_client()
    allowed = filter_authorized(sc, candidate_ids)
    print("allowed ids:", allowed)
```

This time the output is the whole point:

```text
candidate ids: ['salary-bands', 'board-notes', 'eng-oncall', 'roadmap-q3', 'office-wifi']
allowed ids: ['eng-oncall', 'roadmap-q3', 'office-wifi']
```

The vector search did exactly what you'd fear: the two most relevant documents
to a salary question are `salary-bands` and `board-notes`, and it returned them
first. Then `CheckBulkPermissions` filtered them straight out. The model never
sees them.

**When to reach for this:** smaller corpora, high hit-rates, or users with broad
access. These are cases where retrieving first is cheap and you'd rather not
build a huge pre-filter list.

## Pre-filter or post-filter?

Both are correct. They trade off differently:

| | Pre-filter (`LookupResources`) | Post-filter (`CheckBulkPermissions`) |
| --- | --- | --- |
| **Order** | SpiceDB → Chroma | Chroma → SpiceDB |
| **Best for** | Large corpus, user sees a small fraction | Smaller corpus, high hit-rate, broad access |
| **Search space** | Shrunk before searching | Full, then trimmed |
| **Weak spot** | Huge authorized sets → unwieldy `$in` list | Wasted retrieval work on docs you'll discard |
| **Leak safety** | Unauthorized docs never searched | Unauthorized docs searched, never returned |

A reasonable default: start with pre-filter, and switch to (or combine with)
post-filter if a user's authorized set gets large enough that the `$in` list
becomes a problem.

## A word on consistency

You'll have noticed `FULLY_CONSISTENT` on every SpiceDB call. That isn't
decoration. By default SpiceDB optimizes for latency and may answer from a
slightly stale snapshot, which is usually fine, but bites you the instant you
grant access and immediately check it (you'll get back `false` for a permission
you *just* wrote). That's the classic read-your-writes gap.

```python
from authzed.api.v1 import Consistency
FULLY_CONSISTENT = Consistency(fully_consistent=True)
```

Full consistency asks SpiceDB to evaluate against the freshest data, so you
always see your own writes. In production you'd usually do better than "always
fully consistent": `WriteRelationships` hands back a **ZedToken**, and passing it
as `at_least_as_fresh` gets you read-your-writes correctness *and* SpiceDB's
caching, so you only pay for freshness up to the moment that mattered. This is
SpiceDB's answer to Zanzibar's "new enemy" problem: never let a stale check
leak access that was just revoked. See the
[SpiceDB consistency docs](https://authzed.com/docs/spicedb/concepts/consistency)
for the full treatment.

## The payoff: revoke access, watch the answer change

Retrieval that respects permissions is the point, but it's abstract until you
see a model's answer move. So let's build the smallest possible RAG loop:
retrieve Kim's authorized context, hand it to a local Ollama model, and ask a
question.

```python
# rag_demo.py (abridged; full version in the companion repo)
import ollama
from common import spicedb_client, chroma_client, COLLECTION_NAME, USER
from query_prefilter import authorized_doc_ids

MODEL = "llama3.2"
QUESTION = "What does the Q3 product roadmap prioritize?"


def retrieve(question, uid=USER):
    ids = authorized_doc_ids(spicedb_client(), uid)
    if not ids:
        return ids, []
    hits = chroma_client().get_collection(COLLECTION_NAME).query(
        query_texts=[question], where={"doc_id": {"$in": ids}}, n_results=3,
    )
    return ids, hits["documents"][0]


def answer(question):
    _, docs = retrieve(question)
    context = "\n".join(docs) if docs else "(no accessible context)"
    prompt = (
        "Answer using ONLY this context. If it is not covered, say you don't know.\n\n"
        f"Context:\n{context}\n\nQuestion: {question}"
    )
    resp = ollama.chat(model=MODEL, messages=[{"role": "user", "content": prompt}])
    print("\nQ:", question)
    print("A:", resp["message"]["content"].strip())
```

With Kim holding `viewer` on `roadmap-q3`, the roadmap document is retrievable,
and the model answers from it:

```text
Q: What does the Q3 product roadmap prioritize?
A: The Q3 product roadmap prioritizes two things:
   1. The new billing engine
   2. Single Sign-On (SSO)
```

Now revoke that one relationship (`OPERATION_DELETE` on
`document:roadmap-q3 viewer user:kim`) and ask the exact same question:

```text
revoked viewer on document:roadmap-q3 for user:kim

Q: What does the Q3 product roadmap prioritize?
A: I don't know.
```

Nothing about the model or the prompt changed. The only thing that changed is a
single edge in the permission graph, and because retrieval now respects that
edge, the document simply isn't in the context anymore. The model can't leak
what it never received.

## Wrapping up

Fine-grained RAG authorization comes down to one discipline: the retriever must
answer to the person asking, and the vector store is the wrong place to keep
that truth. Keep permissions in SpiceDB as relationships, tie each vector to a
`document` with a `doc_id`, and enforce `view` at query time with pre-filtering,
post-filtering, or both.

From here:

- Grow the model. [Part 1's](authorization-model-with-spicedb.md) "going
  further" section adds groups, folders, and inheritance without touching this
  code.
- For resource-level access over Chroma's API (tenants, databases, collections),
  see the [OpenFGA guides](authorization-model-with-openfga.md).
- Run it yourself: the
  [companion repo](https://github.com/authzed/examples/tree/main/chroma-spicedb-rag)
  has everything wired together.

The industry spent the last decade learning to scope what a *user* can retrieve.
RAG just makes the stakes louder: the model will repeat, fluently, whatever you
let it read.
