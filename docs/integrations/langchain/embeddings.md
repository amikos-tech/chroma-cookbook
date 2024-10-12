# Langchain Embeddings

## Embedding Functions

Chroma and Langchain both offer embedding functions which are wrappers on top of popular embedding models.

Unfortunately Chroma and LC's embedding functions are not compatible with each other. Below we offer two adapters to
convert Chroma's embedding functions to LC's and vice versa.

**Links**:

- [Chroma Embedding Functions Definition](https://github.com/chroma-core/chroma/blob/ddb7ab13bee394cf942bc8a976629884cd0f4294/chromadb/api/types.py#L185-L201)
- [Langchain Embedding Functions Definition](https://github.com/langchain-ai/langchain/blob/master/libs/core/langchain_core/embeddings/embeddings.py)

### Chroma Built-in Langchain Adapter

As of version `0.5.x` Chroma offers a built-in two-way adapter to convert Langchain's embedding function to an adapted
embeddings that can be used by both LC and Chroma. Implementation can be
found [here](https://github.com/chroma-core/chroma/blob/main/chromadb/utils/embedding_functions/chroma_langchain_embedding_function.py).

=== "HuggingFace"

    Find out more about Langchain's HuggingFace embeddings [here](https://python.langchain.com/docs/integrations/platforms/huggingface/#embedding-models).

    ```python
    # pip install chromadb langchain langchain-huggingface langchain-chroma
    import chromadb
    from chromadb.utils.embedding_functions import create_langchain_embedding
    from langchain_huggingface import HuggingFaceEmbeddings

    langchain_embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    ef = create_langchain_embedding(langchain_embeddings)
    client = chromadb.PersistentClient(path="./chroma-data")
    collection = client.get_or_create_collection(name="my_collection", embedding_function=ef)
    
    collection.add(ids=["1"],documents=["test document goes here"])
    ```

=== "OpenAI"

    Find out more about Langchain's OpenAI embeddings [here](https://python.langchain.com/docs/integrations/text_embedding/openai/).

    ```python
    import chromadb
    from chromadb.utils.embedding_functions import create_langchain_embedding
    from langchain_openai import OpenAIEmbeddings
    from google.colab import userdata

    langchain_embeddings = OpenAIEmbeddings(
        model="text-embedding-3-large",
        api_key=os.environ["OPENAI_API_KEY"],
    )
    ef = create_langchain_embedding(langchain_embeddings)
    client = chromadb.PersistentClient(path="/chroma-data")
    collection = client.get_or_create_collection(name="my_collection", embedding_function=ef)

    collection.add(ids=["1"],documents=["test document goes here"])
    ```

### Custom Adapter

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
# pip install chromadb langchain langchain-huggingface langchain-chroma
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
# pip install chromadb langchain langchain-huggingface langchain-chroma
from langchain_huggingface import HuggingFaceEmbeddings
import chromadb

client = chromadb.Client()

collection = client.get_or_create_collection("test", embedding_function=LangChainEmbeddingAdapter(
    HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")))
collection.add(ids=["1", "2", "3"], documents=["foo", "bar", "baz"])
```
