# Chroma Integrations With LangChain

Last updated: **February 25, 2026**

## What's New In This Refresh

- Updated embeddings guidance for Chroma `1.5.2`.
- Replaced legacy vector store imports with `from langchain_chroma import Chroma`.
- Replaced deprecated adapter usage with `ChromaLangchainEmbeddingFunction`.
- Added a full runnable example: [examples/langchain/python/embeddings_example.py](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/langchain/python/embeddings_example.py)
- Added example dependencies: [examples/langchain/requirements.txt](https://github.com/amikos-tech/chroma-cookbook/blob/main/examples/langchain/requirements.txt)
- Documented a Chroma `1.5.2` query workaround for wrapped LangChain embeddings.

## Guides

- [Embeddings](https://cookbook.chromadb.dev/integrations/langchain/embeddings/index.md) - use LangChain embedding models with Chroma collections and `langchain_chroma`.
- [Retrievers](https://cookbook.chromadb.dev/integrations/langchain/retrievers/index.md) - use LangChain retrievers with Chroma.
