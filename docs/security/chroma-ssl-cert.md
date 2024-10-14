# SSL/TLS Certificates in Chroma

Chroma uses uvicorn as an ASGI server, which can be configured to use SSL/TLS certificates.

!!! warn "CLI not supported"

    Using certificates with Chroma CLI is not yet supported.

??? tip "Performance Impact"

    Using certificates within Chroma will have a performance impact as `uvicorn` will need to hnadle 
    the encryption and decryption of the data. If performance is of concern, 
    consider using a reverse proxy like `nginx` or `envoy` to handle the SSL/TLS termination.

## Self-Signed Certificates

### Creating a self-signed certificate

!!! warning "Important"

   The `SAN` (Subject Alternative Name) is required for the certificate to work as modern security standards require
   the certificate to match the domain name.

You will also need to create a `openssl.cnf` file in the same directory with the following content:

    ```ini
    [req]
    distinguished_name = req_distinguished_name
    x509_extensions = usr_cert
    
    [req_distinguished_name]
    CN = $ENV::CHROMA_DOMAIN
    
    [usr_cert]
    subjectAltName = DNS:$ENV::CHROMA_DOMAIN
    ```

??? tip "Certificate Domain - CHROMA_DOMAIN"

    You can set the `CHROMA_DOMAIN` environment variable to the domain you want to use for the certificate. 

=== "OpenSSL"

    To run the following you will need to have `openssl` installed on your system.
    
    ```bash
    export CHROMA_DOMAIN=${CHROMA_DOMAIN:-"localhost"}
    openssl req -new -newkey rsa:2048 -sha256 -days 365 -nodes -x509 \
      -keyout certs/serverkey.pem \
      -subj '/O=Chroma/C=US' \
      -out certs/servercert.pem \
      -config openssl.cnf
    ```

    This will create a self-signed certificate and key in the `certs` directory.

=== "Docker"

    If you are using Docker, you can use the following command to generate the certificates:
    
    ```bash
    docker run --rm -v $(pwd)/certs:/certs \
      -v $(pwd)/openssl.cnf:/etc/ssl/openssl.cnf \
      -e CHROMA_DOMAIN=localhost \
      openquantumsafe/openssl3 \
      openssl req -new -newkey rsa:2048 -sha256 -days 365 -nodes -x509 \
      -keyout /certs/serverkey.pem \
      -subj '/O=Chroma/C=US' \
      -out /certs/servercert.pem \
      -config /etc/ssl/openssl.cnf
    ```

??? warn "Security Warning"

    Self-signed certificates are not recommended for production use. They are only suitable for testing and development
    purposes. Additionally in the above example the keyfile is not password protected, which is also not recommended for
    production use.

### Configuring and running Chroma

You can run Chroma with the SSL/TLS certificate generate above or any other certificate you have.

=== "Docker"

    To run Chroma with the self-signed certificate, you can use the following command:

    ```bash
    docker run --rm -it -p 8000:8000 \
      -v $(pwd)/certs:/chroma/certs \
      chromadb/chroma:0.5.0 \
      --workers 1 \
      --host 0.0.0.0 \
      --port 8000 \
      --proxy-headers \
      --log-config chromadb/log_config.yml \
      --timeout-keep-alive 30 \
      --ssl-keyfile /chroma/certs/serverkey.pem \
      --ssl-certfile /chroma/certs/servercert.pem
    ```

=== "Docker Compose"

    To run Chroma with the self-signed certificate using Docker Compose, you can use the following `docker-compose.yml` file:

    ```yaml
    version: '3.9'
    
    networks:
      net:
        driver: bridge
    
    services:
      server:
        image: chromadb/chroma:0.5.13
        volumes:
          # Be aware that indexed data are located in "/chroma/chroma/"
          # Default configuration for persist_directory in chromadb/config.py
          # Read more about deployments: https://docs.trychroma.com/deployment
          - chroma-data:/chroma/chroma
        command: "--workers 1 --host 0.0.0.0 --port 8000 --proxy-headers --log-config chromadb/log_config.yml --timeout-keep-alive 30 --ssl-keyfile /chroma/certs/serverkey.pem --ssl-certfile /chroma/certs/servercert.pem"
        environment:
          - IS_PERSISTENT=TRUE
          - CHROMA_SERVER_AUTHN_PROVIDER=${CHROMA_SERVER_AUTHN_PROVIDER}
          - CHROMA_SERVER_AUTHN_CREDENTIALS_FILE=${CHROMA_SERVER_AUTHN_CREDENTIALS_FILE}
          - CHROMA_SERVER_AUTHN_CREDENTIALS=${CHROMA_SERVER_AUTHN_CREDENTIALS}
          - CHROMA_AUTH_TOKEN_TRANSPORT_HEADER=${CHROMA_AUTH_TOKEN_TRANSPORT_HEADER}
          - PERSIST_DIRECTORY=${PERSIST_DIRECTORY:-/chroma/chroma}
          - CHROMA_OTEL_EXPORTER_ENDPOINT=${CHROMA_OTEL_EXPORTER_ENDPOINT}
          - CHROMA_OTEL_EXPORTER_HEADERS=${CHROMA_OTEL_EXPORTER_HEADERS}
          - CHROMA_OTEL_SERVICE_NAME=${CHROMA_OTEL_SERVICE_NAME}
          - CHROMA_OTEL_GRANULARITY=${CHROMA_OTEL_GRANULARITY}
          - CHROMA_SERVER_NOFILE=${CHROMA_SERVER_NOFILE}
        restart: unless-stopped
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
    
    volumes:
      chroma-data:
        driver: local
    ```

## Using a Certificate Authority

Examples below will demonstrate how to use `certbot` to generate a certificate with a given certificate authority.

### Let's Encrypt

Coming soon!

### AWS Certificate Manager

Coming soon!