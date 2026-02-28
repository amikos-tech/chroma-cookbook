# LangChain Embeddings

This page shows the current Chroma (`1.5.2`) and LangChain embedding integration patterns.

## Use LangChain Embeddings With Chroma Collections

In Chroma `1.5.2`, wrap a LangChain `Embeddings` implementation with `ChromaLangchainEmbeddingFunction`.

Query workaround in 1.5.2

If `collection.query(query_texts=[...])` raises an error with wrapped LangChain embeddings, use `query_embeddings=[lc_embeddings.embed_query("...")]` instead.

```python
# pip install chromadb==1.5.2 langchain-core langchain-huggingface sentence-transformers
import chromadb
from chromadb.utils.embedding_functions import ChromaLangchainEmbeddingFunction
from langchain_huggingface import HuggingFaceEmbeddings

lc_embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)
chroma_ef = ChromaLangchainEmbeddingFunction(embedding_function=lc_embeddings)

client = chromadb.PersistentClient(path="./chroma-langchain-data")
collection = client.get_or_create_collection(
    name="my_collection",
    embedding_function=chroma_ef,
)
collection.add(ids=["1"], documents=["test document goes here"])
```

```python
# pip install chromadb==1.5.2 langchain-core langchain-openai
import chromadb
from chromadb.utils.embedding_functions import ChromaLangchainEmbeddingFunction
from langchain_openai import OpenAIEmbeddings

lc_embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
chroma_ef = ChromaLangchainEmbeddingFunction(embedding_function=lc_embeddings)

client = chromadb.PersistentClient(path="./chroma-langchain-data")
collection = client.get_or_create_collection(
    name="my_collection",
    embedding_function=chroma_ef,
)
collection.add(ids=["1"], documents=["test document goes here"])
```

## Use Chroma As A LangChain Vector Store

For LangChain vector stores, use the `langchain-chroma` package:

```python
# pip install chromadb==1.5.2 langchain-core langchain-chroma langchain-openai
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

vector_store = Chroma(
    collection_name="docs_store",
    persist_directory="./chroma-langchain-store",
    embedding_function=embeddings,
)

vector_store.add_texts(
    texts=["foo", "bar", "baz"],
    metadatas=[{"topic": "a"}, {"topic": "b"}, {"topic": "c"}],
    ids=["1", "2", "3"],
)

results = vector_store.similarity_search("foo", k=2, filter={"topic": "a"})
```

## Optional: Manual Adapter (Chroma -> LangChain)

If you already have a Chroma embedding function and want to use it in LangChain, you can adapt it to LangChain's `Embeddings` interface:

```python
from chromadb.api.types import EmbeddingFunction
from langchain_core.embeddings import Embeddings


class ChromaEmbeddingsAdapter(Embeddings):
    def __init__(self, ef: EmbeddingFunction) -> None:
        self.ef = ef

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self.ef(texts)

    def embed_query(self, query: str) -> list[float]:
        return self.ef([query])[0]
```

## Full Working Example

See [examples/langchain/python/embeddings_example.py](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/langchain/python/embeddings_example.py) for a complete runnable script and dependency list. The example uses `DeterministicFakeEmbedding` so it runs without API keys.
