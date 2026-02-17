# Chroma-native Auth (Legacy)

!!! danger "Chroma-native Auth is not supported in v1.0.x"

    Chroma native-auth described in this article is not supported in Chroma versions 1.0.0-1.0.10 (latest as of time of writing). **DO NOT USE** the below if you are on any of the affected version as it will not secure your instance.

Chroma offers built in authentication and authorization mechanisms to secure your Chroma instance.

!!! warning "Auth Disabled by Default"

    By default, Chroma does not require authentication. You must enable it manually. If you are deploying Chroma in a public-facing 
    environment, it is **highly** recommended to enable authentication.

!!! warning "Auth needs the company of SSL/TLS"

    Authentication without encryption is insecure. If you are deploying Chroma in a public-facing environment, it is **highly** recommended that you add [SSL/TLS](ssl-proxies.md).

## Authentication

Chroma supports two types of authentication:

- Basic Auth - RFC 7617 compliant pre-emptive authentication with username and password credentials in Authorization header.
- Token Auth - Standard token-based auth with `Authorization` or `X-Chroma-Token` headers.

For each authentication method there are configurations in both client and server.

### Basic Authentication

**Server**

Generate a password file with bcrypt hashed password:

```bash
docker run --rm --entrypoint htpasswd httpd:2 -Bbn admin password123 >> server.htpasswd
```

Verify the password file:

```bash
docker run --rm -v ./server.htpasswd:/server.htpasswd --entrypoint htpasswd httpd:2 -vb /server.htpasswd admin password123
```

??? tip "Multiple users"
    
    Chroma supports multiple users in the htpasswd file. You can add multiple users by running the command multiple 
    times WITHOUT `-c` flag.

??? tip "Frequently encountered Chroma errors"

    If you see the following error:

    ```bash
    UnicodeDecodeError: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
    ```

    It is likely that you have not used the `-B` (bcrypt) flag when creating the password file.

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

=== "Docker Compose"
    
    Create a `docker-compose.yaml` with the following content:
    
    ```yaml
    networks:
      net:
        driver: bridge
    services:
      chromadb:
        image: chromadb/chroma:latest
        volumes:
          - ./chromadb:/chroma/chroma
          - ./server.htpasswd:/chroma/server.htpasswd
        environment:
          - IS_PERSISTENT=TRUE
          - PERSIST_DIRECTORY=/chroma/chroma # this is the default path, change it as needed
          - ANONYMIZED_TELEMETRY=${ANONYMIZED_TELEMETRY:-TRUE}
          - CHROMA_SERVER_AUTHN_CREDENTIALS_FILE=server.htpasswd
          - CHROMA_SERVER_AUTHN_PROVIDER=chromadb.auth.basic_authn.BasicAuthenticationServerProvider
        ports:
          - 8000:8000
        networks:
          - net
    ```
    
    Run the following command to start the Chroma server:
    
    ```bash
    docker compose -f docker-compose.yaml up -d
    ```


??? info "Is my config right?"

    If you have correctly configured the server you should see the following line in the server logs:
    
    ```bash
    Starting component BasicAuthenticationServerProvider
    ```

**Client**

=== "Python Sync"

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

=== "Python Async"

    ```python
    import chromadb
    import base64
    
    base64_credentials = base64.b64encode(b"admin:admin").decode("utf-8")

    client = await chromadb.AsyncHttpClient(headers={"Authorization": f"Basic {base64_credentials}"})
    ```

=== "JS"

    ```javascript
    // const {ChromaClient} = require("chromadb"); // CommonJS
    import { ChromaClient } from "chromadb"; // ES Modules
    const client = new ChromaClient({
        url: "http://localhost:8000",
        auth: {
            provider: "basic",
            credentials: "admin:admin",
        }
    });
    ```

=== "Go"

    ```go
    package main

    import (
        "context"
        "log"
        chroma "github.com/amikos-tech/chroma-go"
      "github.com/amikos-tech/chroma-go/types"
    )

    func main() {
        client, err := chroma.NewClient(
            chroma.WithBasePath("http://localhost:8000"),
            chroma.WithAuth(types.NewBasicAuthCredentialsProvider("admin", "admin")),
        )
        if err != nil {
            log.Fatalf("Error creating client: %s \n", err)
        }
        _, err = client.ListCollections(context.TODO())
        if err != nil {
            log.Fatalf("Error calling ListCollections: %s \n", err)
        }
    }
    ```

