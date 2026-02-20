# Running Chroma

## Local Server

Article Link

This article is also available on Medium [Running ChromaDB — Part 1: Local Server](https://medium.com/@amikostech/running-chromadb-part-1-local-server-2c61cb1c9f2c).

### Chroma CLI

The simplest way to run Chroma locally is via the Chroma `cli`.

Prerequisites:

- Python 3.9+ (for `pip`, `pipx`, or `uv`) - [Download Python | Python.org](https://www.python.org/downloads/)
- Node.js (for `npm`, `pnpm`, `bun`, or `yarn`) - [Download Node.js | nodejs.org](https://nodejs.org/en/download)
- `curl` (or Windows PowerShell) for standalone CLI install script

Install Chroma CLI with any of the following:

#### Python

```shell
pip install chromadb
```

```shell
uv venv .venv
source .venv/bin/activate  # macOS/Linux
# Windows (PowerShell): .venv\Scripts\Activate.ps1
uv pip install chromadb
```

```shell
pipx install chromadb
```

```shell
uv tool install chromadb
```

#### JavaScript (Global)

```shell
npm install -g chromadb
```

```shell
pnpm add -g chromadb
```

```shell
bun add -g chromadb
```

```shell
yarn global add chromadb
```

#### Standalone Installer

```shell
curl -sSL https://raw.githubusercontent.com/chroma-core/chroma/main/rust/cli/install/install.sh | bash
```

```powershell
iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/chroma-core/chroma/main/rust/cli/install/install.ps1'))
```

```shell
chroma run --host localhost --port 8000 --path ./my_chroma_data
```

`--host` The host to bind to, by default `localhost`. Use `0.0.0.0` to expose it on your local network.

`--port` The port on which to listen to, by default this is `8000`.

`--path` The path where to persist your Chroma data locally.

Target Path Install

It is possible to install Chroma in a specific directory by running `pip install chromadb -t /path/to/dir`. To run Chroma CLI from that install location, execute: `/path/to/dir/bin/chroma run --path ./my_chroma_data`

For advanced 1.x server settings (YAML config and `CHROMA_` overrides), see [Chroma Configuration](https://cookbook.chromadb.dev/core/configuration/index.md).

Optional: CLI with YAML config (collapsed)

chroma.local.yaml

```yaml
port: 8000
listen_address: "127.0.0.1"
persist_path: "./my_chroma_data"
allow_reset: false
sqlitedb:
  hash_type: "md5"
  migration_mode: "apply"
```

```shell
CONFIG_PATH=./chroma.local.yaml chroma run
```

### Docker

Running Chroma server locally can be achieved via a simple docker command as shown below.

Prerequisites:

- Docker - [Overview of Docker Desktop | Docker Docs](https://docs.docker.com/desktop/)

```shell
docker run -d --rm --name chromadb \
  -p 8000:8000 \
  -v ./chroma-data:/data \
  chromadb/chroma:1.5.1
```

Options:

- `-p 8000:8000` specifies the port on which the Chroma server will be exposed.
- `-v` specifies a local dir which is where Chroma will store its data so when the container is destroyed the data remains. For current Chroma server images, mount `/data` to persist DB files.
- `chromadb/chroma:1.5.1` indicates the Chroma release version.

Current v1.x Images

Legacy environment variables such as `IS_PERSISTENT`, `PERSIST_DIRECTORY`, and `ANONYMIZED_TELEMETRY` are from older server configuration flows and should not be used in the default v1.x Docker run setup.

Optional: Docker with YAML config file (collapsed)

chroma.docker.yaml

```yaml
port: 8000
listen_address: "0.0.0.0"
persist_path: "/data"
allow_reset: false
sqlitedb:
  hash_type: "md5"
  migration_mode: "apply"
```

```shell
docker run -d --rm --name chromadb \
  -p 8000:8000 \
  -v ./chroma-data:/data \
  -v ./chroma.docker.yaml:/chroma/config.yaml:ro \
  -e CONFIG_PATH=/chroma/config.yaml \
  chromadb/chroma:1.5.1
```

### Docker Compose

Chroma server can also be run with Docker Compose by creating a `docker-compose.yaml`.

Prerequisites:

- Docker - [Overview of Docker Desktop | Docker Docs](https://docs.docker.com/desktop/)

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

The above will create a container with Chroma `1.5.1`, expose it on local port `8000`, and persist data in `./chroma-data` relative to where `docker-compose.yaml` is run.

Optional: Docker Compose with YAML config file (collapsed)

```yaml
services:
  chromadb:
    image: chromadb/chroma:1.5.1
    volumes:
      - ./chroma-data:/data
      - ./chroma.docker.yaml:/chroma/config.yaml:ro
    environment:
      - CONFIG_PATH=/chroma/config.yaml
    ports:
      - "8000:8000"
```

Versioning

When running Chroma with docker compose try to pin the version to a specific release. This will ensure intentional upgrades and avoid potential issues (usually with clients).

### Minikube With Helm Chart

KinD Alternative

This deployment can also be done with `KinD`, depending on your preference.

A more advanced approach to running Chroma locally (but also on a remote cluster) is to deploy it using a Helm chart.

Community-Maintained Chart

The chart used here is not a first-party Chroma chart and is maintained by a core contributor.

Prerequisites:

- Docker - [Overview of Docker Desktop | Docker Docs](https://docs.docker.com/desktop/)
- Install minikube - [minikube start | minikube (k8s.io)](https://minikube.sigs.k8s.io/docs/start/)
- kubectl - [Install Tools | Kubernetes](https://kubernetes.io/docs/tasks/tools/#kubectl)
- Helm - [Helm | Installing Helm](https://helm.sh/docs/intro/install/)

Once you have all of the above, running Chroma in a local `minikube` cluster is quite simple.

Create a `minikube` cluster:

```bash
minikube start --addons=ingress -p chroma
minikube profile chroma
```

Get and install the chart:

```bash
helm repo add chroma https://amikos-tech.github.io/chromadb-chart/
helm repo update
helm install chroma chroma/chromadb \
  --set image.tag="1.5.1"
```

Auth values for Chroma `>= 1.0.0`

Chart values under `chromadb.auth.*` are legacy and ignored. Use network-level controls (private networking, ingress auth, API gateway, mTLS) when needed.

The first step to connect and start using Chroma is to forward your port:

```bash
minikube service chroma-chromadb --url
```

The command returns a local URL such as `http://127.0.0.1:61892`.

Driver-specific behavior

On some setups (for example Docker driver on macOS), this command runs a local tunnel in the foreground. Keep that terminal open while you use the URL.

Test it out (`pip install chromadb`):

```python
import chromadb

client = chromadb.HttpClient(host="http://127.0.0.1:61892")
client.heartbeat()  # public endpoint

client.get_version()  # public endpoint

client.list_collections()  # expected to work in this local chart setup
```

For more information about the Helm chart, see [amikos-tech/chromadb-chart](https://github.com/amikos-tech/chromadb-chart) or [Artifact Hub](https://artifacthub.io/packages/helm/chromadb-helm/chromadb).
