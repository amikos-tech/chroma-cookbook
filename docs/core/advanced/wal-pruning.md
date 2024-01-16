# Write-ahead Log (WAL) Pruning

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

```py title="wal_clean.py"
#!/usr/bin/env python3
# Call the script: python wal_clean.py ./chroma-test-compact
import os
import sqlite3
from typing import cast, Optional, Dict
import argparse
import pickle


class PersistentData:
    """Stores the data and metadata needed for a PersistentLocalHnswSegment"""

    dimensionality: Optional[int]
    total_elements_added: int
    max_seq_id: int

    id_to_label: Dict[str, int]
    label_to_id: Dict[int, str]
    id_to_seq_id: Dict[str, int]


def load_from_file(filename: str) -> "PersistentData":
    """Load persistent data from a file"""
    with open(filename, "rb") as f:
        ret = cast(PersistentData, pickle.load(f))
        return ret


def clean_wal(chroma_persist_dir: str):
    if not os.path.exists(chroma_persist_dir):
        raise Exception(f"Persist {chroma_persist_dir} dir does not exist")
    if not os.path.exists(f'{chroma_persist_dir}/chroma.sqlite3'):
        raise Exception(
            f"SQL file not found int persist dir {chroma_persist_dir}/chroma.sqlite3")
    # Connect to SQLite database
    conn = sqlite3.connect(f'{chroma_persist_dir}/chroma.sqlite3')

    # Create a cursor object
    cursor = conn.cursor()

    # SQL query
    query = "SELECT id,topic FROM segments where scope='VECTOR'"  # Replace with your query

    # Execute the query
    cursor.execute(query)

    # Fetch the results (if needed)
    results = cursor.fetchall()
    wal_cleanup_queries = []
    for row in results:
        # print(row)
        metadata = load_from_file(
            f'{chroma_persist_dir}/{row[0]}/index_metadata.pickle')
        wal_cleanup_queries.append(
            f"DELETE FROM embeddings_queue WHERE seq_id < {metadata.max_seq_id} AND topic='{row[1]}';")

    cursor.executescript('\n'.join(wal_cleanup_queries))
    # Close the cursor and connection
    cursor.close()
    conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('persist_dir', type=str)
    arg = parser.parse_args()
    print(arg.persist_dir)
    clean_wal(arg.persist_dir)
```

Run the script

```shell
# Let's create a backup
tar -czvf /path/to/persist/dir/chroma.sqlite3.backup.tar.gz /path/to/persist/dir/chroma.sqlite3
lsof /path/to/persist/dir/chroma.sqlite3 # make sure that no process is using the file
python wal_clean.py /path/to/persist/dir/
# start chroma
```
