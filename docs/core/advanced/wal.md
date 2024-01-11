# Write-ahead Log (WAL)

Chroma uses WAL to ensure data durability, even if things go wrong (e.g. server crashes). To achieve the latter Chroma
uses what is known in the DB-industry as WAL or Write-Ahead Log. The purpose of the WAL is to ensure that each user
request (aka transaction) is safely stored before acknowledging back to the user. Subsequently, in fact immediately
after writing to the WAL, the data is also written to the index. This enables Chroma to serve as real-time search
engine, where the data is available for querying immediately after it is written to the WAL.

Below is a diagram that illustrates the WAL in ChromaDB (ca. v0.4.22):

![WAL](assets/images/WAL.png)`,

## Further Reading

For the DevOps minded folks we have a few more resources:

- [WAL Pruning](core/advanced/wal-pruning.md) - Clean up your WAL
