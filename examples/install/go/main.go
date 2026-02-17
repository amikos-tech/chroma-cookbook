package main

import (
	"context"
	"fmt"
	"log"

	chroma "github.com/amikos-tech/chroma-go/pkg/api/v2"
)

func main() {
	client, err := chroma.NewHTTPClient(
		chroma.WithBaseURL("http://localhost:8000"),
	)
	if err != nil {
		log.Fatal(err)
	}
	version, err := client.GetVersion(context.Background())
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("go: ok (version %s)\n", version)
}
