# Chroma Clients

Chroma Settings Object

The below is only a partial list of Chroma configuration options. For full list check the code [`chromadb.config.Settings`](https://github.com/chroma-core/chroma/blob/main/chromadb/config.py) or the [ChromaDB Configuration](https://cookbook.chromadb.dev/core/configuration/index.md) page.

## Client implementations and source repos

| Language   | Constructors covered on this page                                                               | Source repository                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Python     | `PersistentClient`, `HttpClient`, `AsyncHttpClient`, `CloudClient`, `EphemeralClient`, `Client` | [`chroma-core/chroma`](https://github.com/chroma-core/chroma/tree/main/chromadb)                 |
| TypeScript | `ChromaClient`, `CloudClient`                                                                   | [`chroma-core/chroma` (JS client)](https://github.com/chroma-core/chroma/tree/main/clients/js)   |
| Go         | `NewHTTPClient`, `NewCloudClient`                                                               | [`amikos-tech/chroma-go`](https://github.com/amikos-tech/chroma-go/tree/main/pkg/api/v2)         |
| Rust       | `ChromaHttpClient`                                                                              | [`chroma-core/chroma` (Rust crate)](https://github.com/chroma-core/chroma/tree/main/rust/chroma) |

## Persistent Client

To create a local persistent client, use the `PersistentClient` class. This client stores data locally in a directory on your machine at the path you specify.

Authentication

For authentication details see the [Chroma-native Authentication](https://cookbook.chromadb.dev/security/auth-1.0.x/index.md) section.

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

| Parameter  | Type               | Description                                                                                             | Default / Allowed values   |
| ---------- | ------------------ | ------------------------------------------------------------------------------------------------------- | -------------------------- |
| `path`     | `str \| Path`      | Local path on the machine where Chroma runs. Created if it does not exist. Can be relative or absolute. | `./chroma`                 |
| `settings` | `Settings \| None` | Chroma settings object.                                                                                 | `None` (uses `Settings()`) |
| `tenant`   | `str`              | Tenant to use.                                                                                          | `default_tenant`           |
| `database` | `str`              | Database to use.                                                                                        | `default_database`         |

Positional Parameters

Chroma `PersistentClient` parameters are positional, unless keyword arguments are used.

### Uses of Persistent Client

The persistent client is useful for:

- **Local development**: You can use the persistent client to develop locally and test out ChromaDB.
- **Embedded applications**: You can use the persistent client to embed ChromaDB in your application. This means that you can ship Chroma bundled with your product or services, thus simplifying the deployment process.
- **Simplicity**: If you do not wish to incur the complexities associated with setting up and operating a Chroma server (arguably Hosted-Chroma will resolve this).
- **Data privacy**: If you are working with sensitive data and do not want to store it on a remote server.
- **Optimize performance**: If you want to reduce latency.

The right tool for the job

When evaluating the use of local `PersistentClient` one should always factor in the scale of the application. Similar to SQLite vs Postgres/MySQL, `PersistentClient` vs `HTTPClient` with Chroma server, application architectural characteristics (such as complexity, scale, performance etc) should be considered when deciding to use one or the other.

## HTTP Client

Chroma also provides HTTP Client, suitable for use in a client-server mode. This client can be used to connect to a remote ChromaDB server. The HTTP client can operate in synchronous or asynchronous mode (see examples below).

Authentication

For authentication details see the [Chroma-native Authentication](https://cookbook.chromadb.dev/security/auth-1.0.x/index.md) section.

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

| Parameter  | Type                     | Description                                                                            | Default / Allowed values   |
| ---------- | ------------------------ | -------------------------------------------------------------------------------------- | -------------------------- |
| `host`     | `str`                    | Hostname of the remote server. You can also pass a full URL (including a path prefix). | `localhost`                |
| `port`     | `int`                    | Port of the remote server.                                                             | `8000`                     |
| `ssl`      | `bool`                   | Uses HTTPS when `True`.                                                                | `False`                    |
| `headers`  | `dict[str, str] \| None` | Additional headers sent with each request (for example auth headers).                  | `None`                     |
| `settings` | `Settings \| None`       | Chroma settings object.                                                                | `None` (uses `Settings()`) |
| `tenant`   | `str`                    | Tenant to use.                                                                         | `default_tenant`           |
| `database` | `str`                    | Database to use.                                                                       | `default_database`         |

Positional Parameters

Chroma `HttpClient` parameters are positional, unless keyword arguments are used.

```python
import asyncio
import chromadb
from chromadb.config import DEFAULT_TENANT, DEFAULT_DATABASE, Settings
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

result = asyncio.run(list_collections())
print(result)
```

**Parameters**:

| Parameter  | Type                     | Description                                                                            | Default / Allowed values   |
| ---------- | ------------------------ | -------------------------------------------------------------------------------------- | -------------------------- |
| `host`     | `str`                    | Hostname of the remote server. You can also pass a full URL (including a path prefix). | `localhost`                |
| `port`     | `int`                    | Port of the remote server.                                                             | `8000`                     |
| `ssl`      | `bool`                   | Uses HTTPS when `True`.                                                                | `False`                    |
| `headers`  | `dict[str, str] \| None` | Additional headers sent with each request (for example auth headers).                  | `None`                     |
| `settings` | `Settings \| None`       | Chroma settings object.                                                                | `None` (uses `Settings()`) |
| `tenant`   | `str`                    | Tenant to use.                                                                         | `default_tenant`           |
| `database` | `str`                    | Database to use.                                                                       | `default_database`         |

Positional Parameters

Chroma `AsyncHttpClient` parameters are positional, unless keyword arguments are used.

```typescript
import { ChromaClient } from "chromadb";

const client = new ChromaClient({
    path: "http://localhost:8000",
    auth: {
        provider: "token",
        credentials: "your_token_here",
        tokenHeaderType: "X_CHROMA_TOKEN",
    },
    tenant: "default_tenant",
    database: "default_database",
});
```

**Parameters**:

| Parameter      | Type          | Description                                                      | Default / Allowed values                            |
| -------------- | ------------- | ---------------------------------------------------------------- | --------------------------------------------------- |
| `path`         | `string`      | Base URL for the Chroma API.                                     | `http://localhost:8000`                             |
| `auth`         | `AuthOptions` | Authentication config.                                           | Optional. `provider` values: `"basic"` or `"token"` |
| `fetchOptions` | `RequestInit` | Fetch options passed to HTTP calls (for example custom headers). | Optional                                            |
| `tenant`       | `string`      | Tenant to use.                                                   | `default_tenant`                                    |
| `database`     | `string`      | Database to use.                                                 | `default_database`                                  |

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

| Option                           | Type                                                | Description                                                                    | Default / Allowed values                           |
| -------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| `WithBaseURL()`                  | `func(string) ClientOption`                         | Sets Chroma endpoint URL. `/api/v2` is appended if missing.                    | Default base URL is `http://localhost:8000/api/v2` |
| `WithAuth()`                     | `func(CredentialsProvider) ClientOption`            | Sets auth provider (see [Go auth docs](https://go-client.chromadb.dev/auth/)). | Optional                                           |
| `WithDatabaseAndTenant()`        | `func(database string, tenant string) ClientOption` | Sets database and tenant explicitly.                                           | Optional                                           |
| `WithDatabaseAndTenantFromEnv()` | `func() ClientOption`                               | Reads `CHROMA_DATABASE` and `CHROMA_TENANT` when present.                      | Applied by default in `NewHTTPClient`              |
| `WithDefaultDatabaseAndTenant()` | `func() ClientOption`                               | Fills missing values with defaults.                                            | `default_database` and `default_tenant`            |
| `WithTimeout()`                  | `func(time.Duration) ClientOption`                  | Sets request timeout.                                                          | Optional                                           |

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

| Parameter       | Type                 | Description                                 | Default / Allowed values                                                                   |
| --------------- | -------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `endpoint`      | `reqwest::Url`       | Server base URL.                            | `http://localhost:8000`                                                                    |
| `auth_method`   | `ChromaAuthMethod`   | Authentication strategy.                    | `ChromaAuthMethod::None`                                                                   |
| `retry_options` | `ChromaRetryOptions` | Retry/backoff behavior for failed requests. | `max_retries=3`, `min_delay=200ms`, `max_delay=5s`, `jitter=true`                          |
| `tenant_id`     | `Option<String>`     | Tenant identifier override.                 | `None` (resolved from identity when possible)                                              |
| `database_name` | `Option<String>`     | Database name override.                     | `None` (resolved when possible; explicit value recommended if multiple DBs are accessible) |

You can also construct a client from environment variables (`CHROMA_ENDPOINT`, `CHROMA_TENANT`, `CHROMA_DATABASE`):

```rust
let client = ChromaHttpClient::from_env()?;
```

### Uses of HTTP Client

The HTTP client is ideal for when you want to scale your application or move off of local machine storage. It is important to note that there are trade-offs associated with using HTTP client:

- Network latency - The time it takes to send a request to the server and receive a response.
- Serialization and deserialization overhead - The time it takes to convert data to a format that can be sent over the network and then convert it back to its original format.
- Security - The data is sent over the network, so it is important to ensure that the connection is secure (we recommend using both HTTPS and authentication).
- Availability - The server must be available for the client to connect to it.
- Bandwidth usage - The amount of data sent over the network.
- Data privacy and compliance - Storing data on a remote server may require compliance with data protection laws and regulations.
- Difficulty in debugging - Debugging network issues can be more difficult than debugging local issues. The same applies to server-side issues.

### Host parameter special cases (Python-only)

The `host` parameter supports a more advanced syntax than just the hostname. You can specify the whole endpoint URL ( without the API paths), e.g. `https://chromadb.example.com:8000/my_server/path/`. This is useful when you want to use a reverse proxy or load balancer in front of your ChromaDB server.

## Cloud Client

The `CloudClient` connects to [Chroma Cloud](https://trychroma.com). It handles authentication and endpoint configuration automatically.

Environment Variables

Cloud environment variable handling differs by language:

| Language   | API key                                                   | Tenant / database                                                                                        |
| ---------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Python     | `api_key` arg or `CHROMA_API_KEY`                         | `tenant`/`database` args, or `CHROMA_TENANT`/`CHROMA_DATABASE`, or auto-resolved from scoped credentials |
| TypeScript | `apiKey` arg or `CHROMA_API_KEY`                          | Constructor args (`tenant`, `database`)                                                                  |
| Go         | `WithCloudAPIKey()` or `CHROMA_API_KEY`                   | `WithDatabaseAndTenant()` or `CHROMA_TENANT` + `CHROMA_DATABASE`                                         |
| Rust       | `ChromaHttpClientOptions::cloud(...)` or `CHROMA_API_KEY` | Explicit options or `CHROMA_TENANT`/`CHROMA_DATABASE`; otherwise resolved from identity when possible    |

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

| Parameter    | Type               | Description                                               | Default / Allowed values                                    |
| ------------ | ------------------ | --------------------------------------------------------- | ----------------------------------------------------------- |
| `api_key`    | `str \| None`      | Chroma Cloud API key.                                     | Required. Falls back to `CHROMA_API_KEY`                    |
| `tenant`     | `str \| None`      | Tenant identifier.                                        | Falls back to `CHROMA_TENANT`, then auth-based resolution   |
| `database`   | `str \| None`      | Database name.                                            | Falls back to `CHROMA_DATABASE`, then auth-based resolution |
| `settings`   | `Settings \| None` | Settings override.                                        | `None` (uses `Settings()`)                                  |
| `cloud_host` | `str`              | Cloud API hostname (keyword-only; primarily for testing). | `api.trychroma.com`                                         |
| `cloud_port` | `int`              | Cloud API port (keyword-only; primarily for testing).     | `443`                                                       |
| `enable_ssl` | `bool`             | Enables TLS (keyword-only; primarily for testing).        | `True`                                                      |

```typescript
import { CloudClient } from "chromadb";

const client = new CloudClient({
    apiKey: "ck-your-api-key",
    tenant: "your-tenant-id",
    database: "your-database-name",
});
```

**Parameters**:

| Parameter   | Type                  | Description           | Default / Allowed values                                              |
| ----------- | --------------------- | --------------------- | --------------------------------------------------------------------- |
| `apiKey`    | `string \| undefined` | Chroma Cloud API key. | Required. Falls back to `CHROMA_API_KEY`                              |
| `tenant`    | `string \| undefined` | Tenant identifier.    | Optional. Defaults to `default_tenant` in underlying `ChromaClient`   |
| `database`  | `string \| undefined` | Database name.        | Optional. Defaults to `default_database` in underlying `ChromaClient` |
| `cloudHost` | `string \| undefined` | Cloud host prefix.    | `https://api.trychroma.com`                                           |
| `cloudPort` | `string \| undefined` | Cloud port suffix.    | `8000`                                                                |

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

| Option                           | Type                                                | Description                                  | Default / Allowed values               |
| -------------------------------- | --------------------------------------------------- | -------------------------------------------- | -------------------------------------- |
| `WithCloudAPIKey()`              | `func(string) ClientOption`                         | Sets Chroma Cloud API key.                   | Falls back to `CHROMA_API_KEY`         |
| `WithDatabaseAndTenant()`        | `func(database string, tenant string) ClientOption` | Sets database and tenant explicitly.         | Required unless both env vars are set  |
| `WithDatabaseAndTenantFromEnv()` | `func() ClientOption`                               | Reads `CHROMA_DATABASE` and `CHROMA_TENANT`. | Applied by default in `NewCloudClient` |
| `WithTimeout()`                  | `func(time.Duration) ClientOption`                  | Sets request timeout.                        | Optional                               |

`NewCloudClient` requires non-default tenant and database values and also requires an API key.

Go Client Package

The Go client is maintained at [`amikos-tech/chroma-go`](https://github.com/amikos-tech/chroma-go) and has not yet been moved to `chroma-core`. Use the `github.com/amikos-tech/chroma-go/pkg/api/v2` import path.

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

| Parameter       | Type                | Description                                   | Default / Allowed values |
| --------------- | ------------------- | --------------------------------------------- | ------------------------ |
| `api_key`       | `impl Into<String>` | Chroma Cloud API key.                         | Required                 |
| `database_name` | `impl Into<String>` | Database name used for collection operations. | Required                 |

**Environment-based** (`ChromaHttpClient::cloud()`):

| Variable          | Required | Description              | Default / Allowed values                         |
| ----------------- | -------- | ------------------------ | ------------------------------------------------ |
| `CHROMA_API_KEY`  | Yes      | Cloud API key.           | None                                             |
| `CHROMA_ENDPOINT` | No       | Cloud endpoint override. | `https://api.trychroma.com`                      |
| `CHROMA_TENANT`   | No       | Tenant override.         | If omitted, resolved from identity when possible |
| `CHROMA_DATABASE` | No       | Database override.       | If omitted, resolved from identity when possible |

## Ephemeral Client

Ephemeral client is a client that does not store any data on disk. It is useful for fast prototyping and testing. To get started with an ephemeral client, use the `EphemeralClient` class.

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

| Parameter  | Type               | Description             | Default / Allowed values   |
| ---------- | ------------------ | ----------------------- | -------------------------- |
| `settings` | `Settings \| None` | Chroma settings object. | `None` (uses `Settings()`) |
| `tenant`   | `str`              | Tenant to use.          | `default_tenant`           |
| `database` | `str`              | Database to use.        | `default_database`         |

Positional Parameters

Chroma `EphemeralClient` parameters are positional, unless keyword arguments are used.

## Environment Variable Configured Client

You can also configure the client using environment variables. This is useful when you want to configure any of the client options listed above via environment variables.

```python
import chromadb

# Uses configured defaults from environment/.env/settings.
client = chromadb.Client()
```

**Parameters**:

| Parameter  | Type       | Description                                                | Default / Allowed values                            |
| ---------- | ---------- | ---------------------------------------------------------- | --------------------------------------------------- |
| `settings` | `Settings` | Settings object for environment and runtime configuration. | Current global settings (`chromadb.get_settings()`) |
| `tenant`   | `str`      | Tenant to use.                                             | `default_tenant`                                    |
| `database` | `str`      | Database to use.                                           | `default_database`                                  |

Positional Parameters

Chroma `Client` parameters are positional, unless keyword arguments are used.
