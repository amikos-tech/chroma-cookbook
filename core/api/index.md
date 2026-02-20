# Chroma API

In this article we will cover the Chroma API in an indepth details.

## Accessing the API

If you are running a Chroma server you can access its API at - `http://<chroma_server_host>:<chroma_server_port>/docs` ( e.g. `http://localhost:8000/docs`).

Alternatively you can take a peek at the latest API from Chroma Cloud - https://api.trychroma.com:8000/docs

## API Endpoints

TBD

## Generating Clients

While Chroma ecosystem has client implementations for many languages, it may be the case you want to roll out your own. Below we explain some of the options available to you:

### Using OpenAPI Generator

The fastest way to build a client is to use the OpenAPI Generator with the API spec. Chroma provides an OpenAPI specification that can be used to generate clients in various programming languages.

#### Prerequisites

1. Install the OpenAPI Generator CLI:

   ```bash
   # Using npm
   npm install @openapitools/openapi-generator-cli -g

   # Using Docker
   docker pull openapitools/openapi-generator-cli
   ```

1. Get the OpenAPI specification:

1. From a running Chroma server: `http://<chroma_server_host>:<chroma_server_port>/openapi.json`

1. From Chroma Cloud: `https://api.trychroma.com:8000/openapi.json`

#### Generating Clients

Here are examples for generating clients in different languages:

**Python Client:**

```bash
# Using npm CLI
openapi-generator-cli generate \
  -i https://api.trychroma.com:8000/openapi.json \
  -g python \
  -o ./chroma-python-client \
  --additional-properties=packageName=chroma_client,packageVersion=1.0.0

# Using Docker
docker run --rm \
  -v ${PWD}:/local openapitools/openapi-generator-cli generate \
  -i https://api.trychroma.com:8000/openapi.json \
  -g python \
  -o /local/chroma-python-client \
  --additional-properties=packageName=chroma_client,packageVersion=1.0.0
```

**TypeScript/JavaScript Client:**

```bash
# Using npm CLI
openapi-generator-cli generate \
  -i https://api.trychroma.com:8000/openapi.json \
  -g typescript-fetch \
  -o ./chroma-typescript-client \
  --additional-properties=npmName=@chroma/client,npmVersion=1.0.0

# Using Docker
docker run --rm \
  -v ${PWD}:/local openapitools/openapi-generator-cli generate \
  -i http://localhost:8000/openapi.json \
  -g typescript-fetch \
  -o /local/chroma-typescript-client \
  --additional-properties=npmName=@chroma/client,npmVersion=1.0.0
```

**Java Client:**

```bash
# Using npm CLI
openapi-generator-cli generate \
  -i http://localhost:8000/openapi.json \
  -g java \
  -o ./chroma-java-client \
  --additional-properties=groupId=com.chroma,artifactId=chroma-client,artifactVersion=1.0.0

# Using Docker
docker run --rm \
  -v ${PWD}:/local openapitools/openapi-generator-cli generate \
  -i http://localhost:8000/openapi.json \
  -g java \
  -o /local/chroma-java-client \
  --additional-properties=groupId=com.chroma,artifactId=chroma-client,artifactVersion=1.0.0
```

**Go Client:**

```bash
# Using npm CLI
openapi-generator-cli generate \
  -i http://localhost:8000/openapi.json \
  -g go \
  -o ./chroma-go-client \
  --additional-properties=packageName=chroma,packageVersion=1.0.0

# Using Docker
docker run --rm \
  -v ${PWD}:/local openapitools/openapi-generator-cli generate \
  -i http://localhost:8000/openapi.json \
  -g go \
  -o /local/chroma-go-client \
  --additional-properties=packageName=chroma,packageVersion=1.0.0
```

#### Using the Generated Client

After generating the client, you can use it in your code. Here's an example with the Python client:

```python
# Install the generated client
cd chroma-python-client
pip install -e .

# Use the client
from chroma_client import ApiClient, DefaultApi

# Create API client
client = ApiClient(host="http://localhost:8000")
api = DefaultApi(client)

# List collections
collections = api.list_collections()
print(f"Found {len(collections)} collections")
```

#### Available Generators

The OpenAPI Generator supports many languages and frameworks. Some popular options include:

- `python` - Python client
- `typescript-fetch` - TypeScript client using fetch
- `typescript-axios` - TypeScript client using axios
- `java` - Java client
- `go` - Go client
- `csharp` - C# client
- `php` - PHP client
- `ruby` - Ruby client
- `rust` - Rust client

For a complete list of available generators, run:

```bash
openapi-generator-cli list
```

### Manually Creating a Client

If you more control over things, you can create your own client by using the API spec as guideline.

##### Python

##### Typescript

##### Golang

##### Java

##### Rust

##### Elixir
