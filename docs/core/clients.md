# Chroma Clients

!!! tip "Chroma Settings Object"

    The below is only a partial list of Chroma configuration options. For full list check the code
    [`chromadb.config.Settings`](https://github.com/chroma-core/chroma/blob/c665838b0d143e2c2ceb82c4ade7404dc98124ff/chromadb/config.py#L83) or
    the [ChromaDB Configuration](configuration.md) page.

## Persistent Client

To create your a local persistent client use the `PersistentClient` class. This client will store all data locally in a
directory on your machine at the path you specify.

```python
import chromadb
from chromadb.config import DEFAULT_TENANT, DEFAULT_DATABASE, Settings

client = chromadb.PersistentClient(
    path="test",
    settings=Settings(),
    tenant=DEFAULT_TENANT,
    database=DEFAULT_DATABASE,
)
```

**Parameters**:

1. `path` - parameter must be a local path on the machine where Chroma is running. If the path does not exist, it will
   be created. The path can be relative or absolute. If the path is not specified, the default is `./chroma` in the
   current working directory.
2. `settings` - Chroma settings object.
3. `tenant` - the tenant to use. Default is `default_tenant`.
4. `database` - the database to use. Default is `default_database`.

!!! tip "Positional Parameters"

    Chroma `PersistentClient` parameters are positional, unless keyword arguments are used.

### Uses of Persistent Client

The persistent client is useful for:

- **Local development**: You can use the persistent client to develop locally and test out ChromaDB.
- **Embedded applications**: You can use the persistent client to embed ChromaDB in your application. This means that
  you can ship Chroma bundled with your product or services, thus simplifying the deployment process.
- **Simplicity**: If you do not wish to incur the complexities associated with setting up and operating a Chroma
  server (arguably Hosted-Chroma will resolve this).
- **Data privacy**: If you are working with sensitive data and do not want to store it on a remote server.
- **Optimize performance**: If you want to reduce latency.

!!! warn "The right tool for the job"

    When evaluating the use of local `PersistentClient` one should always factor in the scale of the application. 
    Similar to SQLite vs Posgres/MySQL, `PersistentClient` vs `HTTPClient` with Chroma server, application architectural
    characteristics (such as complexity, scale, performance etc) should be considered when deciding to use one or the other.

## HTTP Client

Chroma also provides HTTP Client, suitable for use in a client-server mode. This client can be used to connect to a
remote ChromaDB server. The HTTP client can operate in synchronous or asynchronous mode (see examples below)

=== "Python Sync"

    ```python
    import chromadb
    from chromadb.config import DEFAULT_TENANT, DEFAULT_DATABASE, Settings
    
    client = chromadb.HttpClient(
        host="localhost",
        port=8000,
        ssl=False,
        headers=None,
        settings=Settings(),
        tenant=DEFAULT_TENANT,
        database=DEFAULT_DATABASE,
    )
    ```
    
    **Parameters**:
    
    1. `host` - The host of the remote server. If not specified, the default is `localhost`.
    2. `port` - The port of the remote server. If not specified, the default is `8000`.
    3. `ssl` - If `True`, the client will use HTTPS. If not specified, the default is `False`.
    4. `headers` - (optional): The headers to be sent to the server. The setting can be used to pass additional headers to the
        server. An example of this can be auth headers.
    5. `settings` - Chroma settings object.
    6. `tenant` - the tenant to use. Default is `default_tenant`.
    7. `database` - the database to use. Default is `default_database`.
    
    !!! tip "Positional Parameters"
    
        Chroma `HttpClient` parameters are positional, unless keyword arguments are used.

=== "Python Async"

    ```python
    import asyncio
    import chromadb
    # Apply nest_asyncio to allow running nested event loops in jupyter notebook
    # import nest_asyncio # import this if running in jupyter notebook
    # nest_asyncio.apply() # apply this if running in jupyter notebook
    async def list_collections():
    client = await chromadb.AsyncHttpClient(
        host="localhost",
        port=8000,
        ssl=False,
        headers=None,
        settings=Settings(),
        tenant=DEFAULT_TENANT,
        database=DEFAULT_DATABASE,
    )
    return await client.list_collections()
    
    result = asyncio.get_event_loop().run_until_complete(list_collections())
    print(result)
    ```

    **Parameters**:
    
    1. `host` - The host of the remote server. If not specified, the default is `localhost`.
    2. `port` - The port of the remote server. If not specified, the default is `8000`.
    3. `ssl` - If `True`, the client will use HTTPS. If not specified, the default is `False`.
    4. `headers` - (optional): The headers to be sent to the server. The setting can be used to pass additional headers to the
        server. An example of this can be auth headers.
    5. `settings` - Chroma settings object.
    6. `tenant` - the tenant to use. Default is `default_tenant`.
    7. `database` - the database to use. Default is `default_database`.
    
    !!! tip "Positional Parameters"
    
        Chroma `AsyncHttpClient` parameters are positional, unless keyword arguments are used.

=== "JavaScript"

    ```javascript
    import {ChromaClient}  from "chromadb";
    const client = new ChromaClient({
        path: "http://localhost:8000",
        auth: {
            provider: "token",
            credentials: "your_token_here",
            tokenHeaderType: "AUTHORIZATION",
        },
        tenant: "default_tenant",
        database: "default_database",
    });
    ```

    **Parameters**:
    
    - `path` - The Chroma endpoint
    - `auth` - Chroma authentication object
    - `tenant` - the tenant to use. Default is `default_tenant`.
    - `database` - the database to use. Default is `default_database`.

=== "GoLang"

    ```bash
    go get github.com/amikos-tech/chroma-go
    ```
    ```go
    package main
    
    import (
        "context"
        "fmt"
        "log"
        "os"
    
        chroma "github.com/amikos-tech/chroma-go"
        "github.com/amikos-tech/chroma-go/collection"
        openai "github.com/amikos-tech/chroma-go/pkg/embeddings/openai"
        "github.com/amikos-tech/chroma-go/types"
    )
    
    func main() {
        // Create new OpenAI embedding function
    
        openaiEf, err := openai.NewOpenAIEmbeddingFunction(os.Getenv("OPENAI_API_KEY"))
        if err != nil {
            log.Fatalf("Error creating OpenAI embedding function: %s \n", err)
        }
        // Create a new Chroma client
        client := chroma.NewClient(
            "localhost:8000",
            chroma.WithTenant(types.DefaultTenant),
            chroma.WithDatabase(types.DefaultDatabase),
            chroma.WithAuth(types.NewTokenAuthCredentialsProvider("my-token", types.AuthorizationTokenHeader))
        )
    
        // Create a new collection with options
        newCollection, err := client.NewCollection(
            context.TODO(),
            "test-collection",
            collection.WithMetadata("key1", "value1"),
            collection.WithEmbeddingFunction(openaiEf),
            collection.WithHNSWDistanceFunction(types.L2),
        )
        if err != nil {
            log.Fatalf("Error creating collection: %s \n", err)
        }
    }
    ```
    **Parameters**:
    
    - Chroma endpoint - the chroma endpoint URL e.g. `http://localhost:8000`. This is a required parameter.
    - `WithAuth()` - Chroma authentication provider (see more [here](https://go-client.chromadb.dev/auth/)).
    - `WithTenant()` - the tenant to use. Default is `default_tenant` or constant `types.DefaultTenant`.
    - `WithDatabase()` - the database to use. Default is `default_database` or constant `types.DefaultDatabase`.

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

### Host parameter special cases (Python-only)

The `host` parameter supports a more advanced syntax than just the hostname. You can specify the whole endpoint ULR (
without the API paths), e.g. `https://chromadb.example.com:8000/my_server/path/`. This is useful when you want to use a
reverse proxy or load balancer in front of your ChromaDB server.

## Ephemeral Client

Ephemeral client is a client that does not store any data on disk. It is useful for fast prototyping and testing. To get
started with an ephemeral client, use the `EphemeralClient` class.

```python
import chromadb
from chromadb.config import DEFAULT_TENANT, DEFAULT_DATABASE, Settings

client = chromadb.EphemeralClient(
    settings=Settings(),
    tenant=DEFAULT_TENANT,
    database=DEFAULT_DATABASE,
)
```

**Parameters**:

1. `settings` - Chroma settings object.
2. `tenant` - the tenant to use. Default is `default_tenant`.
3. `database`  - the database to use. Default is `default_database`.

!!! tip "Positional Parameters"

    Chroma `PersistentClient` parameters are positional, unless keyword arguments are used.

## Environmental Variable Configured Client

You can also configure the client using environmental variables. This is useful when you want to configure any of the
client configurations listed above via environmental variables.

```python
import chromadb
from chromadb.config import DEFAULT_TENANT, DEFAULT_DATABASE, Settings

client = chromadb.Client(
    settings=Settings(),
    tenant=DEFAULT_TENANT,
    database=DEFAULT_DATABASE,
)
```

**Parameters**:

1. `settings` - Chroma settings object.
2. `tenant` - the tenant to use. Default is `default_tenant`.
3. `database` - the database to use. Default is `default_database`.

!!! tip "Positional Parameters"

    Chroma `PersistentClient` parameters are positional, unless keyword arguments are used.
