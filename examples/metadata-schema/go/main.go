// Validate metadata with go-playground/validator before writing to Chroma.
//
// Shows a full roundtrip:
// 1) validate metadata in app layer
// 2) insert into Chroma
// 3) read back and validate again
// 4) run a filtered query and parse top metadata result
//
// Requires a running Chroma server:
//
//	docker run --rm -p 8000:8000 chromadb/chroma:1.5.1
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"

	chroma "github.com/amikos-tech/chroma-go/pkg/api/v2"
	"github.com/amikos-tech/chroma-go/pkg/embeddings"
	"github.com/go-playground/validator/v10"
)

type RecordMetadata struct {
	TenantID     string  `json:"tenant_id" validate:"required,min=1"`
	DocType      string  `json:"doc_type" validate:"required,oneof=policy faq runbook"`
	Published    bool    `json:"published"`
	Priority     int64   `json:"priority" validate:"gte=1,lte=5"`
	QualityScore float64 `json:"quality_score" validate:"gte=0,lte=1"`
}

type RawRecord struct {
	ID        string
	Document  string
	Embedding []float32
	Metadata  map[string]any
}

func toChromaMetadata(m RecordMetadata) chroma.DocumentMetadata {
	docMeta := chroma.NewDocumentMetadata()
	docMeta.SetString("tenant_id", m.TenantID)
	docMeta.SetString("doc_type", m.DocType)
	docMeta.SetBool("published", m.Published)
	docMeta.SetInt("priority", m.Priority)
	docMeta.SetFloat("quality_score", m.QualityScore)
	return docMeta
}

func decodeMetadata(raw map[string]any) (RecordMetadata, error) {
	payload, err := json.Marshal(raw)
	if err != nil {
		return RecordMetadata{}, err
	}

	var metadata RecordMetadata
	if err := json.Unmarshal(payload, &metadata); err != nil {
		return RecordMetadata{}, err
	}
	return metadata, nil
}

