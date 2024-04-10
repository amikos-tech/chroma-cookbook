# LlamaIndex Embeddings

## Embedding Functions

Chroma and LlamaIndex both offer embedding functions which are wrappers on top of popular embedding models.

Unfortunately Chroma and LI's embedding functions are not compatible with each other. Below we offer an adapters to
convert LI embedding function to Chroma one.

```python
from llama_index.core.schema import TextNode
from llama_index.core.base.embeddings.base import BaseEmbedding
from chromadb import EmbeddingFunction, Documents, Embeddings


class LlamaIndexEmbeddingAdapter(EmbeddingFunction):
    def __init__(self, ef: BaseEmbedding):
        self.ef = ef

    def __call__(self, input: Documents) -> Embeddings:
        return [node.embedding for node in self.ef([TextNode(text=doc) for doc in input])]

```

!!! warn "Text modality"

    The above adapter assumes that the input documents are text. If you are using a different modality, 
    you will need to modify the adapter accordingly.

An example of how to use the above with LlamaIndex:

!!! note "Prerequisites for example"

    Run `pip install llama-index chromadb llama-index-embeddings-fastembed fastembed`

```python
import chromadb
from llama_index.embeddings.fastembed import FastEmbedEmbedding

# make sure to include the above adapter and imports
embed_model = FastEmbedEmbedding(model_name="BAAI/bge-small-en-v1.5")

client = chromadb.Client()

col = client.get_or_create_collection("test_collection", embedding_function=LlamaIndexEmbeddingAdapter(embed_model))

col.add(ids=["1"], documents=["this is a test document"])
```
