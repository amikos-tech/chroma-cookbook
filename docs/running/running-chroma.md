# Running Chroma

## CLI

```bash
pip install chromadb
chroma run --path /path/to/my/localdata
```

Available options:

| Option   | Description                |
|----------|----------------------------|
| `--path` | Path to the collection.    |
| `--host` | Host to run the server on. |
| `--port` | Port to run the server on. |

## Docker Run

The below command will run a background container of chroma named `chroma` with the data stored in `./chroma-data` (
mounted volume) and exposed on port `8000`.
The `-e` env var `IS_PERSISTENT=true` will ensure that the data is persisted in the mounted volume.

```bash
docker run -d --rm --name chroma -v ./chroma-data:/chroma/chroma -p 8000:8000 -e IS_PERSISTENT=true chromadb/chroma:latest
```

## Docker Compose (cloned repo)

```bash
git clone 
docker-compose up -d --build
```

## Docker Compose (cloned repo with overrides)

Create an override file `docker-compose.override.yml`. The override file can be used to override any of the settings in
Chroma's default `docker-compose.yml` file.

Here is an example where we override the exposed port to be `8001` instead of `8000` (the default):

```yaml
version: '3.9'
services:
  server:
    ports:
      - 8001:8000
```

Here is another example where we mount a local directory (`./chroma-data`) to the container's `/chroma/chroma`
directory:

```yaml
version: '3.9'
services:
  server:
    volumes:
      - ./chroma-data:/chroma/chroma
```

Generally `.override.` files are stored together with the main docker-compose file however you can store them anywhere
and use the `-f` flag to specify the override file:

```bash
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d --build
```

> Note: The order of the `-f` flags is important. The first file specified is the base file and the second file
> specified is the override file.
> Note: When destroying the stack you must specify the override file as
> well - `docker-compose -f docker-compose.yml -f docker-compose.override.yml down --rmi --volumes`

```bash

## Docker Compose (pulled image)

```yaml
```
