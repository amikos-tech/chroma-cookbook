# LlamaIndex Embeddings

## Embedding Functions

Chroma and LlamaIndex both offer embedding functions which are wrappers on top of popular embedding models.

Unfortunately Chroma and LI's embedding functions are not compatible with each other. Below we offer an adapters to convert LI embedding function to Chroma one.

```python
from llama_index.embeddings.base import BaseEmbedding
from chromadb.api.types import EmbeddingFunction

class LlamaIndexEmbeddingAdapter(EmbeddingFunction):
  def __init__(self,ef:BaseEmbedding):
    self.ef = ef

  def __call__(self, input: Documents) -> Embeddings:
    return [node.embedding for node in self.ef(input)]

```

An example of how to use the above with LlamaIndex:

> Note: Make sure you have `OPENAI_API_KEY` as env var.

```python
from llama_index.embeddings import OpenAIEmbedding
from llama_index import ServiceContext, set_global_service_context
import chromadb

embed_model = OpenAIEmbedding(embed_batch_size=10)

client = chromadb.Client()

col = client.get_or_create_collection("test_collection",embedding_function=LlamaIndexEmbeddingAdapter(embed_model))

col.add(ids=["1"],documents=["this is a test document"])
# your embeddings should be of 1536 dimensions (OpenAI's ADA model)
```