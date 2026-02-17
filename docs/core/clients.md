# Chroma Clients

!!! tip "Chroma Settings Object"

    The below is only a partial list of Chroma configuration options. For full list check the code
    [`chromadb.config.Settings`](https://github.com/chroma-core/chroma/blob/c665838b0d143e2c2ceb82c4ade7404dc98124ff/chromadb/config.py#L83) or
    the [ChromaDB Configuration](configuration.md) page.

## Persistent Client

To create your a local persistent client use the `PersistentClient` class. This client will store all data locally in a
directory on your machine at the path you specify.

!!! tip "Authentication"

    For authentication details see the [Chroma-native Authentication](../security/auth-1.0.x.md) section.

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
remote ChromaDB server. The HTTP client can operate in synchronous or asynchronous mode (see examples below).

!!! tip "Authentication"

    For authentication details see the [Chroma-native Authentication](../security/auth-1.0.x.md) section.

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

=== "TypeScript"

    ```typescript
    import { ChromaClient } from "chromadb";

    const client = new ChromaClient({
        host: "localhost",
        port: 8000,
        ssl: false,
        headers: { "x-chroma-token": "your_token_here" },
        tenant: "default_tenant",
        database: "default_database",
    });
    ```

    **Parameters**:

    - `host` - The hostname of the remote server. Default is `localhost`.
    - `port` - The port of the remote server. Default is `8000`.
    - `ssl` - If `true`, the client will use HTTPS. Default is `false`.
    - `headers` - Custom HTTP headers (e.g. authentication tokens).
    - `tenant` - the tenant to use. Default is `default_tenant`.
    - `database` - the database to use. Default is `default_database`.

=== "Go"

    ```bash
    go get github.com/amikos-tech/chroma-go@latest
    ```
    ```go
    package main

    import (
        "context"
        "log"

        chroma "github.com/amikos-tech/chroma-go/pkg/api/v2"
    )

    func main() {
        client, err := chroma.NewHTTPClient(
            chroma.WithBaseURL("http://localhost:8000"),
            chroma.WithDefaultDatabaseAndTenant(),
        )
        if err != nil {
            log.Fatalf("Error creating client: %s \n", err)
        }
        if err := client.Heartbeat(context.TODO()); err != nil {
            log.Fatalf("Error connecting: %s \n", err)
        }
    }
    ```

    **Parameters**:

    - `WithBaseURL()` - the Chroma endpoint URL e.g. `http://localhost:8000`.
    - `WithAuth()` - Chroma authentication provider (see more [here](https://go-client.chromadb.dev/auth/)).
    - `WithDatabaseAndTenant()` - set database and tenant explicitly.
    - `WithDefaultDatabaseAndTenant()` - use `default_tenant` and `default_database`.

=== "Rust"

    ```bash
    cargo add chroma
    ```
    ```rust
    use chroma::{ChromaHttpClient, ChromaHttpClientOptions};

    #[tokio::main]
    async fn main() -> anyhow::Result<()> {
        let client = ChromaHttpClient::new(ChromaHttpClientOptions::default());
        let heartbeat = client.heartbeat().await?;
        println!("Server timestamp: {}", heartbeat);
        Ok(())
    }
    ```

    **Parameters** (`ChromaHttpClientOptions`):

    - `endpoint` - Server base URL. Default is `http://localhost:8000`.
    - `auth_method` - Authentication strategy. Default is `ChromaAuthMethod::None`.
    - `tenant_id` - Tenant identifier. Auto-resolved if omitted.
    - `database_name` - Database name. Auto-resolved if omitted.

    You can also construct a client from environment variables (`CHROMA_ENDPOINT`, `CHROMA_TENANT`, `CHROMA_DATABASE`):

    ```rust
    let client = ChromaHttpClient::from_env()?;
    ```

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

## Cloud Client

The `CloudClient` connects to [Chroma Cloud](https://trychroma.com). It handles authentication and endpoint
configuration automatically.

!!! note "Environment Variables"

    All languages support configuration via environment variables. When `CHROMA_API_KEY`, `CHROMA_TENANT`, and
    `CHROMA_DATABASE` are set, the client can be instantiated with no arguments.

    If your API key is scoped to a single database, tenant and database are auto-resolved from the key —
    you only need to provide the API key.

=== "Python"

    ```python
    import chromadb

    # Minimal — auto-resolves tenant/database from API key
    client = chromadb.CloudClient(api_key="ck-your-api-key")

    # Explicit tenant and database
    client = chromadb.CloudClient(
        tenant="your-tenant-id",
        database="your-database-name",
        api_key="ck-your-api-key",
    )
    ```

    **Parameters**:

    - `api_key` - Chroma Cloud API key. Falls back to `CHROMA_API_KEY` env var.
    - `tenant` - Tenant identifier. Falls back to `CHROMA_TENANT` env var, or auto-resolved from API key.
    - `database` - Database name. Falls back to `CHROMA_DATABASE` env var, or auto-resolved from API key.
    - `settings` - Chroma Settings object to override defaults.

=== "TypeScript"

    ```typescript
    import { CloudClient } from "chromadb";

    const client = new CloudClient({
        apiKey: "ck-your-api-key",
        tenant: "your-tenant-id",
        database: "your-database-name",
    });
    ```

    **Parameters**:

    - `apiKey` - Chroma Cloud API key. Falls back to `CHROMA_API_KEY` env var.
    - `tenant` - Tenant identifier. Falls back to `CHROMA_TENANT` env var.
    - `database` - Database name. Falls back to `CHROMA_DATABASE` env var.

=== "Go"

    ```go
    package main

    import (
        "context"
        "log"

        chroma "github.com/amikos-tech/chroma-go/pkg/api/v2"
    )

    func main() {
        client, err := chroma.NewCloudClient(
            chroma.WithCloudAPIKey("ck-your-api-key"),
            chroma.WithDatabaseAndTenant("your-database", "your-tenant-id"),
        )
        if err != nil {
            log.Fatalf("Error creating cloud client: %s \n", err)
        }
        if err := client.Heartbeat(context.TODO()); err != nil {
            log.Fatalf("Error connecting: %s \n", err)
        }
    }
    ```

    **Parameters**:

    - `WithCloudAPIKey()` - Chroma Cloud API key. Falls back to `CHROMA_API_KEY` env var.
    - `WithDatabaseAndTenant()` - Set database and tenant explicitly.
    - `WithTimeout()` - Request timeout.

    ??? note "Go Client Package"

        The Go client is maintained at [`amikos-tech/chroma-go`](https://github.com/amikos-tech/chroma-go)
        and has not yet been moved to `chroma-core`. Use the `github.com/amikos-tech/chroma-go/pkg/api/v2`
        import path.

=== "Rust"

    ```rust
    use chroma::{ChromaHttpClient, ChromaHttpClientOptions};

    #[tokio::main]
    async fn main() -> anyhow::Result<()> {
        // Explicit API key and database
        let options = ChromaHttpClientOptions::cloud(
            "ck-your-api-key",
            "your-database-name",
        )?;
        let client = ChromaHttpClient::new(options);

        // Or from environment variables (CHROMA_API_KEY, CHROMA_DATABASE, etc.)
        let client = ChromaHttpClient::cloud()?;

        let heartbeat = client.heartbeat().await?;
        println!("Server timestamp: {}", heartbeat);
        Ok(())
    }
    ```

    **Parameters** (`ChromaHttpClientOptions::cloud()`):

    - `api_key` - Chroma Cloud API key.
    - `database_name` - Database name. Tenant is auto-resolved.

    **Environment-based** (`ChromaHttpClient::cloud()`):

    - `CHROMA_API_KEY` (required)
    - `CHROMA_ENDPOINT` (optional, defaults to `https://api.trychroma.com`)
    - `CHROMA_TENANT` (optional, auto-resolved)
    - `CHROMA_DATABASE` (optional, auto-resolved)

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
