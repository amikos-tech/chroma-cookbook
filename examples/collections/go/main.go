// Chroma collection examples - CRUD, iteration, and query patterns.
//
// Requires a running Chroma server:
//
//	docker run -p 8000:8000 chromadb/chroma
package main

import (
	"context"
	"fmt"
	"log"

	chroma "github.com/amikos-tech/chroma-go/pkg/api/v2"
	"github.com/amikos-tech/chroma-go/pkg/embeddings"
)

func main() {
	ctx := context.Background()

	client, err := chroma.NewHTTPClient(
		chroma.WithBaseURL("http://localhost:8000"),
		chroma.WithDefaultDatabaseAndTenant(),
	)
	if err != nil {
		log.Fatal(err)
	}

	cleanup := []string{}
	track := func(name string) {
		cleanup = append(cleanup, name)
		_ = client.DeleteCollection(ctx, name)
	}

	// ── Create Collection ──

	track("create_basic")
	col, err := client.CreateCollection(ctx, "create_basic")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("created: %s\n", col.Name())

	// ── Get or Create Collection ──

	track("get_or_create")
	col2, err := client.GetOrCreateCollection(ctx, "get_or_create")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("get_or_create: %s\n", col2.Name())

	// ── List Collections ──

	collections, err := client.ListCollections(ctx)
	if err != nil {
		log.Fatal(err)
	}
	names := make([]string, len(collections))
	for i, c := range collections {
		names[i] = c.Name()
	}
	fmt.Printf("all collections: %v\n", names)

	// with pagination
	collections, _ = client.ListCollections(ctx, chroma.ListWithLimit(10), chroma.ListWithOffset(0))
	names = make([]string, len(collections))
	for i, c := range collections {
		names[i] = c.Name()
	}
	fmt.Printf("paginated (limit=10): %v\n", names)

	// ── Get a Collection ──

	fetched, err := client.GetCollection(ctx, "create_basic")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("get: %s\n", fetched.Name())

	// ── Delete Collection ──

	track("delete_me")
	_, err = client.CreateCollection(ctx, "delete_me")
	if err != nil {
		log.Fatal(err)
	}
	err = client.DeleteCollection(ctx, "delete_me")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("deleted: delete_me")

	// ── Query and Get Results ──

	track("results_demo")
	resCol, err := client.CreateCollection(ctx, "results_demo")
	if err != nil {
		log.Fatal(err)
	}

	// Seed data
	docIDs := make([]chroma.DocumentID, 20)
	texts := make([]string, 20)
	metas := make([]chroma.DocumentMetadata, 20)
	embs := make([]embeddings.Embedding, 20)
	for i := 0; i < 20; i++ {
		docIDs[i] = chroma.DocumentID(fmt.Sprintf("doc-%d", i))
		texts[i] = fmt.Sprintf("document about topic %d", i%5)
		m := chroma.NewDocumentMetadata()
		m.SetInt("page", int64(i))
		m.SetString("category", fmt.Sprintf("cat-%d", i%3))
		metas[i] = m
		embs[i] = embeddings.NewEmbeddingFromFloat32([]float32{float32(i) * 0.1, float32(i) * 0.2, float32(i) * 0.3})
	}

	err = resCol.Add(ctx,
		chroma.WithIDs(docIDs...),
		chroma.WithTexts(texts...),
		chroma.WithMetadatas(metas...),
		chroma.WithEmbeddings(embs...),
	)
	if err != nil {
		log.Fatal(err)
	}

	// GET: row iteration
	getResult, err := resCol.Get(ctx,
		chroma.WithInclude(chroma.IncludeDocuments, chroma.IncludeMetadatas),
	)
	if err != nil {
		log.Fatal(err)
	}
	getRows, ok := getResult.(*chroma.GetResultImpl)
	if !ok {
		log.Fatalf("unexpected get result type %T", getResult)
	}
	for _, row := range getRows.Rows() {
		_ = row // process each record
	}
	fmt.Printf("get iteration: %d records\n", len(getRows.Rows()))

	if row, ok := getRows.At(0); ok {
		fmt.Printf("first get row: %s\n", row.ID)
	}

	// QUERY: nested iteration
	queryEmb := embeddings.NewEmbeddingFromFloat32([]float32{0.1, 0.2, 0.3})
	queryResult, err := resCol.Query(ctx,
		chroma.WithQueryEmbeddings(queryEmb),
		chroma.WithNResults(3),
		chroma.WithInclude(chroma.IncludeDocuments, chroma.IncludeMetadatas, chroma.IncludeDistances),
	)
	if err != nil {
		log.Fatal(err)
	}
	queryRows, ok := queryResult.(*chroma.QueryResultImpl)
	if !ok {
		log.Fatalf("unexpected query result type %T", queryResult)
	}

	// Rows() gives rows for the first query group
	for _, row := range queryRows.Rows() {
		fmt.Printf("  q0 %s: score=%.4f %s\n", row.ID, row.Score, row.Document)
	}

	if row, ok := queryRows.At(0, 0); ok {
		fmt.Printf("first query row: %s\n", row.ID)
	}

	// RowGroups() gives all query groups
	for queryIndex, rows := range queryRows.RowGroups() {
		for _, row := range rows {
			_ = queryIndex
			_ = row
		}
	}

	// ── Cleanup ──

	for _, name := range cleanup {
		_ = client.DeleteCollection(ctx, name)
	}

	fmt.Println("\ngo: all collection examples passed")
}