=== "Java"

    The below example shows auth with just headers. A more robust authentication mechanism is being implemented.

    ```java
    package tech.amikos;

    import tech.amikos.chromadb.*;
    import tech.amikos.chromadb.Collection;

    import java.util.*;

    public class Main {
        public static void main(String[] args) {
            try {
                Client client = new Client(System.getenv("http://localhost:8000"));
                client.setDefaultHeaders(new HashMap<>() {{
                    put("Authorization", "Basic " + Base64.getEncoder().encodeToString("admin:admin".getBytes()));
                }});
                // your code here
            } catch (Exception e) {
                System.out.println(e);
            }
        }
    }
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

=== "Docker Compose"

    Create a `docker-compose.yaml` with the following content:
    
    ```yaml
    networks:
      net:
        driver: bridge
    services:
      chromadb:
        image: chromadb/chroma:latest
        volumes:
          - ./chromadb:/chroma/chroma
        environment:
          - IS_PERSISTENT=TRUE
          - PERSIST_DIRECTORY=/chroma/chroma # this is the default path, change it as needed
          - ANONYMIZED_TELEMETRY=${ANONYMIZED_TELEMETRY:-TRUE}
          - CHROMA_SERVER_AUTHN_CREDENTIALS="chr0ma-t0k3n"
          - CHROMA_AUTH_TOKEN_TRANSPORT_HEADER="Authorization"
          - CHROMA_SERVER_AUTHN_PROVIDER=chromadb.auth.token_authn.TokenAuthenticationServerProvider
        ports:
          - 8000:8000
        networks:
          - net
    ```
    
    Run the following command to start the Chroma server:
    
    ```bash
    docker compose -f docker-compose.yaml up -d
    ```

??? info "Is my config right?"

    If you have correctly configured the server you should see the following line in the server logs:
    
    ```bash
    Starting component TokenAuthenticationServerProvider
    ```

**Client**

=== "Python Sync"

    ```python
    import chromadb
    from chromadb.config import Settings

    client = chromadb.HttpClient(
      settings=Settings(
          chroma_client_auth_provider="chromadb.auth.token_authn.TokenAuthClientProvider",
          chroma_client_auth_credentials="chr0ma-t0k3n",
          chroma_auth_token_transport_header="Authorization"
      )
    )

    # if everything is correctly configured the below should list all collections
    client.list_collections()
    ```

=== "Python Async"

    ```python
    import chromadb
    # for Authorization header
    client = await chromadb.AsyncHttpClient(headers={"Authorization": "Bearer chr0ma-t0k3n"})
    # for X-Chroma-Token header
    client = await chromadb.AsyncHttpClient(headers={"X-Chroma-Token": "chr0ma-t0k3n"})

    # if everything is correctly configured the below should list all collections
    await client.list_collections()
    ```

=== "JS"

    ```javascript
    // const {ChromaClient} = require("chromadb"); // CommonJS
    import { ChromaClient } from "chromadb"; // ES Modules
    const client = new ChromaClient({
        url: "http://localhost:8000",
        auth: {
            provider: "token",
            credentials: "chr0ma-t0k3n",
        }
    });
    ```

=== "Go"

    ```go
    package main

    import (
        "context"
        "log"
        chroma "github.com/amikos-tech/chroma-go"
        "github.com/amikos-tech/chroma-go/types"
    )

    func main() {
        client, err := chroma.NewClient(
            chroma.WithBasePath("http://localhost:8000"), 
            chroma.WithAuth(types.NewTokenAuthCredentialsProvider("chr0ma-t0k3n", types.AuthorizationTokenHeader)),
        )
        if err != nil {
            log.Fatalf("Error creating client: %s \n", err)
        }
        _, err = client.ListCollections(context.TODO())
        if err != nil {
            log.Fatalf("Error calling ListCollections: %s \n", err)
        }
    }
    ```

=== "Java"

    The example below shows authorization with just headers. A more robust auth mechanism is under implementation.

    ```java
    package tech.amikos;

    import tech.amikos.chromadb.*;
    import tech.amikos.chromadb.Collection;

    import java.util.*;

    public class Main {
        public static void main(String[] args) {
            try {
                Client client = new Client(System.getenv("http://localhost:8000"));
                client.setDefaultHeaders(new HashMap<>() {{
                    put("Authorization", "Bearer chr0ma-t0k3n");
                }});
                // your code here
            } catch (Exception e) {
                System.out.println(e);
            }
        }
    }
    ```

??? tip "Testing with cURL"

    ```bash
    curl -v http://localhost:8000/api/v1/collections -H "Authorization: Bearer chr0ma-t0k3n"
    ```

## Authorization

Coming soon!