# Ollama

First let's run a local docker container with Ollama. We'll pull `nomic-embed-text` model:

```bash
docker run -d -v ./ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
docker exec -it ollama ollama run nomic-embed-text # press Ctrl+D to exit after model downloads successfully
# test it
curl http://localhost:11434/api/embeddings -d '{"model": "nomic-embed-text","prompt": "Here is an article about llamas..."}'
```

!!! note "Ollama Docs"

    For more information on Ollama, visit the [Ollama GitHub repository](https://github.com/ollama/ollama).

Now let's configure our OllamaEmbeddingFunction Embedding (python) function with the default Ollama endpoint:

```python
import chromadb
from chromadb.utils.embedding_functions import OllamaEmbeddingFunction

client = chromadb.PersistentClient(path="ollama")

# create EF with custom endpoint
ef = OllamaEmbeddingFunction(
    model_name="nomic-embed-text",
    url="http://localhost:11434/api/embeddings",
)

print(ef(["Here is an article about llamas..."]))
```

For JS users, you can use the `OllamaEmbeddingFunction` class to create embeddings:

```javascript
const {OllamaEmbeddingFunction} = require('chromadb');
const embedder = new OllamaEmbeddingFunction({
    url: "http://localhost:11434/api/embeddings",
    model: "nomic-embed-text"
})

// use directly
const embeddings = embedder.generate(["Here is an article about llamas..."])
```

For Golang you can use the `chroma-go` client's `OllamaEmbeddingFunction` embedding function to generate embeddings for
your documents:

```go
package main

import (
	"context"
    "fmt"
	ollama "github.com/amikos-tech/chroma-go/ollama"
)

func main() {
	documents := []string{
		"Document 1 content here",
		"Document 2 content here",
	}
	// the `/api/embeddings` endpoint is automatically appended to the base URL
	ef, err := ollama.NewOllamaEmbeddingFunction(ollama.WithBaseURL("http://127.0.0.1:11434"), ollama.WithModel("nomic-embed-text"))
	if err != nil {
        fmt.Printf("Error creating Ollama embedding function: %s \n", err)
    }
	resp, err := ef.EmbedDocuments(context.Background(), documents)
	if err != nil {
        fmt.Printf("Error embedding documents: %s \n", err)
    }
	fmt.Printf("Embedding response: %v \n", resp)
}
```

!!! note "Golang Client"

    You can install the Golang client by running the following command:

    ```bash
    go get github.com/amikos-tech/chroma-go
    ```
    
    For more information visit [https://go-client.chromadb.dev/](https://go-client.chromadb.dev/)