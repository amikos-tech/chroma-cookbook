# Deployment Patterns Examples

Standalone examples that match `docs/running/deployment-patterns.md`.

## Files

- `embedded/python/app_embedded.py` - Embedded mode (`PersistentClient`)
- `server/docker-compose.yml` - Local Chroma server for server mode
- `server/python/app_http.py` - Server mode client (`HttpClient`)

## Embedded mode

```bash
pip install -r examples/deployment-patterns/requirements.txt
python examples/deployment-patterns/embedded/python/app_embedded.py
```

Data is persisted under `./chroma_data` relative to your current working directory when you run the script.

## Server mode

```bash
docker compose -f examples/deployment-patterns/server/docker-compose.yml up -d
pip install -r examples/deployment-patterns/requirements.txt
python examples/deployment-patterns/server/python/app_http.py
```

Stop the local server when done:

```bash
docker compose -f examples/deployment-patterns/server/docker-compose.yml down
```
