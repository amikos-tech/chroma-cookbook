# ChromaDB Backups

Depending on your use case there are a few different ways to backup your ChromaDB data.

- API export - this approach is relatively simple, slow for large datasets and may result in a backup that is missing
  some updates, should your data change frequently.
- Disk snapshot - this approach is fast, but is highly dependent on the underlying storage. Should your cloud provider
  and underlying volume support snapshots, this is a good option.
- Filesystem backup - this approach is also fast, but requires stopping your Chroma container to avoid data corruption.
  This is a good option if you can afford to stop your Chroma container for a few minutes.

!!! note "Other Options"

    Have another option in mind, feel free to [add](https://github.com/amikos-tech/chroma-cookbook) it to the above list.

## API Export

TBD

## Disk Snapshot

TBD

## Filesystem Backup

TBD