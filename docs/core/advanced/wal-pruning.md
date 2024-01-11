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

!!! danger "Stop Chroma"

    It is vitally important that you stop Chroma before you prune the WAL. 
    If you don't stop Chroma you risk corrupting

- ⚠️ Stop Chroma
- 💾 Create a backup of your `chroma.sqlite3` file in your persistent dir
- 👀 Check your current `chroma.sqlite3` size (e.g. `ls -lh /path/to/persist/dir/chroma.sqlite3`)
- 🖥️ Run the script below
- 🔭 Check your current `chroma.sqlite3` size again to verify that the WAL has been pruned
- 🚀 Start Chroma

Script (store it in a file like `compact-wal.sql`)

```sql title="compact-wal.sql"
--8<-- "compact-wal.sql"
```

Run the script

```shell
# Let's create a backup
tar -czvf /path/to/persist/dir/chroma.sqlite3.backup.tar.gz /path/to/persist/dir/chroma.sqlite3
lsof /path/to/persist/dir/chroma.sqlite3 # make sure that no process is using the file
sqlite3 /path/to/persist/dir/chroma.sqlite3 < compact-wal.sql
# start chroma
```
