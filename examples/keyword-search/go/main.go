// Chroma keyword search example using where_document and vector search.
//
// Requires a running Chroma server:
// docker run --rm -p 8000:8000 chromadb/chroma:1.5.2
package main

import (
	"context"
	"fmt"
	"log"

	chroma "github.com/amikos-tech/chroma-go/pkg/api/v2"
	"github.com/amikos-tech/chroma-go/pkg/embeddings"
)

func authorMetadata(author string) chroma.DocumentMetadata {
	m := chroma.NewDocumentMetadata()
	m.SetString("author", author)
	return m
}

func main() {
	ctx := context.Background()

	client, err := chroma.NewHTTPClient(
		chroma.WithBaseURL("http://localhost:8000"),
		chroma.WithDefaultDatabaseAndTenant(),
	)
	if err != nil {
		log.Fatal(err)
	}

	collectionName := "keyword_search_demo_go"

	_ = client.DeleteCollection(ctx, collectionName)

	collection, err := client.CreateCollection(ctx, collectionName)
	if err != nil {
		log.Fatal(err)
	}

	err = collection.Add(ctx,
		chroma.WithIDs("1", "2", "3"),
		chroma.WithTexts(
			"He is a technology freak and he loves AI topics",
			"AI technology are advancing at a fast pace",
			"Innovation in LLMs is a hot topic",
		),
		chroma.WithMetadatas(
			authorMetadata("John Doe"),
			authorMetadata("Jane Doe"),
			authorMetadata("John Doe"),
		),
		chroma.WithEmbeddings(
			embeddings.NewEmbeddingFromFloat32([]float32{0.1, 0.8, 0.3}),
			embeddings.NewEmbeddingFromFloat32([]float32{0.2, 0.9, 0.2}),
			embeddings.NewEmbeddingFromFloat32([]float32{0.9, 0.1, 0.1}),
		),
	)
	if err != nil {
		log.Fatal(err)
	}

	containsResults, err := collection.Query(ctx,
		chroma.WithQueryEmbeddings(
			embeddings.NewEmbeddingFromFloat32([]float32{0.15, 0.85, 0.25}),
		),
		chroma.WithNResults(3),
		chroma.WithWhereDocument(chroma.OrDocument(
			chroma.Contains("technology"),
			chroma.Contains("freak"),
		)),
		chroma.WithInclude(
			chroma.IncludeDocuments,
			chroma.IncludeMetadatas,
			chroma.IncludeDistances,
		),
	)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("contains/or ids: %v\n", containsResults.GetIDGroups())
	fmt.Printf("contains/or documents: %v\n", containsResults.GetDocumentsGroups())
	fmt.Printf("contains/or metadatas: %v\n", containsResults.GetMetadatasGroups())

	regexResults, err := collection.Query(ctx,
		chroma.WithQueryEmbeddings(
			embeddings.NewEmbeddingFromFloat32([]float32{0.15, 0.85, 0.25}),
		),
		chroma.WithNResults(3),
		chroma.WithWhereDocument(chroma.Regex("technology.*pace")),
		chroma.WithInclude(
			chroma.IncludeDocuments,
			chroma.IncludeMetadatas,
			chroma.IncludeDistances,
		),
	)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("regex ids: %v\n", regexResults.GetIDGroups())
	fmt.Printf("regex documents: %v\n", regexResults.GetDocumentsGroups())
	fmt.Printf("regex metadatas: %v\n", regexResults.GetMetadatasGroups())

	notRegexResults, err := collection.Query(ctx,
		chroma.WithQueryEmbeddings(
			embeddings.NewEmbeddingFromFloat32([]float32{0.15, 0.85, 0.25}),
		),
		chroma.WithNResults(3),
		chroma.WithWhereDocument(chroma.NotRegex("Innovation.*topic")),
		chroma.WithInclude(
			chroma.IncludeDocuments,
			chroma.IncludeMetadatas,
			chroma.IncludeDistances,
		),
	)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("not_regex ids: %v\n", notRegexResults.GetIDGroups())
	fmt.Printf("not_regex documents: %v\n", notRegexResults.GetDocumentsGroups())
	fmt.Printf("not_regex metadatas: %v\n", notRegexResults.GetMetadatasGroups())

	if err := client.DeleteCollection(ctx, collectionName); err != nil {
		log.Fatal(err)
	}
	fmt.Println("\ngo: keyword search example passed")
}