func parseMetadataFromChroma(metadata chroma.DocumentMetadata, validate *validator.Validate) (RecordMetadata, error) {
	tenantID, ok := metadata.GetString("tenant_id")
	if !ok {
		return RecordMetadata{}, errors.New("tenant_id missing or not string")
	}
	docType, ok := metadata.GetString("doc_type")
	if !ok {
		return RecordMetadata{}, errors.New("doc_type missing or not string")
	}
	published, ok := metadata.GetBool("published")
	if !ok {
		return RecordMetadata{}, errors.New("published missing or not bool")
	}
	priority, ok := metadata.GetInt("priority")
	if !ok {
		priorityAsFloat, floatOK := metadata.GetFloat("priority")
		if !floatOK || priorityAsFloat != float64(int64(priorityAsFloat)) {
			return RecordMetadata{}, errors.New("priority missing or not a whole number")
		}
		priority = int64(priorityAsFloat)
	}
	qualityScore, ok := metadata.GetFloat("quality_score")
	if !ok {
		qualityAsInt, intOK := metadata.GetInt("quality_score")
		if !intOK {
			return RecordMetadata{}, errors.New("quality_score missing or not numeric")
		}
		qualityScore = float64(qualityAsInt)
	}

	parsed := RecordMetadata{
		TenantID:     tenantID,
		DocType:      docType,
		Published:    published,
		Priority:     priority,
		QualityScore: qualityScore,
	}
	if err := validate.Struct(parsed); err != nil {
		return RecordMetadata{}, err
	}
	return parsed, nil
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

	collectionName := "metadata_schema_go"
	_ = client.DeleteCollection(ctx, collectionName)

	collection, err := client.CreateCollection(ctx, collectionName)
	if err != nil {
		log.Fatal(err)
	}

	rawRecords := []RawRecord{
		{
			ID:        "doc-1",
			Document:  "Password reset policy for employees.",
			Embedding: []float32{0.1, 0.2, 0.3},
			Metadata: map[string]any{
				"tenant_id":     "acme",
				"doc_type":      "policy",
				"published":     true,
				"priority":      2,
				"quality_score": 0.91,
			},
		},
		{
			ID:        "doc-2",
			Document:  "FAQ for account lockouts.",
			Embedding: []float32{0.2, 0.3, 0.4},
			Metadata: map[string]any{
				"tenant_id":     "acme",
				"doc_type":      "faq",
				"published":     true,
				"priority":      9,
				"quality_score": 0.7,
			},
		},
		{
			ID:        "doc-3",
			Document:  "Runbook for SSO outage response.",
			Embedding: []float32{0.3, 0.4, 0.5},
			Metadata: map[string]any{
				"tenant_id":     "",
				"doc_type":      "runbook",
				"published":     false,
				"priority":      1,
				"quality_score": 0.88,
			},
		},
	}

	validate := validator.New()

	insertValidatedRecord := func(record RawRecord) (bool, error) {
		metadata, err := decodeMetadata(record.Metadata)
		if err != nil {
			fmt.Printf("rejected %s: decode error: %v\n", record.ID, err)
			return false, nil
		}
		if err := validate.Struct(metadata); err != nil {
			fmt.Printf("rejected %s: validation error: %v\n", record.ID, err)
			return false, nil
		}

		err = collection.Add(ctx,
			chroma.WithIDs(chroma.DocumentID(record.ID)),
			chroma.WithTexts(record.Document),
			chroma.WithEmbeddings(embeddings.NewEmbeddingFromFloat32(record.Embedding)),
			chroma.WithMetadatas(toChromaMetadata(metadata)),
		)
		if err != nil {
			return false, err
		}
		fmt.Printf("inserted %s\n", record.ID)
		return true, nil
	}

	readValidatedRecord := func(id chroma.DocumentID) (RecordMetadata, error) {
		results, err := collection.Get(ctx,
			chroma.WithIDs(id),
			chroma.WithInclude(chroma.IncludeDocuments, chroma.IncludeMetadatas),
		)
		if err != nil {
			return RecordMetadata{}, err
		}
		if len(results.GetMetadatas()) == 0 || results.GetMetadatas()[0] == nil {
			return RecordMetadata{}, fmt.Errorf("no metadata returned for %s", id)
		}

		parsed, err := parseMetadataFromChroma(results.GetMetadatas()[0], validate)
		if err != nil {
			return RecordMetadata{}, err
		}
		fmt.Printf("read %s -> %+v\n", id, parsed)
		return parsed, nil
	}

	insertedIDs := make([]chroma.DocumentID, 0, len(rawRecords))
	for _, record := range rawRecords {
		inserted, err := insertValidatedRecord(record)
		if err != nil {
			log.Fatal(err)
		}
		if !inserted {
			continue
		}

		id := chroma.DocumentID(record.ID)
		insertedIDs = append(insertedIDs, id)
		if _, err := readValidatedRecord(id); err != nil {
			log.Fatal(err)
		}
	}

	if len(insertedIDs) == 0 {
		log.Fatal("no records passed schema validation")
	}

	queryResults, err := collection.Query(ctx,
		chroma.WithQueryEmbeddings(embeddings.NewEmbeddingFromFloat32([]float32{0.1, 0.2, 0.3})),
		chroma.WithNResults(3),
		chroma.WithWhere(chroma.EqString("tenant_id", "acme")),
		chroma.WithInclude(chroma.IncludeDocuments, chroma.IncludeMetadatas, chroma.IncludeDistances),
	)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("query ids: %v\n", queryResults.GetIDGroups())
	metadataGroups := queryResults.GetMetadatasGroups()
	if len(metadataGroups) > 0 && len(metadataGroups[0]) > 0 && metadataGroups[0][0] != nil {
		parsed, err := parseMetadataFromChroma(metadataGroups[0][0], validate)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Printf("query top metadata (typed): %+v\n", parsed)
	}
}
