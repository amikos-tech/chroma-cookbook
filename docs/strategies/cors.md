# CORS Configuration for Browser-Based Access

Chroma [JS package](https://www.npmjs.com/package/chromadb) allows you to use Chroma in your browser-based SPA
application. This is great, but that means that
you'll need to configure Chroma to work with your browser to avoid CORS issues.

## Setting up Chroma for Browser-Based Access

### Chroma 1.0 or later

To allow browsers to directly access your Chroma instance you'll need to configure
the `CHROMA_CORS_ALLOW_ORIGINS`. The `CHROMA_CORS_ALLOW_ORIGINS` environment variable controls the hosts
which are allowed to access your Chroma instance.

!!! note "Note"

    The `CHROMA_CORS_ALLOW_ORIGINS` environment variable is a list of strings. Each string is a URL that is allowed
    to access your Chroma instance. If you want to allow all hosts to access your Chroma instance, you can set
    `CHROMA_CORS_ALLOW_ORIGINS` to `["*"]`. This is **not recommended** for production environments.




=== "CLI"

    ```bash
    export CHROMA_CORS_ALLOW_ORIGINS='["http://localhost:3000"]'
    chroma run --path /path/to/chroma-data
    ```

    Verify with `curl -i -X GET http://localhost:8000/api/v2/version -H "Origin: http://localhost:3000"` in the response you should see `access-control-allow-origin: http://localhost:3000` being returned if all works fine


=== "Docker"

    ```bash
    docker run -e CHROMA_CORS_ALLOW_ORIGINS='["http://localhost:3000"]' -p 8000:8000 chromadb/chroma:1.0.20
    ```

    Verify with `curl -i -X GET http://localhost:8000/api/v2/version -H "Origin: http://localhost:3000"` in the response you should see `access-control-allow-origin: http://localhost:3000` being returned if all works fine


=== "Docker Compose"

    ```yaml
    version: '3.9'

    networks:
      net:
        driver: bridge

    services:
      server:
        image: chromadb/chroma:1.0.20
        volumes:
          # Be aware that indexed data are located in "/data/"
          - chroma-data:/data
        environment:
          - CHROMA_SERVER_CORS_ALLOW_ORIGINS=["http://localhost:3000"]
        restart: unless-stopped # possible values are: "no", always", "on-failure", "unless-stopped"
        ports:
          - "8000:8000"
        healthcheck:
          # Adjust below to match your container port
          test: [ "CMD", "curl", "-f", "http://localhost:8000/api/v2/heartbeat" ]
          interval: 30s
          timeout: 10s
          retries: 3
        networks:
          - net

    volumes:
      chroma-data:
        driver: local
    ```

    Run `docker compose up` to start your Chroma instance.
    Verify with `curl -i -X GET http://localhost:8000/api/v2/version -H "Origin: http://localhost:3000"` in the response you should see `access-control-allow-origin: http://localhost:3000` being returned if all works fine

### Chroma Pre-1.0 (Legacy)

To allow browsers to directly access your Chroma instance you'll need to configure
the `CHROMA_SERVER_CORS_ALLOW_ORIGINS`. The `CHROMA_SERVER_CORS_ALLOW_ORIGINS` environment variable controls the hosts
which are allowed to access your Chroma instance.

!!! note "Note"

    The `CHROMA_SERVER_CORS_ALLOW_ORIGINS` environment variable is a list of strings. Each string is a URL that is allowed
    to access your Chroma instance. If you want to allow all hosts to access your Chroma instance, you can set
    `CHROMA_SERVER_CORS_ALLOW_ORIGINS` to `["*"]`. This is not recommended for production environments.

The below examples assume that your web app is running on `http://localhost:3000`. You can find an example of NextJS and
Langchain [here](https://github.com/amikos-tech/chroma-langchain-nextjs).


=== "CLI"

    ```bash
    export CHROMA_SERVER_CORS_ALLOW_ORIGINS='["http://localhost:3000"]'
    chroma run --path /path/to/chroma-data
    ```

=== "Docker"

    ```bash
    docker run -e CHROMA_SERVER_CORS_ALLOW_ORIGINS='["http://localhost:3000"]' -v /path/to/chroma-data:/chroma/chroma -p 8000:8000 chromadb/chroma:0.6.3
    ```

=== "Docker Compose"

    ```yaml
    version: '3.9'

    networks:
      net:
        driver: bridge

    services:
      server:
        image: chromadb/chroma:0.6.3
        volumes:
          # Be aware that indexed data are located in "/chroma/chroma/"
          # Default configuration for persist_directory in chromadb/config.py
          # Read more about deployments: https://docs.trychroma.com/deployment
          - chroma-data:/chroma/chroma
        command: "--workers 1 --host 0.0.0.0 --port 8000 --proxy-headers --log-config chromadb/log_config.yml --timeout-keep-alive 30"
        environment:
          - IS_PERSISTENT=TRUE
          - CHROMA_SERVER_AUTH_PROVIDER=${CHROMA_SERVER_AUTH_PROVIDER}
          - CHROMA_SERVER_AUTHN_CREDENTIALS_FILE=${CHROMA_SERVER_AUTHN_CREDENTIALS_FILE}
          - CHROMA_SERVER_AUTHN_CREDENTIALS=${CHROMA_SERVER_AUTHN_CREDENTIALS}
          - CHROMA_AUTH_TOKEN_TRANSPORT_HEADER=${CHROMA_AUTH_TOKEN_TRANSPORT_HEADER}
          - PERSIST_DIRECTORY=${PERSIST_DIRECTORY:-/chroma/chroma}
          - CHROMA_OTEL_EXPORTER_ENDPOINT=${CHROMA_OTEL_EXPORTER_ENDPOINT}
          - CHROMA_OTEL_EXPORTER_HEADERS=${CHROMA_OTEL_EXPORTER_HEADERS}
          - CHROMA_OTEL_SERVICE_NAME=${CHROMA_OTEL_SERVICE_NAME}
          - CHROMA_OTEL_GRANULARITY=${CHROMA_OTEL_GRANULARITY}
          - CHROMA_SERVER_NOFILE=${CHROMA_SERVER_NOFILE}
          - CHROMA_SERVER_CORS_ALLOW_ORIGINS=["http://localhost:3000"]
        restart: unless-stopped # possible values are: "no", always", "on-failure", "unless-stopped"
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

    Run `docker compose up` to start your Chroma instance.