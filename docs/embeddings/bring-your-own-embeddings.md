# Creating your own embedding function

```python
from chromadb.api.types import (
    Documents,
    EmbeddingFunction,
    Embeddings
)


class MyCustomEmbeddingFunction(EmbeddingFunction[Documents]):
    def __init__(
            self,
            my_ef_param: str
    ):
        """Initialize the embedding function."""

    def __call__(self, input: Documents) -> Embeddings:
        """Embed the input documents."""
        return self._my_ef(input)
```

Now let's break the above down.

First you create a class that inherits from `EmbeddingFunction[Documents]`. The `Documents` type is a list of `Document`
objects. Each `Document` object has a `text` attribute that contains the text of the document. Chroma also supports
multi-modal

## Example Implementation

Below is an implementation of an embedding function that works with `transformers` models.

!!! note "Note"

    This example requires the `transformers` and `torch` python packages. You can install them
    with `pip install transformers torch`.

By default, all `transformers` models on HF are supported are also supported by the `sentence-transformers` package. For
which Chroma provides [out of the box support](https://docs.trychroma.com/embeddings#sentence-transformers).

```python
import importlib
from typing import Optional, cast

import numpy as np
import numpy.typing as npt
from chromadb.api.types import EmbeddingFunction, Documents, Embeddings


class TransformerEmbeddingFunction(EmbeddingFunction[Documents]):
    def __init__(
            self,
            model_name: str = "dbmdz/bert-base-turkish-cased",
            cache_dir: Optional[str] = None,
    ):
        try:
            from transformers import AutoModel, AutoTokenizer

            self._torch = importlib.import_module("torch")
            self._tokenizer = AutoTokenizer.from_pretrained(model_name)
            self._model = AutoModel.from_pretrained(model_name, cache_dir=cache_dir)
        except ImportError:
            raise ValueError(
                "The transformers and/or pytorch python package is not installed. Please install it with "
                "`pip install transformers` or `pip install torch`"
            )

    @staticmethod
    def _normalize(vector: npt.NDArray) -> npt.NDArray:
        """Normalizes a vector to unit length using L2 norm."""
        norm = np.linalg.norm(vector)
        if norm == 0:
            return vector
        return vector / norm

    def __call__(self, input: Documents) -> Embeddings:
        inputs = self._tokenizer(
            input, padding=True, truncation=True, return_tensors="pt"
        )
        with self._torch.no_grad():
            outputs = self._model(**inputs)
        embeddings = outputs.last_hidden_state.mean(dim=1)  # mean pooling
        return [e.tolist() for e in self._normalize(embeddings)]
```
