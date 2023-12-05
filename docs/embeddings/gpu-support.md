# Embedding Functions GPU Support

By default Chroma does not require GPU support for embedding functions. However, if you want to use GPU support, some of the functions, especially those running locally provide GPU support.

## Sentence Transformers

```python
import time
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
# This will download the model to your local machine and set it up for GPU support
ef = SentenceTransformerEmbeddingFunction(model_name="thenlper/gte-small", device="cuda")

# Test with 10k documents
docs = []
for i in range(10000):
  docs.append(f"this is a document with id {i}123132")

start_time = time.time()
embeddings = ef(docs)
end_time = time.time()
print(f"Elapsed time: {end_time - start_time} seconds")
```

> Note: You can run the above example in google Colab - see the [notebook](../recipes/embeddings/google-colab-hf-sentence-transformers-gpu.ipynb)
