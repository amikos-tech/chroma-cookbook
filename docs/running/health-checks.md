# Health Checks

## Docker Compose

The simples form of health check is to use the `healthcheck` directive in the `docker-compose.yml` file. This is useful
if you are deploying Chroma alongside other services that may depend on it.

```yaml
version: '3.9'

networks:
  net:
    driver: bridge

services:
  server:
    image: server
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      # Be aware that indexed data are located in "/chroma/chroma/"
      # Default configuration for persist_directory in chromadb/config.py
      # Read more about deployments: https://docs.trychroma.com/deployment
      - chroma-data:/chroma/chroma
    command: "--workers 1 --host 0.0.0.0 --port 8000 --proxy-headers --log-config chromadb/log_config.yml --timeout-keep-alive 30"
    environment:
      - IS_PERSISTENT=TRUE
      - CHROMA_SERVER_AUTH_PROVIDER=${CHROMA_SERVER_AUTH_PROVIDER}
      - CHROMA_SERVER_AUTH_CREDENTIALS_FILE=${CHROMA_SERVER_AUTH_CREDENTIALS_FILE}
      - CHROMA_SERVER_AUTH_CREDENTIALS=${CHROMA_SERVER_AUTH_CREDENTIALS}
      - CHROMA_SERVER_AUTH_CREDENTIALS_PROVIDER=${CHROMA_SERVER_AUTH_CREDENTIALS_PROVIDER}
      - CHROMA_SERVER_AUTH_TOKEN_TRANSPORT_HEADER=${CHROMA_SERVER_AUTH_TOKEN_TRANSPORT_HEADER}
      - PERSIST_DIRECTORY=${PERSIST_DIRECTORY:-/chroma/chroma}
      - CHROMA_OTEL_EXPORTER_ENDPOINT=${CHROMA_OTEL_EXPORTER_ENDPOINT}
      - CHROMA_OTEL_EXPORTER_HEADERS=${CHROMA_OTEL_EXPORTER_HEADERS}
      - CHROMA_OTEL_SERVICE_NAME=${CHROMA_OTEL_SERVICE_NAME}
      - CHROMA_OTEL_GRANULARITY=${CHROMA_OTEL_GRANULARITY}
      - CHROMA_SERVER_NOFILE=${CHROMA_SERVER_NOFILE}
    ports:
      - 8000:8000
    healthcheck:
      test: [ "CMD", "/bin/bash", "-c", "cat < /dev/null > /dev/tcp/localhost/8001" ]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - net
volumes:
  chroma-data:
    driver: local
```

## Kubernetes

In kubernetes you can use the `livenessProbe` and `readinessProbe` to check the health of the server. This is useful if
you are deploying Chroma in a kubernetes cluster.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chroma
  labels:
    app: chroma
spec:
    replicas: 1
    selector:
        matchLabels:
          app: chroma
    template:
        metadata:
            labels:
                app: chroma
        spec:
            containers:
              - name: chroma
                image: <chroma-image>
                ports:
                - containerPort: 8000
                livenessProbe:
                    httpGet:
                        path: /api/v1
                        port: 8000
                    initialDelaySeconds: 5
                    periodSeconds: 5
                readinessProbe:
                    httpGet:
                        path: /api/v1
                        port: 8000
                    initialDelaySeconds: 5
                    periodSeconds: 5
                startupProbe:
                    httpGet:
                      path: /api/v1
                      port: 8000
                    failureThreshold: 3
                    periodSeconds: 60
                    initialDelaySeconds: 60
```

Alternative to the `httpGet` you can also use `tcpSocket`:
    
```yaml
          readinessProbe:
            tcpSocket:
              port: 8000
            failureThreshold: 3
            timeoutSeconds: 30
            periodSeconds: 60
          livenessProbe:
            tcpSocket:
              port: 8000
            failureThreshold: 3
            timeoutSeconds: 30
            periodSeconds: 60
          startupProbe:
            tcpSocket:
              port: 8000
            failureThreshold: 3
            periodSeconds: 60
            initialDelaySeconds: 60
```
