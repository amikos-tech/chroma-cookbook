# Langchain Embeddings

## Embedding Functions

Chroma and Langchain both offer embedding functions which are wrappers on top of popular embedding models.

Unfortunately Chroma and LC's embedding functions are not compatible with each other. Below we offer two adapters to
convert Chroma's embedding functions to LC's and vice versa.

**Links**:
- [Chroma Embedding Functions Definition](https://github.com/chroma-core/chroma/blob/ddb7ab13bee394cf942bc8a976629884cd0f4294/chromadb/api/types.py#L185-L201)
- [Langchain Embedding Functions Definition](https://github.com/langchain-ai/langchain/blob/master/libs/core/langchain_core/embeddings/embeddings.py)


Here is the adapter to convert Chroma's embedding functions to LC's:

```python
from langchain_core.embeddings import Embeddings
from chromadb.api.types import EmbeddingFunction


class ChromaEmbeddingsAdapter(Embeddings):
    def __init__(self, ef: EmbeddingFunction):
        self.ef = ef

    def embed_documents(self, texts):
        return self.ef(texts)

    def embed_query(self, query):
        return self.ef([query])[0]

```

Here is the adapter to
convert [LC's embedding function](https://github.com/langchain-ai/langchain/blob/master/libs/core/langchain_core/embeddings/embeddings.py)
s to Chroma's:

```python
from langchain_core.embeddings import Embeddings
from chromadb.api.types import EmbeddingFunction, Documents


class LangChainEmbeddingAdapter(EmbeddingFunction[Documents]):
    def __init__(self, ef: Embeddings):
        self.ef = ef

    def __call__(self, input: Documents) -> Embeddings:
        # LC EFs also have embed_query but Chroma doesn't support that so we just use embed_documents
        # TODO: better type checking
        return self.ef.embed_documents(input)

```

### Example Usage

Using Chroma Embedding Functions with Langchain:

```python
from langchain.vectorstores.chroma import Chroma
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

texts = ["foo", "bar", "baz"]

docs_vectorstore = Chroma.from_texts(
    texts=texts,
    collection_name="docs_store",
    embedding=ChromaEmbeddingsAdapter(SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")),
)
```

Using Langchain Embedding Functions with Chroma:

```python
from langchain_community.embeddings import SentenceTransformerEmbeddings
import chromadb

client = chromadb.Client()

collection = client.get_or_create_collection("test", embedding_function=LangChainEmbeddingAdapter(
    SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")))
collection.add(ids=["1", "2", "3"], documents=["foo", "bar", "baz"])
```
