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

First you create a class that inherits from `EmbeddingFunction[Documents]`. The `Documents` type is a list of `Document` objects. Each `Document` object has a `text` attribute that contains the text of the document. Chroma also supports multi-modal