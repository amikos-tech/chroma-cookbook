# Authentication in Chroma v1.0.x


## Envoy

You can secure your Chroma instance with a token-based auth using Envoy proxy.


Create a `envoy.yaml` configuration file with the following content (adjust as needed or combined with [SSL](ssl-proxies.md)):

```yaml
static_resources:
  listeners:
    - name: listener_0
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 8000
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: ingress_http
                route_config:
                  name: chroma_route
                  virtual_hosts:
                    - name: local_chromadb
                      domains: [ "*" ]
                      routes:
                        - match:
                            prefix: "/"
                          route:
                            cluster: chromadb_service
                            prefix_rewrite: "/"
                http_filters:
                  - name: envoy.filters.http.rbac
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.rbac.v3.RBAC
                      rules:
                        action: ALLOW
                        policies:
                          "static-token-policy":
                            permissions:
                              - header:
                                  name: %CHROMA_AUTH_TOKEN_TRANSPORT_HEADER%
                                  string_match:
                                    exact: %CHROMA_SERVER_AUTHN_CREDENTIALS%
                            principals:
                              - any: true
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
  clusters:
    - name: chromadb_service
      connect_timeout: 0.25s
      type: LOGICAL_DNS
      lb_policy: ROUND_ROBIN
      load_assignment:
        cluster_name: chromadb_service
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: chromadb
                      port_value: 8000
```

Then create a`entrypoint.sh` startup script to interpolate the values in the `envoy.yaml` configuration.

```bash
#!/bin/sh

sed 's/%CHROMA_AUTH_TOKEN_TRANSPORT_HEADER%/'$CHROMA_AUTH_TOKEN_TRANSPORT_HEADER'/g' /opt/bitnami/envoy/conf/envoy.yaml > /tmp/envoy_temp.yaml

if [ $CHROMA_AUTH_TOKEN_TRANSPORT_HEADER = "Authorization" ]; then
  sed -i 's/%CHROMA_SERVER_AUTHN_CREDENTIALS%/Bearer '$CHROMA_SERVER_AUTHN_CREDENTIALS'/g' /tmp/envoy_temp.yaml
else
  sed -i 's/%CHROMA_SERVER_AUTHN_CREDENTIALS%/'$CHROMA_SERVER_AUTHN_CREDENTIALS'/g' /tmp/envoy_temp.yaml
fi

cat /tmp/envoy_temp.yaml

/opt/bitnami/envoy/bin/envoy -c /tmp/envoy_temp.yaml
```

Last but not least your `docker-compose.yaml`:

```yaml
networks:
  net:
    driver: bridge
services:
  envoy:
    image: bitnami/envoy
    volumes:
      - ./envoy.yaml:/opt/bitnami/envoy/conf/envoy.yaml
      - ./certs:/etc/envoy/certs
      - ./entrypoint.sh:/entrypoint.sh
    ports:
      - "8000:8000"
    environment:
      CHROMA_SERVER_AUTHN_CREDENTIALS: ${CHROMA_SERVER_AUTHN_CREDENTIALS:-chr0m4t0k3n}
      CHROMA_AUTH_TOKEN_TRANSPORT_HEADER: ${CHROMA_AUTH_TOKEN_TRANSPORT_HEADER:-Authorization}
    networks:
      - net
    entrypoint: |
      sh -c "
      chmod +x /entrypoint.sh && \
      /entrypoint.sh
      "
  chromadb:
    image: chromadb/chroma:1.0.10
    volumes:
      - ./chroma-data:/data
    networks:
      - net
    healthcheck:
      # Adjust below to match your container port
      test: ["CMD", "bash", "-c", "echo -n '' > /dev/tcp/127.0.0.1/8000"]
      interval: 30s
      timeout: 10s
      retries: 3
```

To get going configure your preferred auth type:

- Bearer `Authorization` header
- `X-Chroma-Token` header


### `Authorization` header:

```bash
export CHROMA_AUTH_TOKEN_TRANSPORT_HEADER=Authorization
export CHROMA_SERVER_AUTHN_CREDENTIALS=myT0k3n123
docker compose up -d
```

Verify:

```bash
curl -v http://localhost:8000/api/v2/tenants/default_tenant/databases/default_database/collections -H "Authorization: Bearer myT0k3n123" 
```

!!! note "Header format"

    Observe the presence of `Bearer` in the authorization header

```python
import chromadb
from chromadb.config import Settings

client = chromadb.HttpClient(
  settings=Settings(
      chroma_client_auth_provider="chromadb.auth.token_authn.TokenAuthClientProvider",
      chroma_client_auth_credentials="myT0k3n123",
      chroma_auth_token_transport_header="Authorization"
  )
)

# if everything is correctly configured the below should list all collections
client.list_collections()
```

### `X-Chroma-Token` header:

```bash
export CHROMA_AUTH_TOKEN_TRANSPORT_HEADER=X-Chroma-Token
export CHROMA_SERVER_AUTHN_CREDENTIALS=myT0k3n123
docker compose up -d
```

Verify:

```bash
curl -v http://localhost:8000/api/v2/tenants/default_tenant/databases/default_database/collections -H "X-Chroma-Token: myT0k3n123"
```


```python
import chromadb
from chromadb.config import Settings

client = chromadb.HttpClient(
  settings=Settings(
      chroma_client_auth_provider="chromadb.auth.token_authn.TokenAuthClientProvider",
      chroma_client_auth_credentials="myT0k3n123",
      chroma_auth_token_transport_header="X-Chroma-Token"
  )
)

# if everything is correctly configured the below should list all collections
client.list_collections()
```
