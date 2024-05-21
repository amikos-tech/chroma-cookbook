# Chroma Clients

## Persistent Client

To create your a local persistent client use the `PersistentClient` class. This client will store all data locally in a
directory on your machine at the path you specify.

```python
import chromadb

client = chromadb.PersistentClient(path="test")
```

`path` parameter must be a local path on the machine where Chroma is running. If the path does not exist, it will be
created. The path can be relative or absolute. If the path is not specified, the default is `chroma/` in the current
working directory.

### Uses of Persistent Client

The persistent client is useful for:

- **Local development**: You can use the persistent client to develop locally and test out ChromaDB.
- **Embedded applications**: You can use the persistent client to embed ChromaDB in your application. For example, if
  you are building a web application, you can use the persistent client to store data locally on the server.

## HTTP Client

Chroma also provides HTTP Client, suitable for use in a client-server mode. This client can be used to connect to a
remote ChromaDB server.

```python
import chromadb

client = chromadb.HttpClient(host="localhost", port=8000)
```

HTTP client takes two optional parameters:

- `host`: The host of the remote server. If not specified, the default is `localhost`.
- `port`: The port of the remote server. If not specified, the default is `8000`.
- `ssl`: If `True`, the client will use HTTPS. If not specified, the default is `False`.

### Uses of HTTP Client

The HTTP client is ideal for when you want to scale your application or move off of local machine storage. It is
important to note that there are trade-offs associated with using HTTP client:

- Network latency - The time it takes to send a request to the server and receive a response.
- Serialization and deserialization overhead - The time it takes to convert data to a format that can be sent over the
  network and then convert it back to its original format.
- Security - The data is sent over the network, so it is important to ensure that the connection is secure (we recommend
  using both HTTPS and authentication).
- Availability - The server must be available for the client to connect to it.
- Bandwidth usage - The amount of data sent over the network.
- Data privacy and compliance - Storing data on a remote server may require compliance with data protection laws and
  regulations.
- Difficulty in debugging - Debugging network issues can be more difficult than debugging local issues. The same applies
  to server-side issues.

### Host parameter special cases

The `host` parameter supports a more advanced syntax than just the hostname. You can specify the whole endpoint ULR (
without the API paths), e.g. `https://chromadb.example.com:8000/my_server/path/`. This is useful when you want to use a
reverse proxy or load balancer in front of your ChromaDB server.

## Ephemeral Client

Ephemeral client is a client that does not store any data on disk. It is useful for fast prototyping and testing. To get
started with an ephemeral client, use the `EphemeralClient` class.

```python
import chromadb

client = chromadb.EphemeralClient()
```

## Environmental Variable Configured Client

You can also configure the client using environmental variables. This is useful when you want to configure any of the
client configurations listed above via environmental variables.

```python
import chromadb

client = chromadb.Client()
```

Short list of env variables that can be used to configure the client:

> **Note**: For complete list of available settings
>
check ([`chromadb.config.Settings`](https://github.com/chroma-core/chroma/blob/c665838b0d143e2c2ceb82c4ade7404dc98124ff/chromadb/config.py#L83)).

| Env Variable            | Description                                                                                                                                                         | Default                           |
|-------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------|
| chroma_api_impl         | The API implementation to use. There are two options:<br/> `chromadb.api.segment.SegmentAPI` (persistent client) <br/> `chromadb.api.fastapi.FastAPI` (Http client) | `chromadb.api.segment.SegmentAPI` |
| chroma_server_host      | The host of the remote server. This is required for HttpClient only.                                                                                                | `None`                            |
| chroma_server_http_port | The port of the remote server. This is required for HttpClient only.                                                                                                | `8000`                            |
| chroma_server_headers   | The headers to be sent to the server. The setting can be used to pass additional headers to the server. An example of this can be auth headers.                     | `None`                            |
