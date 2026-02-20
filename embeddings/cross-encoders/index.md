# Cross-Encoders Reranking

Work in Progress

This page is a work in progress and may not be complete.

For now this is just a tiny snippet how to use a cross-encoder to rerank results returned from Chroma. Soon we will provide a more detailed guide to the usefulness of cross-encoders/rerankers.

## Hugging Face Cross Encoders

```python
from sentence_transformers import CrossEncoder
import numpy as np
import chromadb
client = chromadb.Client()
collection = client.get_or_create_collection("my_collection")
# add some documents 
collection.add(ids=["doc1", "doc2", "doc3"], documents=["Hello, world!", "Hello, Chroma!", "Hello, Universe!"])
# query the collection
query = "Hello, world!"
results = collection.query(query_texts=[query], n_results=3)



model = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2', max_length=512)
# rerank the results with original query and documents returned from Chroma
scores = model.predict([(query, doc) for doc in results["documents"][0]])
# get the highest scoring document
print(results["documents"][0][np.argmax(scores)])
```
