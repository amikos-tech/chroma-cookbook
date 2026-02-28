# LangChain + Chroma Embeddings Example

This example matches:

- `chromadb==1.5.2`
- current `langchain_chroma` APIs (`from langchain_chroma import Chroma`)

## Run

```bash
pip install -r examples/langchain/requirements.txt
python examples/langchain/python/embeddings_example.py
```

The script shows:

1. LangChain embeddings wrapped for native Chroma collections with `ChromaLangchainEmbeddingFunction`.
2. Chroma used as a LangChain vector store with `langchain_chroma.Chroma`.
