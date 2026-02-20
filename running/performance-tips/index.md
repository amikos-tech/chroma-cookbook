# Performance Tips

This section covers tips and tricks of how to improve your Chroma performance.

## Rebuild HNSW for your architecutre

Single node chroma [core package](https://pypi.org/project/chromadb/) and [server](https://hub.docker.com/r/chromadb/chroma) ship with a default HNSW build which is optimized for maximum compatibility. The default HNSW does not make use of available optimization for your CPU architecture such as SIMD/AVX.

You can rebuild the HNSW index for the core package or the server as follows.

To rebuild the HNSW index locally you may need to install build tooling such as `gcc` depending on your operating system.

```bash
pip install --no-binary :all: chroma-hnswlib
```

In the following snippet, we clone the Chroma repository (you'll need git and docker installed), and then build a new docker image with the HNSW rebuild flag set to `true`.

```bash
git clone https://github.com/chroma-core/chroma.git && cd chroma
docker build --build-arg REBUILD_HNSWLIB=true -t my-chroma-image:latest .
```

Need help?

If you need help with the above steps, please reach out to us on [Discord](https://discord.gg/MMeYNTmh3x) (look for `@taz`)

## Reducing (shortening) the dimensionality of your embeddings

Some embeddings models (or APIs) offer the ability to reduce the dimensionality of the resulting embeddings. This is a great way to reduce the storage and memory requirements of your Chroma.

Currently the following embedding functions support this feature:

- OpenAI with 3rd generation models (i.e. `text-embedding-3-small` and `text-embedding-3-large`)

### OpenAI Example

For more information on shortening embeddings see the official [OpenAI Blog post](https://openai.com/index/new-embedding-models-and-api-updates/).

```python
from chromadb.utils.embedding_functions.openai_embedding_function import (
    OpenAIEmbeddingFunction,
)
import os

ef = OpenAIEmbeddingFunction(api_key=os.environ["OPENAI_API_KEY"], model_name="text-embedding-3-small", dimensions=64)
embeddings = ef(["hello world"])
```

```javascript
import  {OpenAIEmbeddingFunction} from "chromadb"

const embedder = new OpenAIEmbeddingFunction({
        openai_api_key: process.env.OPENAI_API_KEY,
        openai_embedding_dimensions: 64,
        openai_model: "text-embedding-3-small",
    });
const embeddings = embedder.generate(["hello world"]);
```

## Defragment your HNSW indices

If you have many updates (other than `add`) on your collections, overtime the HNSW indices become fragmented which has the following consequences:

- Increased memory usage
- Increased disk usage
- Increased query times
- Reduced accuracy

To mitigate the above side-effects, you can periodically defragment/compact your HNSW indices. To do that use the `chops hnsw rebuild` [command](https://cookbook.chromadb.dev/running/maintenance/#hnsw-rebuild).
