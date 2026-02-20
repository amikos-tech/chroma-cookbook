# Embedding Functions GPU Support

By default, Chroma does not require GPU support for embedding functions. However, if you want to use GPU support, some of the functions, especially those running locally provide GPU support.

## Default Embedding Functions (Onnxruntime)

To use the default embedding functions with GPU support, you need to install `onnxruntime-gpu` package. You can install it with the following command:

```bash
pip install onnxruntime-gpu
```

> Note: To ensure no conflicts, you can uninstall `onnxruntime` (e.g. `pip uninstall onnxruntime`) in a separate environment.

List available providers:

```python
import onnxruntime

print(onnxruntime.get_available_providers())
```

Select the desired provider and set it as preferred before using the embedding functions (in the below example, we use `CUDAExecutionProvider`):

```python
import time
from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2

ef = ONNXMiniLM_L6_V2(preferred_providers=['CUDAExecutionProvider'])

docs = []
for i in range(1000):
    docs.append(f"this is a document with id {i}")

start_time = time.perf_counter()
embeddings = ef(docs)
end_time = time.perf_counter()
print(f"Elapsed time: {end_time - start_time} seconds")
```

> **IMPORTANT OBSERVATION**: Our observations are that for GPU support using sentence transformers with model `all-MiniLM-L6-v2` outperforms onnxruntime with GPU support. In practical terms on a Colab T4 GPU, the onnxruntime example above runs for about 100s whereas the equivalent sentence transformers example runs for about 1.8s.

## Sentence Transformers

```python
import time
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
# This will download the model to your machine and set it up for GPU support
ef = SentenceTransformerEmbeddingFunction(model_name="thenlper/gte-small", device="cuda")

# Test with 10k documents
docs = []
for i in range(10000):
    docs.append(f"this is a document with id {i}")

start_time = time.perf_counter()
embeddings = ef(docs)
end_time = time.perf_counter()
print(f"Elapsed time: {end_time - start_time} seconds")
```

> Note: You can run the above example in google Colab - see the [notebook](https://cookbook.chromadb.dev/recipes/embeddings/google-colab-hf-sentence-transformers-gpu.ipynb)

## OpenCLIP

Prior to [PR #1806](https://github.com/chroma-core/chroma/pull/1806), we simply used the `torch` package to load the model and run it on the GPU.

```python
import chromadb
from chromadb.utils.embedding_functions import OpenCLIPEmbeddingFunction
from chromadb.utils.data_loaders import ImageLoader
import toch
import os

IMAGE_FOLDER = "images"
toch.device("cuda")

embedding_function = OpenCLIPEmbeddingFunction()
image_loader = ImageLoader()

client = chromadb.PersistentClient(path="my_local_data")
collection = client.create_collection(
    name='multimodal_collection',
    embedding_function=embedding_function,
    data_loader=image_loader)

image_uris = sorted([os.path.join(IMAGE_FOLDER, image_name) for image_name in os.listdir(IMAGE_FOLDER)])
ids = [str(i) for i in range(len(image_uris))]
collection.add(ids=ids, uris=image_uris)
```

After [PR #1806](https://github.com/chroma-core/chroma/pull/1806):

```python
from chromadb.utils.embedding_functions import OpenCLIPEmbeddingFunction
embedding_function = OpenCLIPEmbeddingFunction(device="cuda")
```
