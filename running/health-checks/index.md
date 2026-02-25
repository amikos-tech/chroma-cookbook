# Health Checks

Health checks tell your orchestrator whether Chroma is running and ready to serve requests. They are used to keep traffic away from unready instances, trigger automated restarts for unhealthy ones, and coordinate startup order for dependent services.

## Docker Compose

The simplest form of health check is to use the `healthcheck` directive in the `docker-compose.yml` file. This is useful if you are deploying Chroma alongside other services that may depend on it.

```yaml
services:
  chromadb:
    image: chromadb/chroma:1.5.1
    volumes:
      - ./chroma-data:/data
    ports:
      - "8000:8000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v2/heartbeat"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Kubernetes

In kubernetes you can use the `livenessProbe` and `readinessProbe` to check the health of the server. This is useful if you are deploying Chroma in a kubernetes cluster.

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
                        path: /api/v2/heartbeat
                        port: 8000
                    initialDelaySeconds: 5
                    periodSeconds: 5
                readinessProbe:
                    httpGet:
                        path: /api/v2/heartbeat
                        port: 8000
                    initialDelaySeconds: 5
                    periodSeconds: 5
                startupProbe:
                    httpGet:
                      path: /api/v2/heartbeat
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
