# Write-ahead Log (WAL) Pruning

Chroma uses WAL to ensure data durability, even if things go wrong (e.g. server crashes). To achieve the latter Chroma
uses what is known in the DB-industry as WAL or Write-Ahead Log. The purpose of the WAL is to ensure that each user
request (aka transaction) is safely stored before acknowledging back to the user. Subsequently, in fact immediately
after writing to the WAL, the data is also written to the index. This enables Chroma to serve as real-time search
engine, where the data is available for querying immediately after it is written to the WAL.

As of this writing (v0.4.22) Chroma stores its WAL forever. This means that the WAL will grow indefinitely. This is
obviously not ideal. Here we provide a small script + a few steps how to prune your WAL and keep it at a reasonable
size. Pruning the WAL is particularly important if you have many writes to Chroma (e.g. documents are added, updated or
deleted frequently).

Steps:

- Stop Chroma
- Create a backup of your `chroma.sqlite3` file in your persistent dir
- Check your current `chroma.sqlite3` size (e.g. `ls -lh /path/to/persist/dir/chroma.sqlite3`)
- Run the script below
- Check your current `chroma.sqlite3` size again to verify that the WAL has been pruned
- Start Chroma

Script (store it in a file like `compact-wal.sql`)

```sql
BEGIN TRANSACTION;
WITH to_delete AS (select t2.topic, t1.seq_id
                   from max_seq_id t1
                            left join segments t2 on t1.segment_id = t2.id
                   where t2.scope = 'METADATA')
DELETE
FROM embeddings_queue
WHERE EXISTS (SELECT 1
              FROM to_delete td
              WHERE td.topic = embeddings_queue.topic AND td.seq_id >= embeddings_queue.seq_id);


COMMIT;
VACUUM;
```

Run the script

```bash
sqlite3 /path/to/persist/dir/chroma.sqlite3 < compact-wal.sql
```
