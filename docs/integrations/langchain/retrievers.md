# 🦜⛓️ Langchain Retriever

TBD: describe what retrievers are in LC and how they work.

## Vector Store Retriever

In the below example we demonstrate how to use Chroma as a vector store retriever with a filter query.

Note that the filter is supplied whenever we create the retriever object so the filter applies to all queries (`get_relevant_documents`).

```py
from langchain.document_loaders import OnlinePDFLoader
from langchain.chains import RetrievalQA
from langchain.llms import OpenAI
from langchain.vectorstores import Chroma
from typing import Dict, Any
import chromadb
from langchain_core.embeddings import Embeddings

client = chromadb.PersistentClient(path="./chroma")

col = client.get_or_create_collection("test")

col.upsert([f"{i}" for i in range(10)],documents=[f"This is document #{i}" for i in range(10)],metadatas=[{"id":f"{i}"} for i in range(10)])

ef = chromadb.utils.embedding_functions.DefaultEmbeddingFunction()

class DefChromaEF(Embeddings):
  def __init__(self,ef):
    self.ef = ef

  def embed_documents(self,texts):
    return self.ef(texts)
  
  def embed_query(self, query):
    return self.ef([query])[0]


db = Chroma(client=client, collection_name="test",embedding_function=DefChromaEF(ef))

retriever = db.as_retriever(search_kwargs={"filter":{"id":"1"}})

docs = retriever.get_relevant_documents("document")

assert len(docs)==1
```
