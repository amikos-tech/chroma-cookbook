package main

import (
	"context"
	"fmt"
	"log"

	chroma "github.com/amikos-tech/chroma-go/pkg/api/v2"
)

func main() {
	client, err := chroma.NewHTTPClient(context.Background(), chroma.WithBaseURL("http://localhost:8000"))
	if err != nil {
		log.Fatal(err)
	}
	_, err = client.Heartbeat(context.Background())
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("go: ok")
}
