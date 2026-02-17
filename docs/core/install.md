# Installation

Chroma provides packages for Python, JavaScript/TypeScript, Go, and Rust.

## Quick Start

Get a Chroma server running quickly with the CLI or Docker:

=== "CLI"

    ```bash
    pip install chromadb
    chroma run --path ./getting-started
    ```

=== "Docker"

    ```bash
    docker pull chromadb/chroma && docker run -p 8000:8000 chromadb/chroma
    ```

## Python

The `chromadb` package includes everything needed for both local (embedded) usage and connecting to a remote Chroma server.
Here's a [minimal working example](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/install/python/verify.py) to confirm your installation.

??? note "Backward compatibility"

    While Chroma strives to be as compatible with older versions as possible, certain releases introduce breaking changes
    and most importantly database migrations. All database migrations are irreversible and once upgraded to a new version
    of Chroma, you cannot downgrade to an older version.

??? tip "Releases"

    You can find Chroma releases on PyPI [here](https://pypi.org/project/chromadb/#history).

=== "Latest Release"

    ```bash
    pip install chromadb
    ```

=== "Latest main branch"

    Directly from GitHub:

    ```bash
    pip install git+https://github.com/chroma-core/chroma.git@main
    ```

    From test PyPI:

    ```bash
    pip install --index-url https://test.pypi.org/simple/ chromadb
    ```

=== "Specific Version"

    Installing a specific version of Chroma is useful when you want to ensure that your code works with a specific
    version of Chroma. To install a specific version of Chroma, run:

    From PyPI:

    ```bash
    pip install chromadb==<x.y.z>
    ```

    Directly from GitHub (replace `x.y.z` with the [tag](https://github.com/chroma-core/chroma/tags) of the version you want to install):

    ```bash
    pip install git+https://github.com/chroma-core/chroma.git@x.y.z
    ```

=== "From PR Branch"

    It is sometimes useful to install a version of Chroma that has still some unreleased functionality. Like a PR that either fixes a bug or brings
    in a new functionality you may need. To test such unreleased code it is possible to install directly from a GH PR branch.

    ```bash
    pip install git+https://github.com/chroma-core/chroma.git@<branch_name>
    ```

## JavaScript/TypeScript

To install the Chroma JS/TS client package, use the following command depending on your package manager.
Here's a [minimal working example](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/install/js/verify.mjs) to confirm your installation.

=== "Yarn"

    ```bash
    yarn add chromadb @chroma-core/default-embed
    ```

=== "NPM"

    ```bash
    npm install --save chromadb @chroma-core/default-embed
    ```

=== "PNPM"

    ```bash
    pnpm add chromadb @chroma-core/default-embed
    ```

??? tip "Embedding Function Packages"

    All embedding function packages for JS/TS use the `@chroma-core/*` namespace. For example:

    - `@chroma-core/default-embed` - Default embedding function
    - `@chroma-core/openai` - OpenAI embeddings
    - `@chroma-core/cohere` - Cohere embeddings

## Go

```bash
go get github.com/amikos-tech/chroma-go
```

Here's a [minimal working example](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/install/go/main.go) to confirm your installation.

## Rust

```bash
cargo add chroma
```

Here's a [minimal working example](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/install/rust/src/main.rs) to confirm your installation.
