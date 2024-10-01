# Frequently Asked Questions and Commonly Encountered Issues

This section provides answers to frequently asked questions and information on commonly encountered problem when working
with Chroma. These information below is based on interactions with the Chroma community.

!!! warn "404 Answer Not Found"

    If you have a question that is not answered here, please reach out to us on our [Discord @taz](https://discord.gg/MMeYNTmh3x)
    or [GitHub Issues](https://github.com/chroma-core/chroma/issues)

## Frequently Asked Questions

### What does Chroma use to index embedding vectors?

Chroma uses its own [fork]() of HNSW lib for indexing and searching embeddings. In addition to HNSW, Chroma also uses a
Brute Force index, which acts as a buffer (prior to updating the HNSW graph) and performs exhaustive search using the
same distance metric as the HNSW index.

**Alternative Questions:**

- What library does Chroma use for vector index and search?
- What algorithm does Chroma use for vector search?

### How to set dimensionality of my collections?

When creating a collection, its dimensionality is determined by the dimensionality of the first embedding added to it.
Once the dimensionality is set, it cannot be changed. Therefore, it is important to consistently use embeddings of the
same dimensionality when adding or querying a collection.

**Example:**

```python
import chromadb

client = chromadb.Client()

collection = client.create_collection("name")  # dimensionality is not set yet

# add an embedding to the collection
collection.add(ids=["id1"], embeddings=[[1, 2, 3]])  # dimensionality is set to 3
```

**Alternative Questions:**

- Can I change the dimensionality of a collection?

### Can I use `transformers` models with Chroma?

Generally, yes you can use `transformers` models with Chroma. Although Chroma does not provide a wrapper for this, you
can use `SentenceTransformerEmbeddingFunction` to achieve the same result. The sentence-transformer library will
implicitly do mean-pooling on the last hidden layer, and you'll get a warning about
it - `No sentence-transformers model found with name [model name]. Creating a new one with MEAN pooling.`

**Example:**

```python
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

ef = SentenceTransformerEmbeddingFunction(model_name="FacebookAI/xlm-roberta-large-finetuned-conll03-english")

print(ef(["test"]))
```

!!! warn "Warning"

    Not all models will work with the above method. Also mean pooling may not be the best strategy for the model. 
    Read the model card and try to understand what if any pooling the creators recommend. You may also want to normalize
    the embeddings before adding them to Chroma (pass `normalize_embeddings=True` to the `SentenceTransformerEmbeddingFunction` 
    EF constructor).

### Should I store my documents in Chroma?

> Note: This applies to Chroma single-node and local embedded clients. (Chroma version ca. 0.5.x)

Chroma allows users to store both embeddings and documents, alongside metadata, in collections. Documents and metadata
are both optional and depending on your use case you may choose to store them in Chroma or externally, or not at all.

Here are some pros/cons to help you decide whether to store your documents in Chroma:

**Pros:**

- Keeps all the data in the same place. You don't have to manage a separate DB for the documents
- Allows you to do keyword searches on the documents

**Cons:**

- The database can grow substantially in size because documents are effectively duplicated - once for storing them as
  metadata for queries and another for the FTS5 index.
- Queries performance hit

### "Dude, where's my data?"

If you are new to Chroma, you might be asking yourself: "Where is my data been stored?". As, per usual, the answer is: "It depends".

Generally Chroma uses `PERSIST_DIRECTORY` to store the data, but when running in CLI mode, this is overridden by the CLI itself.

- Running in CLI mode (`--path` is not specified) data is stored in the `./chroma_data` directory.
- Running in Jupyter notebook, Colab or directly using `PersistentClient` (unless `path` is specified or env var `PERSIST_DIRECTORY` is set), data is stored in the `./chroma` directory.
- Running with docker compose (from source repo), the data is stored in docker volume named `chroma-data` (unless an explicit volume binding is specified)
- Running with `docker run` (no volume binding with `-v`) the data is stored in the container and is lost ☠️ when the container is removed.

In all other cases where env var, parameter or binding is specified, the data is stored in your specified directory.

## Commonly Encountered Problems

### Collection Dimensionality Mismatch

**Symptoms:**

This error usually exhibits in the following error message:

`chromadb.errors.InvalidDimensionException: Embedding dimension XXX does not match collection dimensionality YYY`

**Context:**

When adding/upserting or querying Chroma collection. This error is more visible/pronounced when using the Python APIs,
but will
also show up in also surface in other clients.

**Cause:**

You are trying to add or query a collection with vectors of a different dimensionality than the collection was created
with.

**Explanation/Solution:**

When you first create a collection `client.create_collection("name")`, the collection will not have knowledge of its
dimensionality so that allows you to add vectors of any dimensionality to it. However, once your first batch of
embeddings is added to the collection, the collection will be locked to that dimensionality. Any subsequent query or
add operation must use embeddings of the same dimensionality. The dimensionality of the embeddings is a characteristic
of the embedding model (EmbeddingFunction) used to generate the embeddings, therefore it is important to consistently
use the same EmbeddingFunction when adding or querying a collection.

!!! tip "Tip"

    If you do not specify an `embedding_function` when creating (`client.create_collection`) or getting
    (`client.get_or_create_collection`) a collection, Chroma wil use its default [embedding function](https://docs.trychroma.com/embeddings#default-all-minilm-l6-v2).

### Large Distances in Search Results

**Symptoms:**

When querying a collection, you get results that are in the 10s or 100s.

**Context:**

Frequently when using you own embedding function.

**Cause:**

The embeddings are not normalized.

**Explanation/Solution:**

`L2` (Euclidean distance) and `IP` (inner product) distance metrics are sensitive to the magnitude of the vectors.
Chroma uses `L2` by
default. Therefore, it is recommended to normalize the embeddings before adding them to Chroma.

Here is an example how to normalize embeddings using L2 norm:

```python
import numpy as np


def normalize_L2(vector):
    """Normalizes a vector to unit length using L2 norm."""
    norm = np.linalg.norm(vector)
    if norm == 0:
        return vector
    return vector / norm
```

### `OperationalError: no such column: collections.topic`

**Symptoms:**

The error `OperationalError: no such column: collections.topic` is raised when trying to access Chroma locally or
remotely.

**Context:**

After upgrading to Chroma `0.5.0` or accessing your Chroma persistent data with Chroma client version `0.5.0`.

**Cause:**

In version `0.5.x` Chroma has made some SQLite3 schema changes that are not backwards compatible with the previous
versions. Once you access your persistent data on the server or locally with the new Chroma version it will
automatically migrate to the new schema. This operation is not reversible.

**Explanation/Solution:**

To resolve this issue you will need to upgrade all your clients accessing the Chroma data to version `0.5.x`.

Here's a link to the migration performed by
Chroma - https://github.com/chroma-core/chroma/blob/main/chromadb/migrations/sysdb/00005-remove-topic.sqlite.sql

### `sqlite3.OperationalError: database or disk is full`

**Symptoms:**

The error `sqlite3.OperationalError: database or disk is full` is raised when trying to access Chroma locally or
remotely. The error can occur in any of the Chroma API calls.

**Context:**

There are two contexts in which this error can occur:

- When the persistent disk space is full or the disk quota is reached - This is where your `PERSIST_DIRECTORY` points
  to.
- When there is not enough space in the temporary director - frequently `/tmp` on your system or container.

**Cause:**

When inserting new data and your Chroma persistent disk space is full or the disk quota is reached, the database will
not be able to write metadata to SQLite3 db thus raising the error.

When performing large queries or multiple concurrent queries, the temporary disk space may be exhausted.

**Explanation/Solution:**

To work around the first issue, you can increase the disk space or clean up the disk space. To work around the second
issue, you can increase the temporary disk space (works fine for containers but might be a problem for VMs) or point
SQLite3 to a different temporary directory by using `SQLITE_TMPDIR` environment variable.

??? tip "SQLite Temp File"

    More information on how sqlite3 uses temp files can be found [here](https://www.sqlite.org/tempfiles.html).

### `RuntimeError: Chroma is running in http-only client mode, and can only be run with 'chromadb.api.fastapi.FastAPI'`

**Symptoms and Context:**

The following error is raised when trying to create a new `PersistentClient`, `EphemeralClient`, or `Client`:

```text
RuntimeError: Chroma is running in http-only client mode, and can only be run with 'chromadb.api.fastapi.FastAPI' 
as the chroma_api_impl. see https://docs.trychroma.com/usage-guide?lang=py#using-the-python-http-only-client for more information.
```

**Cause:**

There are two possible causes for this error:

- `chromadb-client` is installed and you are trying to work with a local client.
- Dependency conflict with `chromadb-client` and `chromadb` packages.

**Explanation/Solution:**

Chroma (python) comes in two packages - `chromadb` and `chromadb-client`. The `chromadb-client` package is used to
interact with
a remote Chroma server. If you are trying to work with a local client, you should use the `chromadb` package. If you are
planning to interact with remote server only it is recommended to use the `chromadb-client` package.

If you intend to work locally with Chroma (e.g. embed in your app) then we suggest that you uninstall
the `chromadb-client` package and install the `chromadb` package.

To check which package you have installed:

```bash
pip list | grep chromadb
```

To uninstall the `chromadb-client` package:

```bash
pip uninstall chromadb-client
```

??? tip "Working with virtual environments"

    It is recommended to work with virtual environments to avoid dependency conflicts. To create a virtual environment 
    you can use the following snippet:
    
    ```bash
    pip install virtualenv
    python -m venv myenv
    source myenv/bin/activate
    pip install chromadb # and other packages you need
    ```
    Alternatively you can use `conda` or `poetry` to manage your environments.

??? tip "Default Embedding Function"

    Default embedding function - `chromadb.utils.embedding_functions.DefaultEmbeddingFunction` - can only be used with
    `chromadb` package.

### `ValueError: You must provide an embedding function to compute embeddings`

**Symptoms and Context:**

The
error `ValueError: You must provide an embedding function to compute embeddings.https://docs.trychroma.com/embeddings"`
is frequently raised when trying to add embeddings to a collection using Python thin client (`chromadb-client` package).

**Cause:**

To reduce the size of the `chromadb-client` package the default embedding function which requires `onnxruntime` package
is not included and is instead aliased to `None`.

**Explanation/Solution:**

To resolve this issue you must always provide an embedding function when you call `get_collection`
or `get_or_create_collection` methods to provide the Http client with the necessary information to compute embeddings.

