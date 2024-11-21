# SSL/TLS Proxy

In this section we'll explore how to secure Chroma with a TLS-terminated HTTPS proxy. Below we'll give two examples of
how to do this using Envoy and Nginx. The certificates are self-signed and generated using OpenSSL, but in the future
we'll also provide examples of how to achieve this with Let's Encrypt and certbot.

## Getting The cert

To manually generate a certificate follow the steps [here](chroma-ssl-cert.md#creating-a-self-signed-certificate).

## Envoy

The following envoy configuration will create a listener on port 443 that will forward all requests to the `chromadb`.

```yaml
static_resources:
  listeners:
    - name: listener_0
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 443
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
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
          transport_socket:
            name: envoy.transport_sockets.tls
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.DownstreamTlsContext
              common_tls_context:
                tls_certificates:
                  - certificate_chain:
                      filename: "/etc/envoy/certs/servercert.pem"
                    private_key:
                      filename: "/etc/envoy/certs/serverkey.pem"
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

Finally the docker compose to tie things up where we have added a `cert-gen` step to automatically generate the certificates, prior to starting the `envoy` and `chromadb` services.

```yaml
version: '3'
networks:
  net:
    driver: bridge
services:
  cert-gen:
    image: openquantumsafe/openssl3
    volumes:
      - ./certs:/certs
      - ./openssl.cnf:/etc/ssl/openssl.cnf
    command: |
      sh -c "[ -f /certs/servercert.pem ] || \
      openssl req -new -newkey rsa:2048 -sha256 -days 365 -nodes -x509 -keyout /certs/serverkey.pem -out /certs/servercert.pem -subj '/O=Chroma/C=US' -config /etc/ssl/openssl.cnf"
    environment:
      - CHROMA_DOMAIN=${CHROMA_DOMAIN:-localhost}
  envoy:
    image: bitnami/envoy
    volumes:
      - ./envoy.yaml:/opt/bitnami/envoy/conf/envoy.yaml
      - ./certs:/etc/envoy/certs
      - ./wait-for-certs.sh:/usr/local/bin/wait-for-certs.sh
    ports:
      - "443:443"
    networks:
      - net
    depends_on:
      cert-gen:
        condition: service_completed_successfully
      chromadb:
        condition: service_healthy
    entrypoint: |
      sh -c "/usr/local/bin/wait-for-certs.sh && \
      /opt/bitnami/envoy/bin/envoy -c /opt/bitnami/envoy/conf/envoy.yaml"
  chromadb:
    image: chromadb/chroma:0.5.20
    volumes:
      - ./chromadb:/chroma/chroma
    environment:
      - IS_PERSISTENT=TRUE
      - ANONYMIZED_TELEMETRY=${ANONYMIZED_TELEMETRY:-TRUE}
    networks:
      - net
    healthcheck:
      # Adjust below to match your container port
      test: [ "CMD", "curl", "-f", "http://localhost:8000/api/v1/heartbeat" ]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Nginx

Use the following Nginx config (`nginx.conf`) as a starting point and build from there:

```conf
server {
    listen 443 ssl;
    server_name localhost;

    ssl_certificate /etc/nginx/certs/servercert.pem;
    ssl_certificate_key /etc/nginx/certs/serverkey.pem;

    location / {
        proxy_pass http://chromadb:8000;
        proxy_set_header Host $host;
        proxy_http_version 1.1;  # Use HTTP/1.1
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Create a `docker-compose.yml` file with the following content:

!!! warn "Config Files"

    For the following `docker-compose.yaml` to operate successfully `openssl.cnf` and `nginx.conf` files need to be present in the same directory.

```yaml
version: '3'
networks:
  net:
    driver: bridge
services:
  cert-gen:
    image: openquantumsafe/openssl3
    volumes:
      - ./certs:/certs
      - ./openssl.cnf:/etc/ssl/openssl.cnf
    command: |
      sh -c "[ -f /certs/servercert.pem ] || \
      openssl req -new -newkey rsa:2048 -sha256 -days 365 -nodes -x509 -keyout /certs/serverkey.pem -out /certs/servercert.pem -subj '/O=Chroma/C=US' -config /etc/ssl/openssl.cnf"
    environment:
      - CHROMA_DOMAIN=${CHROMA_DOMAIN:-localhost}
  chromadb:
    image: chromadb/chroma:0.5.20
    volumes:
      - ./chromadb:/chroma/chroma
    environment:
      - IS_PERSISTENT=TRUE
      - ANONYMIZED_TELEMETRY=${ANONYMIZED_TELEMETRY:-TRUE}
    ports:
      - "8000:8000"
    healthcheck:
      # Adjust below to match your container port
      test: [ "CMD", "curl", "-f", "http://localhost:8000/api/v1/heartbeat" ]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - net
  nginx:
    image: nginx:latest
    depends_on:
      - cert-gen
      - chromadb
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./certs:/etc/nginx/certs
    networks:
      - net
    depends_on:
      chromadb:
        condition: service_healthy
```

