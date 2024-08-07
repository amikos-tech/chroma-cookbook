# Chroma-native Auth

Chroma offers built in authentication and authorization mechanisms to secure your Chroma instance.

!!! warn "Auth Disabled by Default"

    By default, Chroma does not require authentication. You must enable it manually. If you are deploying Chroma in a public-facing 
    environment, it is **highly** recommended to enable authentication.

## Authentication

Chroma supports two types of authentication:

- Basic Auth - RFC 7617 compliant pre-emptive authentication with username and password credentials in Authorization header.
- Token Auth - Standard token-based auth with `Authorization` or `X-Chroma-Token` headers.

For each authentication method there are configurations in both client and server.

### Basic Authentication

**Server**

Generate a password file with bcrypt hashed password:

```bash
docker run --rm --entrypoint echo httpd:2 "change_this_password" | htpasswd -iBc server.htpasswd user1
```

??? tip "Multiple users"
    
    Chroma supports multiple users in the htpasswd file. You can add multiple users by running the command multiple 
    times WITHOUT `-c` flag.

Environment variables:

```bash
export CHROMA_SERVER_AUTHN_CREDENTIALS_FILE="server.htpasswd"
export CHROMA_SERVER_AUTHN_PROVIDER="chromadb.auth.basic_authn.BasicAuthenticationServerProvider"
```

Running the server:

=== "CLI"

    ```bash
    export CHROMA_SERVER_AUTHN_CREDENTIALS_FILE="server.htpasswd"
    export CHROMA_SERVER_AUTHN_PROVIDER="chromadb.auth.basic_authn.BasicAuthenticationServerProvider"
    chroma run --path /chroma-data
    ```

=== "Docker"

    ```bash
    docker run --rm -v ./server.htpasswd:/chroma/server.htpasswd \
     -e CHROMA_SERVER_AUTHN_CREDENTIALS_FILE="server.htpasswd" \
     -e CHROMA_SERVER_AUTHN_PROVIDER="chromadb.auth.basic_authn.BasicAuthenticationServerProvider" \
     -p 8000:8000 \
     chromadb/chroma:latest
    ```

??? info "Is my config right?"

    If you have correctly configured the server you should see the following line in the server logs:
    
    ```bash
    Starting component BasicAuthenticationServerProvider
    ```

**Client**

```python
import chromadb
from chromadb.config import Settings

client = chromadb.HttpClient(
  settings=Settings(
      chroma_client_auth_provider="chromadb.auth.basic_authn.BasicAuthClientProvider",
      chroma_client_auth_credentials="admin:admin")
)

# if everything is correctly configured the below should list all collections
client.list_collections()
```

??? tip "Testing with cURL"

    ```bash
    curl -v http://localhost:8000/api/v1/collections -u user1:change_this_password
    ```

### Token Authentication

**Server**

Environment variables:

```bash
export CHROMA_SERVER_AUTHN_CREDENTIALS="chr0ma-t0k3n"
export CHROMA_SERVER_AUTHN_PROVIDER="chromadb.auth.token_authn.TokenAuthenticationServerProvider"
export CHROMA_AUTH_TOKEN_TRANSPORT_HEADER="Authorization" # or X-Chroma-Token
```

_Auth Headers_

Chroma supports two token transport headers:

- `Authorization` (default) - the clients are expected to pass `Authorization: Bearer <token>` header
- `X-Chroma-Token` - the clients are expected to pass `X-Chroma-Token: <token>` header

The header can be configured via `CHROMA_AUTH_TOKEN_TRANSPORT_HEADER` environment variable.

Running the server:

=== "CLI"

    ```bash
    export CHROMA_SERVER_AUTHN_CREDENTIALS="chr0ma-t0k3n"
    export CHROMA_SERVER_AUTHN_PROVIDER="chromadb.auth.token_authn.TokenAuthenticationServerProvider"
    export CHROMA_AUTH_TOKEN_TRANSPORT_HEADER="Authorization"
    chroma run --path /chroma-data
    ```

=== "Docker"

    ```bash
    docker run --rm -e CHROMA_SERVER_AUTHN_CREDENTIALS="chr0ma-t0k3n" \
     -e CHROMA_SERVER_AUTHN_PROVIDER="chromadb.auth.token_authn.TokenAuthenticationServerProvider" \
     -e CHROMA_AUTH_TOKEN_TRANSPORT_HEADER="Authorization" \
     -p 8000:8000 \
     chromadb/chroma:latest
    ```

??? info "Is my config right?"

    If you have correctly configured the server you should see the following line in the server logs:
    
    ```bash
    Starting component TokenAuthenticationServerProvider
    ```

**Client**

```python
import chromadb
from chromadb.config import Settings

client = chromadb.HttpClient(
  settings=Settings(
      chroma_client_auth_provider="chromadb.auth.token_authn.TokenAuthClientProvider",
      chroma_client_auth_credentials="chr0ma-t0k3n")
)

# if everything is correctly configured the below should list all collections
client.list_collections()
```

??? tip "Testing with cURL"

    ```bash
    curl -v http://localhost:8000/api/v1/collections -H "Authorization: Bearer chr0ma-t0k3n"
    ```

## Authorization

Coming soon!