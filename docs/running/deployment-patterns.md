# Deployment Patterns

If you are building with Chroma, you usually start with one of two setups:

1. **Embedded mode** - Chroma runs inside your Python process (`PersistentClient`)
2. **Server mode** - Chroma runs as a standalone service and your app connects via HTTP (`HttpClient`)

You do not need to pick forever. Many teams start embedded, then move to server mode when they need shared access across apps or machines.

## Embedded in your application

This is the easiest way to get moving: your app and Chroma run in the same Python process, and data is stored in a local folder.

Pick this when you want:

- the shortest path from idea to working prototype
- simple local development (no separate DB service to run)
- low-latency reads/writes in one app process

!!! warning "One important gotcha"

    Chroma is thread-safe but not process-safe. Avoid multiple processes writing to the same local `path`.

### Example 1: Embedded `PersistentClient` in a Python service

1. Install Chroma:

```bash
pip install chromadb
```

2. Create `app_embedded.py`:

```python
import chromadb


class EmbeddedKnowledgeBase:
    def __init__(self, path: str = "./chroma_data") -> None:
        self.client = chromadb.PersistentClient(path=path)
        self.collection = self.client.get_or_create_collection(
            name="support_kb",
            embedding_function=None,  # using explicit embeddings below
        )

    def add_article(self, article_id: str, text: str, embedding: list[float], product: str) -> None:
        self.collection.upsert(
            ids=[article_id],
            documents=[text],
            embeddings=[embedding],
            metadatas=[{"product": product}],
        )

    def search(self, query_embedding: list[float], product: str, n_results: int = 2) -> dict:
        return self.collection.query(
            query_embeddings=[query_embedding],
            where={"product": product},
            n_results=n_results,
            include=["documents", "metadatas", "distances"],
        )


if __name__ == "__main__":
    kb = EmbeddedKnowledgeBase(path="./chroma_data")

    kb.add_article(
        article_id="a1",
        text="Refunds are available within 30 days for annual plans.",
        embedding=[0.11, 0.20, 0.31],
        product="billing",
    )
    kb.add_article(
        article_id="a2",
        text="You can rotate API keys from the admin settings page.",
        embedding=[0.12, 0.18, 0.30],
        product="platform",
    )

    result = kb.search(query_embedding=[0.10, 0.19, 0.32], product="billing")
    print(result["documents"][0])
```

3. Run it:

```bash
python app_embedded.py
```

That is it. Your vectors are now persisted under `./chroma_data` and travel with your app lifecycle.

## Standalone server

In this pattern, Chroma runs as its own service. Your app talks to it over HTTP using `HttpClient`.

Pick this when you want:

- multiple app instances using one shared Chroma deployment
- a clean boundary between app code and database service
- the option to scale app and database separately

### Example 2: Typical server deployment + Python `HttpClient`

1. Start Chroma server with Docker Compose:

```yaml title="docker-compose.yml"
services:
  chroma:
    image: chromadb/chroma:1.5.1
    ports:
      - "8000:8000"
    volumes:
      - ./chroma-data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v2/heartbeat"]
      interval: 30s
      timeout: 10s
      retries: 3
```

```bash
docker compose up -d
```

2. Connect from your Python app with `HttpClient`:

```python
import os
import chromadb


def get_client() -> chromadb.HttpClient:
    return chromadb.HttpClient(
        host=os.getenv("CHROMA_HOST", "localhost"),
        port=int(os.getenv("CHROMA_PORT", "8000")),
        ssl=os.getenv("CHROMA_SSL", "false").lower() == "true",
    )


if __name__ == "__main__":
    client = get_client()
    collection = client.get_or_create_collection(
        name="support_kb",
        embedding_function=None,
    )

    collection.upsert(
        ids=["a3"],
        documents=["Password reset links expire after 15 minutes."],
        embeddings=[[0.09, 0.22, 0.28]],
    )

    result = collection.query(
        query_embeddings=[[0.10, 0.21, 0.29]],
        n_results=1,
        include=["documents", "distances"],
    )
    print(result["documents"][0])
```

3. Set host/port when needed (for example in containers):

```bash
export CHROMA_HOST=chroma
export CHROMA_PORT=8000
python app_http.py
```

### Usual production shape

- put Chroma behind a reverse proxy or load balancer for HTTPS and controlled access
- mount durable storage for Chroma data (`/data` in container deployments)
- use `/api/v2/heartbeat` for health checks
- scale your app replicas and Chroma deployment independently

For next steps, see:

- [Running Chroma](running-chroma.md)
- [Health Checks](health-checks.md)
- [Systemd service](systemd-service.md)
- [Road To Production](road-to-prod.md)
