# Maintenance

This section describes maintenance tooling and procedures for running your Chroma database.

## Chroma Ops (Tooling)

[Chroma Ops](https://github.com/amikos-tech/chromadb-ops) is a maintenance CLI for Chroma. It provides a set of commands for inspecting, configuring and improving the performance of your Chroma database.

### Use Cases

Chroma Ops is designed to help you maintain a healthy Chroma database. It can also be used for inspecting the state of your database. The following use cases are supported:

- 📦 Database Maintenance
  - [`db info`](#info) - gathers general information about your Chroma persistent database
  - [`db clean`](#clean) - cleans up the database from unused files (for now only orphanated HNSW segment directories)
- 📝 Write-Ahead Log (WAL) Maintenance
  - [`wal info`](#info-1) - gathers information about the Write-Ahead Log (WAL)
  - [`wal commit`](#commit) - commits the WAL to all collections with outstanding changes
  - [`wal clean`](#clean-1) - cleans up the WAL from committed transactions. Recent Chroma version automatically prune the WAL so this is not needed unless you have older version of Chroma or disabled automatic WAL pruning.
  - [`wal export`](#export) - exports the WAL to a `jsonl` file. This can be used for debugging and for auditing.
  - [`wal config`](#configuration) - allows you to configure the WAL for your Chroma database.
- 🔍 Full Text Search (FTS) Maintenance
  - [`fts rebuild`](#rebuild) - rebuilds the FTS index for all collections or change the tokenizer.
- 🧬 Vector Index (HNSW) Maintenance
  - [`hnsw info`](#info-2) - gathers information about the HNSW index for a given collection
  - [`hnsw rebuild`](#rebuild-1) - rebuilds the HNSW index for a given collection and allows the modification of otherwise immutable (construction-only) parameters. Useful command to keep your HNSW index healthy and prevent fragmentation.
  - [`hnsw config`](#configuration-1) - allows you to configure the HNSW index for your Chroma database.
- 📸 Collection Maintenance
  - [`collection snapshot`](#snapshot) - creates a snapshot of a collection. The snapshots are self-contained and are meant to be used for backup and restore.

!!! tip "Need help/Need more?"

    If you need help or need more features, please join the [Discord server](https://discord.gg/MMeYNTmh3x) and let us know. Or just do a pull request on [GitHub](https://github.com/amikos-tech/chromadb-ops/pulls).

### Installation

Chroma Ops can be installed using pip:

```bash
pip install --upgrade chromadb-ops
```

### Usage

#### Database Maintenance

##### Database Info

What it does: Gathers general information about your Chroma persistent database (works only for local persistent databases).

Why it's useful: Run this command to better understand the current state of your database. It can provide you with invaluable information about any potential issues and also helps us help you in debugging issues.

```bash
chops db info /path/to/persist_dir
```

Options:

- `--skip-collection-names` (`-s`) - to skip specific collections
- `--privacy-mode` (`-p`) - privacy mode hides paths and collection names so that the output can be shared without
  exposing sensitive information

When sharing larger outputs consider storing the output in a file:

```bash
chops db info /path/to/persist_dir -p > chroma_info.txt
```

Example output:

```console
chops db info smallc

                                 General Info
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    Property ┃ Value                                          ┃
┡━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│              Chroma Version │ 0.5.5                                          │
│        Number of Collection │ 1                                              │
│           Persist Directory │ /tmp/tmp9l3ceuvp                               │
│      Persist Directory Size │ 142.2MiB                                       │
│              SystemDB size: │ 81.6MiB (/tmp/tmp9l3ceuvp/chroma.sqlite3)      │
│     Orphan HNSW Directories │ []                                             │
└─────────────────────────────┴────────────────────────────────────────────────┘
───────────────────────────────── Collections ──────────────────────────────────
───────────────────────────────────── test ─────────────────────────────────────
                             'test' Collection Data
┏━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃         Table Data ┃ Value                                                   ┃
┡━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│                 ID │ 9e80e4fd-fd4b-47b8-810c-e8ffa57c1912                    │
│               Name │ test                                                    │
│           Metadata │ None                                                    │
│          Dimension │ 1536                                                    │
│             Tenant │ default_tenant                                          │
│           Database │ default_database                                        │
│            Records │ 10,000                                                  │
│        WAL Entries │ 10,000                                                  │
└────────────────────┴─────────────────────────────────────────────────────────┘
─────────────────────────────────── Segments ───────────────────────────────────
                            Metadata Segment (test)
┏━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                Property ┃ Value                                              ┃
┡━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│              Segment ID │ 832fa2cd-6c40-4eee-ad7d-35f260acaaaa               │
│                    Type │ urn:chroma:segment/metadata/sqlite                 │
│                   Scope │ METADATA                                           │
│        SysDB Max Seq ID │ 10,000                                             │
└─────────────────────────┴────────────────────────────────────────────────────┘
                              HNSW Segment (test)
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                     Property ┃ Value                                         ┃
┡━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│                   Segment ID │ 13609103-d317-4556-a744-008c96229b72          │
│                         Type │ urn:chroma:segment/vector/hnsw-local-persist… │
│                        Scope │ VECTOR                                        │
│                         Path │ /tmp/tmp9l3ceuvp/13609103-d317-4556-a744-008… │
│             SysDB Max Seq ID │ 0                                             │
│                HNSW Dir Size │ 60.6MiB                                       │
│     HNSW Metadata Max Seq ID │ 10,000                                        │
│   HNSW Metadata Total Labels │ 10,000                                        │
│                      WAL Gap │ 0                                             │
│ HNSW Raw Total Active Labels │ 10,000                                        │
│    HNSW Raw Allocated Labels │ 10,000                                        │
│           HNSW Orphan Labels │ set()                                         │
│          Fragmentation Level │ 0.0                                           │
└──────────────────────────────┴───────────────────────────────────────────────┘
```

⚠️ Interesting things to look for:

- Fragmentation Level - the higher the value the more unnecessary memory and performance hits your HNSW index suffers.
  It needs to be rebuilt.
- Orphan HNSW Directories - these are directories that are not associated with any collection. They can be safely
  deleted.
- WAL Entries - high values usually means that you need prune your WAL. Use either this tool or
  the [official Chroma CLI](https://cookbook.chromadb.dev/core/advanced/wal-pruning/#chroma-cli).
- HNSW Orphan Labels - this must always be empty set, if you see anything else report it
  in [Discord @taz](https://discord.gg/MMeYNTmh3x).


**How to Read the output**

**_General Info_**

This section presents general Chroma persistent dir info.

- Chroma Version - the currently installed Chroma version.
- Number of Collection - the number of collections in the persistent dir.
- Persist Directory - the path to the persistent dir (if privacy mode is off).
- Persist Directory Size - the size of the persistent dir.
- SystemDB size - the size of the system database (if privacy mode is off the full path to the sqlite3 file is shown).
- Orphan HNSW Directories - a list of orphan HNSW directories. These directories are present in the persistent dir but
  are not associated with any collection.

**_Collections_**

- ID - the collection ID.
- Name - the collection name.
- Metadata - the metadata associated with the collection.
- Dimension - the dimension of the embeddings in the collection. (this can be None in case no vectors are present and
  the collection is newly created).
- Tenant - the tenant of the collection.
- Database - the database of the collection.
- Records - the number of records in the collection.
- WAL Entries - the number of WAL entries in the collection (as of 0.5.5 for new instances Chroma will clean WAL for
  each collection periodically).

**_Metadata Segment_**

- Segment ID - the segment ID.
- Type - the segment type.
- Scope - the segment scope.
- SysDB Max Seq ID - the maximum sequence ID in the system database.

**_HNSW Segment_**

- Segment ID - the segment ID.
- Type - the segment type.
- Scope - the segment scope.
- Path - the path to the HNSW directory.
- SysDB Max Seq ID - the maximum sequence ID in the system database.
- HNSW Dir Size - the size of the HNSW directory.
- HNSW Metadata Max Seq ID - the maximum sequence ID in the HNSW metadata.
- HNSW Metadata Total Labels - the total number of labels in the HNSW metadata.
- WAL Gap - the difference between the maximum sequence ID in the system database and the maximum sequence ID in the
  HNSW
  metadata. The gap usually represents the number of WAL entries that are not committed to the HNSW index.
- HNSW Raw Total Active Labels - the total number of active labels in the HNSW index.
- HNSW Raw Allocated Labels - the total number of allocated labels in the HNSW index.
- HNSW Orphan Labels - a set of orphan labels in the HNSW index. These are labels in the HNSW index that are not visible
  to Chroma as they are not part of the metadata. This set should always be empty, if not please report it!!!
- Fragmentation Level - the fragmentation level of the HNSW index.

##### Database Clean

_What it does_: Cleans up the database from unused files. It will remove all orphanated HNSW segment directories.

_Why it's useful_: Orphanated HNSW segment directories sometimes are the byproduct of a filesystem failure to remove the HNSW segment directory, most commonly encountered on Windows systems, but any type of file loocking or disk operation failure can cause Chroma to leave behind these directories.

```bash
chops db clean /path/to/persist_dir
```

Supported options are:

- `--dry-run` (`-d`) - to see what would be deleted without actually deleting anything.


Example output:

```console
chops db clean smallc
ChromaDB version: 0.6.2
Cleaning up orphanated segment dirs...

                             Orphanated HNSW segment dirs                             
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Segment ID                           ┃ Path                                        ┃
┡━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│ 2E9021A8-A767-4339-B2C2-2F4B22C05F1D │ smallc/2E9021A8-A767-4339-B2C2-2F4B22C05F1D │
└──────────────────────────────────────┴─────────────────────────────────────────────┘

Are you sure you want to delete these segment dirs? [y/N]: 
```

#### WAL Maintenance

##### WAL Info

_What it does_: Gathers information about the Write-Ahead Log (WAL).

_Why it's useful_: Run this command to better understand the current state of the Write-Ahead Log (WAL). It can provide you with invaluable information about any potential issues and also helps us help you in debugging issues.

```bash
chops wal info /path/to/persist_dir
```

Example output:

```console
chops wal info smallc
ChromaDB version: 0.6.2

WAL config is set to: auto purge.
                                         WAL Info                                         
┏━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━┓
┃ Collection ┃ Topic                                                             ┃ Count ┃
┡━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━┩
│ test       │ persistent://default/default/97f5234e-d02a-43b8-9909-99447950c949 │ 20    │
└────────────┴───────────────────────────────────────────────────────────────────┴───────┘
```

##### WAL Export

_What it does_: Exports the Write-Ahead Log (WAL) to a `jsonl` file. This can be used for debugging and for auditing.

_Why it's useful_: This command is useful for exporting the Write-Ahead Log (WAL) to a `jsonl` file. This can be used for debugging and for auditing.

```bash
chops wal export /path/to/persist_dir
```

Example output:

```console
chops wal export smallc --out wal.jsonl
ChromaDB version: 0.6.2
       Exporting WAL        
┏━━━━━━━━━━━━┳━━━━━━━━━━━━━┓
┃ Collection ┃ WAL Entries ┃
┡━━━━━━━━━━━━╇━━━━━━━━━━━━━┩
│ test       │ 20          │
└────────────┴─────────────┘

Are you sure you want to export the WAL? [y/N]: y
Exported 20 rows
```

##### WAL Commit

_What it does_: Commits the Write-Ahead Log (WAL) to all collections with outstanding changes.

_Why it's useful_: This command is useful for committing the Write-Ahead Log (WAL) to all collections with outstanding changes.

```bash
chops wal commit /path/to/persist_dir
```

Options:

- `--skip` (`-s`) - skip certain collections by running `chops wal commit /path/to/persist_dir --skip <collection_name>`
- `--yes` (`-y`) - skip confirmation prompt (default: `False`, prompt will be shown)

Example output:

```console
chops wal commit smallc
ChromaDB version: 0.6.2
     WAL Commit Summary     
┏━━━━━━━━━━━━┳━━━━━━━━━━━━━┓
┃ Collection ┃ WAL Entries ┃
┡━━━━━━━━━━━━╇━━━━━━━━━━━━━┩
│ test       │ 20          │
│ test1      │ 0           │
└────────────┴─────────────┘
   Skipped    
 Collections  
┏━━━━━━━━━━━━┓
┃ Collection ┃
┡━━━━━━━━━━━━┩
└────────────┘

Are you sure you want to commit the WAL in smallc? As part of the WAL commit action your database will be migrated to currently installed version 0.6.2. [y/N]: y
Processing index for collection test (0137d64b-8d71-42f5-b0d9-28716647b068) - total vectors in index 20
WAL commit completed.
```

##### WAL Configuration

_What it does_: Configures the Write-Ahead Log (WAL) for your Chroma database.

_Why it's useful_: This command is useful for configuring the Write-Ahead Log (WAL) for your Chroma database.

```bash
chops wal config /path/to/persist_dir --purge off
```

Options:

- `--purge` option can be set to `auto` (automatically purge the WAL when the number of records in the collection exceeds the number of
  records in the WAL) or `off` (disable automatic purge of the WAL). Automatic WAL purge is enabled by default. The automatic purge keeps your slite3 file smaller and faster, but it makes it hard or impossible to restore Chroma.
- `--yes` option can be set to `true` (skip confirmation prompt) or `false` (show confirmation prompt). The default is `false`.

Example output:

```console
chops wal config smallc --purge off
ChromaDB version: 0.6.2
                           Current WAL config                            
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Config key                                ┃ Config Change             ┃
┡━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│ Automatically purge (automatically_purge) │ True (old) -> False (new) │
└───────────────────────────────────────────┴───────────────────────────┘

Are you sure you want to update the WAL config? [y/N]: y
WAL config updated successfully!
```

#### Full Text Search (FTS) Maintenance

##### FTS Rebuild

_What it does_: Rebuilds the Full Text Search (FTS) index for all collections.

_Why it's useful_: This command is useful for rebuilding the Full Text Search (FTS) index for all collections.

```bash
chops fts rebuild /path/to/persist_dir
```

Additional options:

- `--yes` (`-y`) - skip confirmation prompt (default: `False`, prompt will be shown)
- `--tokenizer` (`-t`) - the tokenizer to use for the index.

Example output:

```console
chops fts rebuild --tokenizer unicode61 smallc
ChromaDB version: 0.6.2

Are you sure you want to rebuild the FTS index in smallc? This action will drop the existing FTS index and create a new one. [y/N]: y
Rebuilt FTS. Will try to start your Chroma now.
NOTE: Depending on the size of your documents in Chroma it may take a while for Chroma to start up again.
Chroma started successfully. FTS rebuilt.

```

#### HNSW Maintenance

##### HNSW Info

_What it does_: Gathers information about the HNSW index for a given collection.

_Why it's useful_: This command is useful for gathering information about the HNSW index for a given collection.

```bash
chops hnsw info /path/to/persist_dir
```

Additional options:

- `--collection` (`-c`) - the collection name
- `--verbose` (`-v`) - If specified, the HNSW index will be loaded for more accurate fragmentation level reporting.

Example output:

```console
chops hnsw info smallc -c test
ChromaDB version: 0.6.2
    HNSW details for collection test in default_database database    
┏━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Metric              ┃ Value                                       ┃
┡━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│ Space               │ cosine                                      │
│ Dimensions          │ 384                                         │
│ EF Construction     │ 200                                         │
│ EF Search           │ 100                                         │
│ M                   │ 64                                          │
│ Number of threads   │ 16                                          │
│ Resize factor       │ 1.2                                         │
│ Batch size          │ 100                                         │
│ Sync threshold      │ 1000                                        │
│ Segment ID          │ 0137d64b-8d71-42f5-b0d9-28716647b068        │
│ Path                │ smallc/0137d64b-8d71-42f5-b0d9-28716647b068 │
│ Has metadata        │ True                                        │
│ Number of elements  │ 20                                          │
│ Collection ID       │ 97f5234e-d02a-43b8-9909-99447950c949        │
│ Index size          │ 41.6KiB                                     │
│ Fragmentation level │ 0.00% (estimated)                           │
└─────────────────────┴─────────────────────────────────────────────┘
```

##### HNSW Rebuild

_What it does_: Rebuilds the HNSW index for a given collection and allows the modification of otherwise immutable (construction-only) parameters.

_Why it's useful_: This command is useful for rebuilding the HNSW index for a given collection and allows the modification of otherwise immutable (construction-only) parameters.

```bash
chops hnsw rebuild /path/to/persist_dir
```

Example output:

```console
chops hnsw rebuild smallc -c test --m 64 --construction-ef 200
ChromaDB version: 0.6.2
    HNSW details for collection test in default_database database    
┏━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Metric              ┃ Value                                       ┃
┡━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│ Space               │ cosine                                      │
│ Dimensions          │ 384                                         │
│ EF Construction     │ 200                                         │
│ EF Search           │ 100                                         │
│ M                   │ 64                                          │
│ Number of threads   │ 16                                          │
│ Resize factor       │ 1.2                                         │
│ Batch size          │ 100                                         │
│ Sync threshold      │ 1000                                        │
│ Segment ID          │ 0137d64b-8d71-42f5-b0d9-28716647b068        │
│ Path                │ smallc/0137d64b-8d71-42f5-b0d9-28716647b068 │
│ Has metadata        │ True                                        │
│ Number of elements  │ 20                                          │
│ Collection ID       │ 97f5234e-d02a-43b8-9909-99447950c949        │
│ Index size          │ 47.6KiB                                     │
│ Fragmentation level │ 0.00% (estimated)                           │
└─────────────────────┴─────────────────────────────────────────────┘
    HNSW segment config changes     
┏━━━━━━━━━━━━━━━━━━━━━━┳━━━━━┳━━━━━┓
┃ Config Key           ┃ Old ┃ New ┃
┡━━━━━━━━━━━━━━━━━━━━━━╇━━━━━╇━━━━━┩
│ hnsw:construction_ef │ 100 │ 200 │
│ hnsw:M               │ 102 │ 64  │
└──────────────────────┴─────┴─────┘

Are you sure you want to rebuild this index? [y/N]: y
Backup of old index created at smallc/0137d64b-8d71-42f5-b0d9-28716647b068_backup_20250208100514
    HNSW details for collection test in default_database database    
┏━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Metric              ┃ Value                                       ┃
┡━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│ Space               │ cosine                                      │
│ Dimensions          │ 384                                         │
│ EF Construction     │ 200                                         │
│ EF Search           │ 100                                         │
│ M                   │ 64                                          │
│ Number of threads   │ 16                                          │
│ Resize factor       │ 1.2                                         │
│ Batch size          │ 100                                         │
│ Sync threshold      │ 1000                                        │
│ Segment ID          │ 0137d64b-8d71-42f5-b0d9-28716647b068        │
│ Path                │ smallc/0137d64b-8d71-42f5-b0d9-28716647b068 │
│ Has metadata        │ True                                        │
│ Number of elements  │ 20                                          │
│ Collection ID       │ 97f5234e-d02a-43b8-9909-99447950c949        │
│ Index size          │ 41.6KiB                                     │
│ Fragmentation level │ 0.00%                                       │
└─────────────────────┴─────────────────────────────────────────────┘
```

##### HNSW Config

_What it does_: Configures the HNSW index for your Chroma database.

_Why it's useful_: This command is useful for configuring the HNSW index for your Chroma database.

```bash
chops hnsw config /path/to/persist_dir --collection <collection_name>
```

Options:

- `--search-ef` (`-e`) - the search ef to use for the index.
- `--num-threads` (`-t`) - the number of threads to use for the index.
- `--resize-factor` (`-r`) - the resize factor to use for the index.
- `--batch-size` (`-b`) - the batch size to use for the index.
- `--sync-threshold` (`-s`) - the sync threshold to use for the index.

Example output:

```console
chops hnsw config smallc -c test --search-ef 100
ChromaDB version: 0.6.2
 HNSW segment config changes  
┏━━━━━━━━━━━━━━━━┳━━━━━┳━━━━━┓
┃ Config Key     ┃ Old ┃ New ┃
┡━━━━━━━━━━━━━━━━╇━━━━━╇━━━━━┩
│ hnsw:search_ef │ 110 │ 100 │
└────────────────┴─────┴─────┘

Are you sure you want to apply these changes? [y/N]: y
HNSW index configuration modified successfully
```

#### Collection Maintenance

##### Collection Snapshot

_What it does_: Creates a snapshot of a collection. The snapshots are self-contained sqlite3 files.

_Why it's useful_: The command is useful if you want to create a backup or a point-in-time copy of a collection in its entirety. The snapshot files are self-contained and use sqlite3 as a storage engine. You can use `sqlite3` commands to inspect the snapshot files.

```bash
chops collection snapshot /path/to/persist_dir --collection <collection_name> -o /path/to/snapshot.sqlite3
```

Additional options:

- `--yes` (`-y`) - skip confirmation prompt (default: `False`, prompt will be shown)
- `--collection` (`-c`) - the collection name
- `--output` (`-o`) - the path to the output snapshot file

Example output:

```console
chops collection snapshot ./smallc --collection test -o snapshot.sqlite3
ChromaDB version: 0.6.2

Are you sure you want to overwrite /Users/tazarov/experiments/chroma/chromadb-ops/snapshot.sqlite3 file? [y/N]: y
Bootstrapping snapshot database...
Snapshot database bootstrapped in /Users/tazarov/experiments/chroma/chromadb-ops/snapshot.sqlite3
Copying collection test to snapshot database...
  Copying collection to snapshot   
            database...            
┏━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━┓
┃ Table                   ┃ Count ┃
┡━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━┩
│ Embeddings Queue        │ 20    │
│ Max Seq ID              │ 1     │
│ Embeddings              │ 20    │
│ Embedding Metadata      │ 20    │
│ Segments                │ 2     │
│ Segment Metadata        │ 3     │
│ Collections             │ 1     │
│ Collection Metadata     │ 0     │
│ HNSW Segment Data Files │ 5     │
└─────────────────────────┴───────┘

Are you sure you want to copy this collection to the snapshot database? [y/N]: y
Collection test copied to snapshot database in /Users/tazarov/experiments/chroma/chromadb-ops/snapshot.sqlite3
```




