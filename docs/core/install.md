# Installation

Chroma single node is split into two packages: `chromadb` and `chromadb-client`. The `chromadb` package is the core
package that provides the database functionality, while the `chromadb-client` package provides the Python client for
interacting with the database.

In addition to the python packages Chroma also provides a JS/TS client package.

## Core (Python) - Single Node

The core Chroma package installs the full Chroma version which can be uses for local development and testing.

??? note "Backward compatibility"

    While Chroma strives to be as compatible with older versions as possible, certain releases introduce breaking changes
    and most importantly database migrations. All database migrations are irreversible and once upgraded to a new version
    of Chroma, you cannot downgrade to an older version.

??? tip "Releases"

    You can find Chroma releases in PyPI [here](https://pypi.org/project/chromadb-client/#history).

=== "Latest Release"

    ```bash
    pip install chromadb
    ```

=== "Latest main branch"

    Directly from  Github:

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
    
    Directly from  Github (replace `x.y.z` with the [tag](https://github.com/chroma-core/chroma/tags) of the version you want to install):

    ```bash
    pip install git+https://github.com/chroma-core/chroma.git@x.y.z
    ```

=== "From PR Branch"

    It is sometimes useful to install a version of Chroma that has still some unrelease functionality. Like a PR that either fixes a bug or brings
    in a new functionality you may need. To test such unreleased code it is possible to install directly from GH PR branch.

    ```bash
    pip install git+https://github.com/chroma-core/chroma.git@<branch_name>
    ```


## ChromaDB Python Client

Chroma python client package `chromadb-client` provides a thin client for interacting with the Chroma database. The
client interface is fully compatible with the core Chroma package so it can be interchangeably used with the core
package.

??? tip "Releases"

    You can find Chroma releases in PyPI [here](https://pypi.org/project/chromadb-client/#history).

=== "Latest Release"

    ```bash
    pip install chromadb-client
    ```

=== "Latest main branch"

    From test PyPI:

    ```bash
    pip install --index-url https://test.pypi.org/simple/ chromadb-client
    ```

=== "Specific Version"

    Installing a specific version of Chroma is useful when you want to ensure that your code works with a specific 
    version of Chroma. To install a specific version of Chroma, run:
    
    ```bash
    pip install chromadb==<x.y.z>
    ```

??? tip "Default Embedding Function"

    The thin client is light-weight in terms of dependencies and as such the Default Embedding Function is not supported.
    It is possible to install `onnxruntime` dependency and use the `chromadb.utils.embedding_functions.ONNXMiniLM_L6_V2` 
    EF in place of `chromadb.utils.embedding_functions.DefaultEmbeddingFunction`. It is not recommended to run inference
    (local EFs like the default EF) in resource constrained environments.
    
## Chroma JS/TS Client

To install the Chroma JS/TS client package, use the following command depending on your package manager.

=== "Yarn"

    ```bash
    yarn install chromadb chromadb-default-embed
    ```

=== "NPM"

    ```bash
    npm install --save chromadb chromadb-default-embed
    ```

=== "PNPM"

    ```bash
    pnpm install chromadb chromadb-default-embed
    ```

=== "GitHub"

    To install from GitHub, visit https://github.com/chroma-core/chroma/pkgs/npm/chromadb.

    ??? warn "NPM Auth"

        GitHub requires npm authentication to fetch packages. To authenticate with the GitHub NPM registry, you need to create a `.npmrc` file in your project directory with
        the following content:

        ```bash
        //npm.pkg.github.com/:_authToken=TOKEN
        @chroma-core:registry=https://npm.pkg.github.com
        ```

        Replace `TOKEN` with your GitHub token. More info can be found [here](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-with-a-personal-access-token).

    ```bash
    npm install --save @chroma-core/chromadb
    ```
