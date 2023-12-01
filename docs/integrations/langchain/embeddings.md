# Langchain Embeddings

## Embedding Functions

Chroma and Langchain both offer embedding functions which are wrappers on top of popular embedding models.

Unfortunately Chroma and LC's embedding functions are not compatible with each other. Below we offer two adapters to convert Chroma's embedding functions to LC's and vice versa.


Here is the adapter to convert Chroma's embedding functions to LC's:

```python
from langchain_core.embeddings import Embeddings
from chromadb.api.types import EmbeddingFunction

class ChromaEmbeddingsAdapter(Embeddings):
  def __init__(self,ef:EmbeddingFunction):
    self.ef = ef

  def embed_documents(self,texts):
    return self.ef(texts)
  
  def embed_query(self, query):
    return self.ef([query])[0]

```

Here is the adapter to convert LC's embedding functions to Chroma's:

```python
from langchain_core.embeddings import Embeddings
from chromadb.api.types import EmbeddingFunction

class LangChainEmbeddingAdapter(EmbeddingFunction):
  def __init__(self,ef:Embeddings):
    self.ef = ef

  def __call__(self, input: Documents) -> Embeddings:
    # LC EFs also have embed_query but Chroma doesn't support that so we just use embed_documents
    # TODO: better type checking
    return self.ef.embed_documents(input)

```
