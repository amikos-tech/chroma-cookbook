# Chroma Ecosystem Clients

## Python

|               |                                                                                                  |
|---------------|--------------------------------------------------------------------------------------------------|
| Maintainer    | Chroma Core team                                                                                 |
| Repo          | [https://github.com/chroma-core/chroma](https://github.com/chroma-core/chroma)                   |
| Status        | ✅ Stable                                                                                         |
| Version       | `0.5.5.dev0` ([PyPi Link](https://pypi.org/project/chromadb-client/))                            |
| Docs          | [https://docs.trychroma.com/reference/py-client](https://docs.trychroma.com/reference/py-client) |
| Compatibility | Python: `3.8+`, Chroma API Version: `0.5.x`                                                      |

Feature Support:

| Feature           | Supported |
|-------------------|-----------|
| Create Tenant     | ✅         |
| Get Tenant        | ✅         |
| Create DB         | ✅         |
| Get DB            | ✅         |
| Create Collection | ✅         |
| Get Collection    | ✅         |
| List Collection   | ✅         |
| Count Collection  | ✅         |
| Delete Collection | ✅         |
| Add Documents     | ✅         |
| Delete Documents  | ✅         |
| Update Documents  | ✅         |
| Query Documents   | ✅         |
| Get Document      | ✅         |
| Count Documents   | ✅         |
| Auth - Basic      | ✅         |
| Auth - Token      | ✅         |
| Reset             | ✅         |

Embedding Function Support:

| Embedding Function            | Supported |
|-------------------------------|-----------|
| OpenAI                        | ✅         |
| Sentence Transformers         | ✅         |
| HuggingFace Inference API     | ✅         |
| Cohere                        | ✅         |
| Google Vertex AI              | ✅         |
| Google Generative AI (Gemini) | ✅         |
| OpenCLIP (Multi-modal)        | ✅         |

!!! note "Embedding Functions"

    The list above is not exhaustive. Check  [official docs](https://docs.trychroma.com/integrations#%F0%9F%A7%AC-embedding-integrations) for up-to-date information.

## JavaScript

|               |                                                                                                  |
|---------------|--------------------------------------------------------------------------------------------------|
| Maintainer    | Chroma Core team                                                                                 |
| Repo          | [https://github.com/chroma-core/chroma](https://github.com/chroma-core/chroma)                   |
| Status        | ✅ Stable                                                                                         |
| Version       | `1.8.1` ([NPM Link](https://www.npmjs.com/package/chromadb))                                     |
| Docs          | [https://docs.trychroma.com/reference/js-client](https://docs.trychroma.com/reference/js-client) |
| Compatibility | Python: `3.7+`, Chroma API Version: `TBD`                                                        |

Feature Support:

| Feature           | Supported |
|-------------------|-----------|
| Create Tenant     | ✅         |
| Get Tenant        | ✅         |
| Create DB         | ✅         |
| Get DB            | ✅         |
| Create Collection | ✅         |
| Get Collection    | ✅         |
| List Collection   | ✅         |
| Count Collection  | ✅         |
| Delete Collection | ✅         |
| Add Documents     | ✅         |
| Delete Documents  | ✅         |
| Update Documents  | ✅         |
| Query Documents   | ✅         |
| Get Document      | ✅         |
| Count Documents   | ✅         |
| Auth - Basic      | ✅         |
| Auth - Token      | ✅         |
| Reset             | ✅         |

Embedding Function Support:

| Embedding Function            | Supported |
|-------------------------------|-----------|
| OpenAI                        | ✅         |
| Sentence Transformers         | ✅         |
| HuggingFace Inference API     | ✅         |
| Cohere                        | ✅         |
| Google Vertex AI              | ✅         |
| Google Generative AI (Gemini) | ✅         |
| OpenCLIP (Multi-modal)        | ✅         |

!!! note "Embedding Functions"

    The list above is not exhaustive. Check  [official docs](https://docs.trychroma.com/integrations#%F0%9F%A7%AC-embedding-integrations) for up-to-date information.

## Ruby Client

https://github.com/mariochavez/chroma

## Java Client

https://github.com/amikos-tech/chromadb-java-client

## Go Client

|               |                                                                                      |
|---------------|--------------------------------------------------------------------------------------|
| Maintainer    | Amikos Tech (Chroma Core contributor)                                                |
| Repo          | [https://github.com/amikos-tech/chroma-go](https://github.com/amikos-tech/chroma-go) |
| Status        | ✅ Stable                                                                             |
| Version       | `0.1.4` ([Go Pkg Link](https://pkg.go.dev/github.com/amikos-tech/chroma-go/))        |
| Docs          | [https://go-client.chromadb.dev/](https://go-client.chromadb.dev/)                   |
| Compatibility | Go: `1.21+`, Chroma API Version: `0.5.x`                                             |

Feature Support:

| Feature           | Supported |
|-------------------|-----------|
| Create Tenant     | ✅         |
| Get Tenant        | ✅         |
| Create DB         | ✅         |
| Get DB            | ✅         |
| Create Collection | ✅         |
| Get Collection    | ✅         |
| List Collection   | ✅         |
| Count Collection  | ✅         |
| Delete Collection | ✅         |
| Add Documents     | ✅         |
| Delete Documents  | ✅         |
| Update Documents  | ✅         |
| Query Documents   | ✅         |
| Get Document      | ✅         |
| Count Documents   | ✅         |
| Auth - Basic      | ✅         |
| Auth - Token      | ✅         |
| Reset             | ✅         |

Embedding Function Support:

| Embedding Function                                                                                                           | Supported |
|------------------------------------------------------------------------------------------------------------------------------|-----------|
| [OpenAI](https://go-client.chromadb.dev/embeddings/#openai)                                                                  | ✅         |
| [HuggingFace Inference API](https://go-client.chromadb.dev/embeddings/#huggingface-inference-api)                            | ✅         |
| [Cohere](https://go-client.chromadb.dev/embeddings/#cohere)                                                                  | ✅         |
| [Google Generative AI (Gemini)](https://go-client.chromadb.dev/embeddings/#google-gemini-ai)                                 | ✅         |
| [Mistral AI](https://go-client.chromadb.dev/embeddings/#mistral-ai)                                                          | ✅         |
| [Cloudflare Workers AI](https://go-client.chromadb.dev/embeddings/#cloudflare-workers-ai))                                   | ✅         |
| [Together AI](https://go-client.chromadb.dev/embeddings/#together-ai)                                                        | ✅         |
| [Ollama](https://go-client.chromadb.dev/embeddings/#ollama)                                                                  | ✅         |
| [Nomic AI](https://go-client.chromadb.dev/embeddings/#nomic-ai)                                                              | ✅         |
| [Hugging Face Embedding Inference Server](https://go-client.chromadb.dev/embeddings/#huggingface-embedding-inference-server) | ✅         |

## C# Client

https://github.com/microsoft/semantic-kernel/tree/main/dotnet/src/Connectors/Connectors.Memory.Chroma

## Rust Client

https://crates.io/crates/chromadb

## Elixir Client

https://hex.pm/packages/chroma/

## Dart Client

https://pub.dev/packages/chromadb

## PHP Client

https://github.com/CodeWithKyrian/chromadb-php

## PHP (Laravel) Client

https://github.com/helgeSverre/chromadb