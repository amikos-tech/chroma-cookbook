# Chroma Configuration

## Common Configurations Options

## Server Configuration

## Client Configuration

## HNSW Configuration

HNSW is the underlying library for Chroma vector indexing and search. Chroma exposes a number of parameters to configure
HNSW for your use case. All HNSW parameters are configured as metadata on the collection level.

| Parameter Name         | Description and Use                             | Values                                                                              |   |
|------------------------|-------------------------------------------------|-------------------------------------------------------------------------------------|---|
| `hnsw:space`           | Controls the distance metric of the HNSW index. | **Possible values**:<br/> - `l2`<br/> - `cosine`<br/> - `ip` <br/>**Default**: `l2` |   |
| `hnsw:construction_ef` |                                                 | **Possible values**: _Positive Integers_<br/>**Default**: `100`                     |   |
| `hnsw:search_ef`       |                                                 | **Possible values**: _Positive Integers_<br/>**Default**: `10`                      |   |
| `hnsw:M`               |                                                 | **Possible values**: _Positive Integers_<br/>**Default**: `16`                      |   |
| `hnsw:num_threads`     |                                                 | **Possible values**: _Positive Integers_<br/>**Default**: `<number of CPU cores>`   |   |
| `hnsw:resize_factor`   |                                                 | **Possible values**: _Positive Floating Point_<br/>**Default**: `1.2`               |   |
| `hnsw:batch_size`      |                                                 | **Possible values**: _Positive Integers_<br/>**Default**: `100`                     |   |
| `hnsw:sync_threshold`  |                                                 | **Possible values**: _Positive Integers_<br/>**Default**: `1000`                    |   |
