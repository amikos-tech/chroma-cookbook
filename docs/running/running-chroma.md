# Running Chroma

## CLI

```bash
pip install chromadb
chroma run --path /path/to/my/localdata
```

Available options:

| Option | Description |
| --- | --- |
| `--path` | Path to the collection. |
| `--host` | Host to run the server on. |
| `--port` | Port to run the server on. |


## Docker Run

```bash
docker run -p 8000:8000 -v /path/to/my/localdata:/chroma/chroma chromadb/chroma:latest
```

## Docker Compose (cloned repo)

```bash
git clone 
docker-compose up -d --build
```

## Docker Compose (pulled image)

```yaml
