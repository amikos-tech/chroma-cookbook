# Chroma API

In this article we will cover the Chroma API in an indepth details.

## Accessing the API

If you are running a Chroma server you can access its API at - `http://<chroma_server_host>:<chroma_server_port>/docs` (
e.g. `http://localhost:8000/docs`).

## API Endpoints

TBD

## Generating Clients

While Chroma ecosystem has client implementations for many languages, it may be the case you want to roll out your own.
Below we explain some of the options available to you:

### Using OpenAPI Generator

The fastest way to build a client is to use the OpenAPI Generator the API spec.

### Manually Creating a Client

If you more control over things, you can create your own client by using the API spec as guideline.

For your convenience we provide some data structures in various languages to help you get started. The important
structures are:

- Client
- Collection
- Embedding
- Document
- ID
- Metadata
- QueryRequest/QueryResponse
- Include
- Where Filter
- WhereDocument Filter

##### Python

##### Typescript

##### Golang

##### Java

##### Rust

##### Elixir

