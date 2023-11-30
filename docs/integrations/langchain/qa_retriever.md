# 🦜⛓️ Langchain QA Retriever

TBD: describe what retrievers are in LC and how they work.

## Q&A Retriever with Filters

In the below example we use the Q&A retriever to query a Chroma collection ad we also set a filter which 

```py
from langchain.chains import RetrievalQA
from langchain.llms import OpenAI
from langchain.vectorstores import Chroma
from typing import Dict, Any

def query(query:str, persist_dir:str,embeddings,collection_name:str=None, filter:Dict[str,Any]=None):
        db = Chroma(persist_directory=persist_dir, embedding_function=embeddings, collection_name=collection_name)
        llm = OpenAI(temperature=0)
        qa = RetrievalQA.from_chain_type(
                llm=llm,
                chain_type="stuff",
                retriever=db.as_retriever(search_kwargs=filter),)
        return qa.run(query)
```
