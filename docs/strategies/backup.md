# ChromaDB Backups

Depending on your use case there are a few different ways to back up your ChromaDB data.

- API export - this approach is relatively simple, slow for large datasets and may result in a backup that is missing
  some updates, should your data change frequently.
- Disk snapshot - this approach is fast, but is highly dependent on the underlying storage. Should your cloud provider
  and underlying volume support snapshots, this is a good option.
- Filesystem backup - this approach is also fast, but requires stopping your Chroma container to avoid data corruption.
  This is a good option if you can afford to stop your Chroma container for a few minutes.

!!! note "Other Options"

    Have another option in mind, feel free to [add](https://github.com/amikos-tech/chroma-cookbook) it to the above list.

## API Export

### With Chroma Datapipes

One way to export via the API is to use Tooling like Chroma Data Pipes. Chroma Data Pipes is a command-line tool that
provides a simple way import/export/transform ChromaDB data.

Exporting from local filesystem:

```bash
cdp export "file:///absolute/path/to/chroma-data/my-collection-name" > my_chroma_data.jsonl
```

Exporting from remote server:

```bash
cdp export "http://remote-chroma-server:8000/my-collection-name" > my_chroma_data.jsonl
```

!!! note "Get Help"

    Read more about Chroma Data Pipes [here](https://datapipes.chromadb.dev)

## Disk Snapshot

TBD

## Filesystem Backup

TBD