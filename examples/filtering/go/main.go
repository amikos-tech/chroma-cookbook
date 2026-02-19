// Chroma filtering examples - metadata filters, document filters, and pagination.
//
// Requires a running Chroma server: chroma run
package main

import (
	"context"
	"fmt"
	"log"

	chroma "github.com/amikos-tech/chroma-go/pkg/api/v2"
	"github.com/amikos-tech/chroma-go/pkg/embeddings"
)

func meta(kv ...any) chroma.DocumentMetadata {
	m := chroma.NewDocumentMetadata()
	for i := 0; i < len(kv); i += 2 {
		key := kv[i].(string)
		switch v := kv[i+1].(type) {
		case string:
			m.SetString(key, v)
		case int64:
			m.SetInt(key, v)
		case int:
			m.SetInt(key, int64(v))
		case float64:
			m.SetFloat(key, v)
		case bool:
			m.SetBool(key, v)
		}
	}
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

	collectionName := "filter_demo_go"

	// Clean up if exists
	_ = client.DeleteCollection(ctx, collectionName)

	collection, err := client.CreateCollection(ctx, collectionName)
	if err != nil {
		log.Fatal(err)
	}

	// Seed data
	err = collection.Add(ctx,
		chroma.WithIDs("doc-1", "doc-2", "doc-3", "doc-4"),
		chroma.WithTexts(
			"Machine learning is transforming healthcare diagnostics.",
			"Quantum computing may revolutionize cryptography.",
			"Renewable energy adoption is accelerating worldwide.",
			"Deep learning models require large datasets for training.",
		),
		chroma.WithMetadatas(
			meta("category", "ml", "year", 2024, "citations", 150),
			meta("category", "quantum", "year", 2023, "citations", 80),
			meta("category", "energy", "year", 2024, "citations", 45),
			meta("category", "ml", "year", 2022, "citations", 300),
		),
		chroma.WithEmbeddings(
			embeddings.NewEmbeddingFromFloat32([]float32{0.1, 0.2, 0.3}),
			embeddings.NewEmbeddingFromFloat32([]float32{0.4, 0.5, 0.6}),
			embeddings.NewEmbeddingFromFloat32([]float32{0.7, 0.8, 0.9}),
			embeddings.NewEmbeddingFromFloat32([]float32{0.2, 0.3, 0.4}),
		),
	)
	if err != nil {
		log.Fatal(err)
	}

	queryEmb := embeddings.NewEmbeddingFromFloat32([]float32{0.1, 0.2, 0.3})

	mustGet := func(label string, opts ...chroma.CollectionGetOption) chroma.GetResult {
		r, err := collection.Get(ctx, opts...)
		if err != nil {
			log.Fatalf("%s failed: %v", label, err)
		}
		return r
	}

	mustQuery := func(label string, opts ...chroma.CollectionQueryOption) chroma.QueryResult {
		r, err := collection.Query(ctx, opts...)
		if err != nil {
			log.Fatalf("%s failed: %v", label, err)
		}
		return r
	}

	// --- Metadata Filters ---

	// Equality ($eq)
	results := mustGet("$eq",
		chroma.WithWhere(chroma.EqString("category", "ml")),
	)
	fmt.Printf("$eq: %v\n", results.GetIDs())

	// Inequality ($ne)
	results = mustGet("$ne",
		chroma.WithWhere(chroma.NotEqString("category", "ml")),
	)
	fmt.Printf("$ne: %v\n", results.GetIDs())

	// Greater than ($gt)
	results = mustGet("$gt",
		chroma.WithWhere(chroma.GtInt("citations", 100)),
	)
	fmt.Printf("$gt: %v\n", results.GetIDs())

	// Greater than or equal ($gte)
	results = mustGet("$gte",
		chroma.WithWhere(chroma.GteInt("year", 2024)),
	)
	fmt.Printf("$gte: %v\n", results.GetIDs())

	// Less than ($lt)
	results = mustGet("$lt",
		chroma.WithWhere(chroma.LtInt("citations", 100)),
	)
	fmt.Printf("$lt: %v\n", results.GetIDs())

	// Less than or equal ($lte)
	results = mustGet("$lte",
		chroma.WithWhere(chroma.LteInt("year", 2023)),
	)
	fmt.Printf("$lte: %v\n", results.GetIDs())

	// In ($in)
	results = mustGet("$in",
		chroma.WithWhere(chroma.InString("category", "ml", "quantum")),
	)
	fmt.Printf("$in: %v\n", results.GetIDs())

	// Not in ($nin)
	results = mustGet("$nin",
		chroma.WithWhere(chroma.NinString("category", "ml", "quantum")),
	)
	fmt.Printf("$nin: %v\n", results.GetIDs())

	// --- Logical Operators ---

	// $and
	results = mustGet("$and",
		chroma.WithWhere(chroma.And(
			chroma.EqString("category", "ml"),
			chroma.GteInt("year", 2024),
		)),
	)
	fmt.Printf("$and: %v\n", results.GetIDs())

	// $or
	results = mustGet("$or",
		chroma.WithWhere(chroma.Or(
			chroma.EqString("category", "quantum"),
			chroma.EqString("category", "energy"),
		)),
	)
	fmt.Printf("$or: %v\n", results.GetIDs())

	// Nested logical operators
	results = mustGet("nested",
		chroma.WithWhere(chroma.And(
			chroma.GteInt("year", 2023),
			chroma.Or(
				chroma.EqString("category", "ml"),
				chroma.EqString("category", "quantum"),
			),
		)),
	)
	fmt.Printf("nested: %v\n", results.GetIDs())

	// --- Document Filters ---

	// $contains
	qResults := mustQuery("doc $contains",
		chroma.WithQueryEmbeddings(queryEmb),
		chroma.WithNResults(4),
		chroma.WithWhereDocument(chroma.Contains("learning")),
	)
	fmt.Printf("doc $contains: %v\n", qResults.GetIDGroups())

	// $not_contains
	qResults = mustQuery("doc $not_contains",
		chroma.WithQueryEmbeddings(queryEmb),
		chroma.WithNResults(4),
		chroma.WithWhereDocument(chroma.NotContains("learning")),
	)
	fmt.Printf("doc $not_contains: %v\n", qResults.GetIDGroups())

	// $regex
	qResults = mustQuery("doc $regex",
		chroma.WithQueryEmbeddings(queryEmb),
		chroma.WithNResults(4),
		chroma.WithWhereDocument(chroma.Regex("learning.*training")),
	)
	fmt.Printf("doc $regex: %v\n", qResults.GetIDGroups())

	// $not_regex
	qResults = mustQuery("doc $not_regex",
		chroma.WithQueryEmbeddings(queryEmb),
		chroma.WithNResults(4),
		chroma.WithWhereDocument(chroma.NotRegex("quantum.*crypto")),
	)
	fmt.Printf("doc $not_regex: %v\n", qResults.GetIDGroups())

	// Document filter with $and
	qResults = mustQuery("doc $and",
		chroma.WithQueryEmbeddings(queryEmb),
		chroma.WithNResults(4),
		chroma.WithWhereDocument(chroma.AndDocument(
			chroma.Contains("learning"),
			chroma.NotContains("healthcare"),
		)),
	)
	fmt.Printf("doc $and: %v\n", qResults.GetIDGroups())

	// --- Pagination ---

	page1 := mustGet("page 1",
		chroma.WithLimit(2),
		chroma.WithOffset(0),
	)
	fmt.Printf("page 1: %v\n", page1.GetIDs())

	page2 := mustGet("page 2",
		chroma.WithLimit(2),
		chroma.WithOffset(2),
	)
	fmt.Printf("page 2: %v\n", page2.GetIDs())

	// --- Combined: metadata + document filters ---
	qResults = mustQuery("combined metadata + doc",
		chroma.WithQueryEmbeddings(queryEmb),
		chroma.WithNResults(4),
		chroma.WithWhere(chroma.EqString("category", "ml")),
		chroma.WithWhereDocument(chroma.Contains("learning")),
	)
	fmt.Printf("combined metadata + doc: %v\n", qResults.GetIDGroups())

	fmt.Println("\ngo: all filter examples passed")
}
