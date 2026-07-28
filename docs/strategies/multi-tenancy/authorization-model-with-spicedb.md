# Build Fine-Grained RAG Permissions with SpiceDB and Chroma — Part 1: The Authorization Model

!!! note "Source Code"

    The full, runnable source code for this two-part guide can be found
    [here](https://github.com/authzed/examples/tree/main/chroma-spicedb-rag).

A new hire types "what are the current salary bands?" into your shiny internal
RAG assistant. The retriever does exactly what it was built to do: it finds the
most relevant chunks and hands them to the model. The most relevant chunk
happens to be the confidential compensation memo. The model, being helpful,
summarizes it beautifully.

Nobody attacked anything. The system worked as designed. And that's the problem.

A RAG pipeline will happily answer using whatever it retrieves. So retrieval has
to respect who is asking — not just what they asked. OWASP now lists
**Sensitive Information Disclosure** among its Top 10 risks for LLM
applications, and this is the most common way it happens: the vector store
doesn't know, or care, that this user was never allowed to see that document.

This is a two-part guide. Part 1 (this article) builds the authorization
*model* — the schema that decides who can see what. [Part 2](authorization-model-impl-with-spicedb.md)
wires that model into a Chroma retrieval pipeline with working code.

## Who this is for, and how it fits

If you've read the cookbook's
[OpenFGA authorization model](authorization-model-with-openfga.md) guide, this
one is its natural sequel. That series answers a *resource-level* question — who
may create a collection, who may query this tenant, who administers the server.
It deliberately left out access to individual documents inside a collection.

This guide picks up exactly there: **document-level** access control for RAG.
Same spirit — relationship-based authorization — pointed at the records your
retriever returns rather than the API it sits behind. We'll use
[SpiceDB](https://authzed.com/spicedb) instead of OpenFGA, but the ideas
transfer cleanly; both descend from Google's
[Zanzibar](https://research.google/pubs/pub48190/) paper.

## Why relationships, not tags

The tempting shortcut is to stamp a `department: finance` or `allowed_users:
[...]` field onto each vector's metadata and filter on it. It works right up
until it doesn't. Permissions in a real org aren't flat labels — they're a
graph. Kim is on the platform team; the platform team owns the infra workspace;
the infra workspace contains 4,000 documents; Kim just got promoted to lead, so
now she can edit them too. Encode *that* as a tag on every vector and try to keep
it correct as people join, leave, and move teams.

There are four broad ways to model access, and it's worth being honest about
where each shines:

- **ACLs** — a list of users per object. Simple, and genuinely fine for small,
  static sets.
- **RBAC** — roles like `reader`/`writer`. Great when access maps neatly onto a
  handful of roles.
- **ABAC** — rules over attributes. Flexible, but the policy logic tends to
  sprawl, and "why can Kim see this?" gets hard to answer.
- **ReBAC** — relationship-based. Permissions are edges in a graph, and a check
  is a graph traversal.

ReBAC is the one built for the shape RAG permissions actually take. Membership,
ownership, inheritance, sharing — these are relationships, and ReBAC stores them
as relationships instead of flattening them into a label you have to recompute.
It's the model Zanzibar chose to authorize Google's documents, and the one
SpiceDB implements.

The primitive is a **relationship** — a tuple of the form:

```text
resource#relation@subject
```

Read it right to left: a *subject* (say `user:kim`) has a *relation* (say
`viewer`) on a *resource* (say `document:roadmap-q3`). Stack enough of these
edges and a permission check becomes a question about the graph: is there a path
from this user to this document that grants `view`?

## The model

We'll start deliberately small, with the smallest model that does something
real, and grow it at the end. Here's the schema:

```zed
definition user {}

definition document {
	relation viewer: user
	relation editor: user

	permission view = viewer + editor
	permission edit = editor
}
```

That's the whole thing, and it already says something precise. A `document` has
two relations a user can hold: `viewer` and `editor`. It exposes two
permissions. `edit` requires the `editor` relation. `view` is granted to
`viewer` **or** `editor` — the `+` is a union, and it encodes the obvious rule
that anyone who can edit can also read. Every document your retriever might
return becomes a `document:<id>` in this model, and a query is only ever allowed
to surface documents on which the asking user has `view`.

## Running SpiceDB locally

You can get a SpiceDB instance up in one command. This runs it with an
in-memory datastore and a preshared key — perfect for following along, not for
production:

```bash
spicedb serve --grpc-preshared-key "somerandomkeyhere" --datastore-engine memory
```

Prefer Docker? The [companion repo](https://github.com/authzed/examples/tree/main/chroma-spicedb-rag)
ships a `docker-compose.yml` that starts SpiceDB alongside Chroma, so
`docker compose up -d` gets you both.

Now point the [`zed` CLI](https://github.com/authzed/zed) at it and load the
schema. Save the schema above as `schema.zed`, then:

```bash
zed context set local localhost:50051 "somerandomkeyhere" --insecure
zed schema write schema.zed
```

Grant Kim read access to a couple of documents by writing relationships:

```bash
zed relationship create document:roadmap-q3 viewer user:kim
zed relationship create document:eng-oncall viewer user:kim
```

And ask the question that matters:

```bash
zed permission check document:roadmap-q3 view user:kim --consistency-full
# true
zed permission check document:salary-bands view user:kim --consistency-full
# false
```

There it is — the entire point of the exercise, in two lines. Kim can `view` the
roadmap because a relationship says so. She can't `view` the salary bands
because no path in the graph grants it. In [Part 2](authorization-model-impl-with-spicedb.md)
we'll ask SpiceDB this exact question from inside a Chroma query, at retrieval
time, for every document the vector search wants to return.

!!! tip "Read-your-writes"

    If you script the write and the check back-to-back and the check comes back
    `false`, you're almost certainly hitting SpiceDB's default consistency,
    which may serve a slightly stale snapshot. That's what `--consistency-full`
    above is for — it evaluates against the newest data so you see your own
    just-written relationships. We'll cover this properly, with the API-level
    fix, in Part 2.

## Going further: groups, folders, multi-tenancy

The per-document model is where you should start, but it isn't where you'll end.
The reason to reach for ReBAC in the first place is that it grows without
forcing you to rewrite what you already have. A few edges you'll likely add:

```zed
definition user {}

definition group {
	relation member: user
}

definition folder {
	relation reader: user | group#member
	relation writer: user | group#member

	permission view = reader + writer
	permission edit = writer
}

definition document {
	relation parent: folder
	relation viewer: user | group#member
	relation editor: user | group#member

	permission view = viewer + editor + parent->view
	permission edit = editor + parent->edit
}
```

Two upgrades are doing the heavy lifting here. `group#member` lets you grant a
permission to an entire team in one relationship — add a person to the group and
they inherit every document the group can see, no per-document bookkeeping.
And `parent->view` is inheritance: a document's `view` permission now includes
whatever grants `view` on its parent folder. Share a folder with the platform
team, and every document in it is readable by every member, transitively. That's
the sentence about Kim and her 4,000 documents, expressed as three edges instead
of a nightly re-tagging job.

This is also the bridge back to the
[OpenFGA guides](authorization-model-with-openfga.md): once folders belong to
tenants and tenants to an organization, you're modeling the same multi-tenant
hierarchy from a different angle — resource-level and document-level access
described in one consistent graph.

We'll keep the walkthrough on the minimal model so the code stays legible. Just
know the ceiling is high.

## Next

The model decides who can see what. [Part 2](authorization-model-impl-with-spicedb.md)
puts it to work: indexing documents in Chroma so each vector points back to a
`document`, then enforcing `view` at query time with two complementary
strategies, pre-filtering and post-filtering, and finishing with an
end-to-end RAG answer that changes the moment you revoke access.
