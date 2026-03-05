package main

import (
	"context"
	"crypto/sha1"
	"encoding/hex"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"

	chroma "github.com/amikos-tech/chroma-go/pkg/api/v2"
	ort "github.com/amikos-tech/chroma-go/pkg/embeddings/ort"
	"github.com/spf13/cobra"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	gtext "github.com/yuin/goldmark/text"
	"gopkg.in/yaml.v3"
)

const (
	defaultPersistPath = "./chroma_data"
	defaultCollection  = "local_markdown_cli"
	defaultChunkSize   = 120
	defaultOverlap     = 20
	defaultK           = 5
	upsertBatchSize    = 64
)

var (
	frontMatterRegex = regexp.MustCompile(`(?s)\A---\n(.*?)\n---\n?(.*)\z`)
	whitespaceRegex  = regexp.MustCompile(`\s+`)
	filterKeyRegex   = regexp.MustCompile(`^[A-Za-z0-9_.-]+$`)
)

type appConfig struct {
	persistPath string
	collection  string
	chunkSize   int
	overlap     int
	reset       bool
	k           int
}

type chunkRecord struct {
	ID       chroma.DocumentID
	Text     string
	Metadata chroma.DocumentMetadata
}

type parsedSearch struct {
	Text    string
	Filters map[string]string
}

func main() {
	if err := newRootCmd().Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func newRootCmd() *cobra.Command {
	cfg := &appConfig{}

	cmd := &cobra.Command{
		Use:   "mdlocal",
		Short: "Index and search local markdown files with chroma-go PersistentClient",
		Long: "A tiny local-only CLI example that uses chroma-go PersistentClient + default_ef " +
			"to index markdown files and run semantic search with metadata filters.",
		SilenceUsage: true,
	}

	cmd.PersistentFlags().StringVar(&cfg.persistPath, "persist-path", defaultPersistPath, "Local Chroma persistence directory")
	cmd.PersistentFlags().StringVar(&cfg.collection, "collection", defaultCollection, "Collection name")

	cmd.AddCommand(newIndexCmd(cfg))
	cmd.AddCommand(newSearchCmd(cfg))

	return cmd
}

func newIndexCmd(cfg *appConfig) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "index <markdown-dir>",
		Short: "Index markdown files from a directory",
		Long: "Walk a directory recursively, parse markdown into plain text chunks, " +
			"and upsert chunks into a local Chroma collection.",
		Args: cobra.ExactArgs(1),
		Example: strings.TrimSpace(`
mdlocal index ./docs --reset
mdlocal index ./notes --chunk-size 160 --chunk-overlap 30
`),
		RunE: func(cmd *cobra.Command, args []string) error {
			return runIndex(cmd.Context(), cfg, args[0])
		},
	}

	cmd.Flags().IntVar(&cfg.chunkSize, "chunk-size", defaultChunkSize, "Chunk size in words")
	cmd.Flags().IntVar(&cfg.overlap, "chunk-overlap", defaultOverlap, "Chunk overlap in words")
	cmd.Flags().BoolVar(&cfg.reset, "reset", false, "Delete and recreate the collection before indexing")

	return cmd
}

func newSearchCmd(cfg *appConfig) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "search <query>",
		Short: "Search indexed markdown",
		Long: "Run semantic search against local Chroma data. " +
			"Use metadata filters inline as key:value or <key:value> (example: env:prod).",
		Args: cobra.MinimumNArgs(1),
		Example: strings.TrimSpace(`
mdlocal search "incident response"
mdlocal search "rollback plan env:prod team:platform"
mdlocal search "on-call <env:dev>"
`),
		RunE: func(cmd *cobra.Command, args []string) error {
			query := strings.Join(args, " ")
			return runSearch(cmd.Context(), cfg, query)
		},
	}

	cmd.Flags().IntVar(&cfg.k, "k", defaultK, "Number of results to return")
	return cmd
}

func runIndex(ctx context.Context, cfg *appConfig, dir string) error {
	if cfg.chunkSize <= 0 {
		return errors.New("chunk-size must be greater than 0")
	}
	if cfg.overlap < 0 {
		return errors.New("chunk-overlap cannot be negative")
	}
	if cfg.overlap >= cfg.chunkSize {
		return errors.New("chunk-overlap must be smaller than chunk-size")
	}

	absRoot, err := filepath.Abs(dir)
	if err != nil {
		return fmt.Errorf("resolve dir: %w", err)
	}

	files, err := collectMarkdownFiles(absRoot)
	if err != nil {
		return err
	}
	if len(files) == 0 {
		return fmt.Errorf("no markdown files found in %s", absRoot)
	}

	client, err := chroma.NewPersistentClient(chroma.WithPersistentPath(cfg.persistPath))
	if err != nil {
		return fmt.Errorf("create persistent client: %w", err)
	}
	defer func() {
		_ = client.Close()
	}()

	ef, closeEF, err := ort.NewDefaultEmbeddingFunction()
	if err != nil {
		return fmt.Errorf("create default_ef: %w", err)
	}
	defer func() {
		_ = closeEF()
	}()

	var collection chroma.Collection
	if cfg.reset {
		_ = client.DeleteCollection(ctx, cfg.collection)
		collection, err = client.CreateCollection(ctx, cfg.collection, chroma.WithEmbeddingFunctionCreate(ef))
	} else {
		collection, err = client.GetOrCreateCollection(ctx, cfg.collection, chroma.WithEmbeddingFunctionCreate(ef))
	}
	if err != nil {
		return fmt.Errorf("prepare collection %q: %w", cfg.collection, err)
	}

	records := make([]chunkRecord, 0, 512)
	for _, path := range files {
		chunks, chunkErr := buildChunkRecords(absRoot, path, cfg.chunkSize, cfg.overlap)
		if chunkErr != nil {
			return chunkErr
		}
		records = append(records, chunks...)
	}
	if len(records) == 0 {
		return errors.New("no non-empty chunks were produced from markdown files")
	}

	ids := make([]chroma.DocumentID, 0, len(records))
	texts := make([]string, 0, len(records))
	metadatas := make([]chroma.DocumentMetadata, 0, len(records))
	for _, record := range records {
		ids = append(ids, record.ID)
		texts = append(texts, record.Text)
		metadatas = append(metadatas, record.Metadata)
	}

	for start := 0; start < len(ids); start += upsertBatchSize {
		end := start + upsertBatchSize
		if end > len(ids) {
			end = len(ids)
		}
		if err := collection.Upsert(ctx,
			chroma.WithIDs(ids[start:end]...),
			chroma.WithTexts(texts[start:end]...),
			chroma.WithMetadatas(metadatas[start:end]...),
		); err != nil {
			return fmt.Errorf("upsert batch [%d:%d]: %w", start, end, err)
		}
	}

	count, err := collection.Count(ctx)
	if err != nil {
		return fmt.Errorf("count collection: %w", err)
	}

	fmt.Printf("Indexed %d chunks from %d markdown files into %q (persist-path=%s).\n", len(records), len(files), cfg.collection, cfg.persistPath)
	fmt.Printf("Collection document count: %d\n", count)
	fmt.Println("Tip: run search with metadata filters, e.g. mdlocal search \"incident env:prod\"")

	return nil
}

func runSearch(ctx context.Context, cfg *appConfig, rawQuery string) error {
	if cfg.k <= 0 {
		return errors.New("k must be greater than 0")
	}

	parsed := parseSearchQuery(rawQuery)
	if parsed.Text == "" {
		return errors.New("query text is empty after removing metadata filters")
	}

	client, err := chroma.NewPersistentClient(chroma.WithPersistentPath(cfg.persistPath))
	if err != nil {
		return fmt.Errorf("create persistent client: %w", err)
	}
	defer func() {
		_ = client.Close()
	}()

	ef, closeEF, err := ort.NewDefaultEmbeddingFunction()
	if err != nil {
		return fmt.Errorf("create default_ef: %w", err)
	}
	defer func() {
		_ = closeEF()
	}()

	collection, err := client.GetCollection(ctx, cfg.collection, chroma.WithEmbeddingFunctionGet(ef))
	if err != nil {
		return fmt.Errorf("open collection %q: %w", cfg.collection, err)
	}

	queryOptions := []chroma.CollectionQueryOption{
		chroma.WithQueryTexts(parsed.Text),
		chroma.WithNResults(cfg.k),
		chroma.WithInclude(chroma.IncludeDocuments, chroma.IncludeMetadatas, chroma.IncludeDistances),
	}
	if where := buildWhereFilter(parsed.Filters); where != nil {
		queryOptions = append(queryOptions, chroma.WithWhere(where))
	}

	result, err := collection.Query(ctx, queryOptions...)
	if err != nil {
		return fmt.Errorf("query collection: %w", err)
	}

	idGroups := result.GetIDGroups()
	if len(idGroups) == 0 || len(idGroups[0]) == 0 {
		fmt.Println("No results found.")
		return nil
	}

	docGroups := result.GetDocumentsGroups()
	metaGroups := result.GetMetadatasGroups()
	distanceGroups := result.GetDistancesGroups()

	fmt.Printf("Query: %q\n", parsed.Text)
	if len(parsed.Filters) > 0 {
		fmt.Printf("Metadata filters: %s\n", formatFilters(parsed.Filters))
	}
	fmt.Println()

	for i, id := range idGroups[0] {
		var docText string
		if len(docGroups) > 0 && len(docGroups[0]) > i && docGroups[0][i] != nil {
			docText = docGroups[0][i].ContentString()
		}

		var distance float64
		if len(distanceGroups) > 0 && len(distanceGroups[0]) > i {
			distance = float64(distanceGroups[0][i])
		}

		var meta chroma.DocumentMetadata
		if len(metaGroups) > 0 && len(metaGroups[0]) > i {
			meta = metaGroups[0][i]
		}

		fmt.Printf("%d. id=%s distance=%.4f\n", i+1, id, distance)
		if metaInfo := summarizeMetadata(meta); metaInfo != "" {
			fmt.Printf("   metadata: %s\n", metaInfo)
		}
		fmt.Printf("   text: %s\n\n", shorten(docText, 180))
	}

	return nil
}

func collectMarkdownFiles(root string) ([]string, error) {
	files := make([]string, 0, 64)

	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if d.IsDir() {
			if strings.HasPrefix(d.Name(), ".") && path != root {
				return filepath.SkipDir
			}
			return nil
		}
		ext := strings.ToLower(filepath.Ext(path))
		if ext == ".md" || ext == ".markdown" {
			files = append(files, path)
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("walk markdown files in %s: %w", root, err)
	}

	sort.Strings(files)
	return files, nil
}

func buildChunkRecords(rootDir, path string, chunkSize, overlap int) ([]chunkRecord, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read %s: %w", path, err)
	}

	meta, body := parseFrontMatter(string(raw))
	plain := markdownToPlainText(body)
	chunks := chunkByWords(plain, chunkSize, overlap)
	if len(chunks) == 0 {
		return nil, nil
	}

	relPath, err := filepath.Rel(rootDir, path)
	if err != nil {
		relPath = path
	}
	relPath = filepath.ToSlash(relPath)

	records := make([]chunkRecord, 0, len(chunks))
	for i, chunk := range chunks {
		docMeta := chroma.NewDocumentMetadata(
			chroma.NewStringAttribute("source", relPath),
			chroma.NewStringAttribute("filename", filepath.Base(path)),
			chroma.NewIntAttribute("chunk_index", int64(i+1)),
			chroma.NewIntAttribute("chunk_total", int64(len(chunks))),
		)
		for key, value := range meta {
			if key == "source" || key == "filename" || key == "chunk_index" || key == "chunk_total" {
				continue
			}
			docMeta.SetString(key, value)
		}

		records = append(records, chunkRecord{
			ID:       makeChunkID(relPath, i+1),
			Text:     chunk,
			Metadata: docMeta,
		})
	}

	return records, nil
}

func parseFrontMatter(content string) (map[string]string, string) {
	metadata := map[string]string{}
	normalized := normalizeNewlines(content)

	matches := frontMatterRegex.FindStringSubmatch(normalized)
	if len(matches) != 3 {
		return metadata, normalized
	}

	fmRaw := matches[1]
	body := matches[2]

	parsed := map[string]any{}
	if err := yaml.Unmarshal([]byte(fmRaw), &parsed); err != nil {
		return metadata, normalized
	}

	for key, value := range parsed {
		switch v := value.(type) {
		case string:
			metadata[key] = v
		case bool, int, int64, float32, float64:
			metadata[key] = fmt.Sprint(v)
		}
	}

	return metadata, body
}

func markdownToPlainText(markdown string) string {
	source := []byte(markdown)
	doc := goldmark.DefaultParser().Parse(gtext.NewReader(source))

	var b strings.Builder
	_ = ast.Walk(doc, func(node ast.Node, entering bool) (ast.WalkStatus, error) {
		if entering {
			switch n := node.(type) {
			case *ast.Text:
				b.Write(n.Segment.Value(source))
				if n.SoftLineBreak() || n.HardLineBreak() {
					b.WriteByte('\n')
				}
			case *ast.CodeSpan:
				b.Write(n.Text(source))
				b.WriteByte(' ')
				return ast.WalkSkipChildren, nil
			case *ast.FencedCodeBlock:
				lines := n.Lines()
				for i := 0; i < lines.Len(); i++ {
					seg := lines.At(i)
					b.Write(seg.Value(source))
				}
			case *ast.CodeBlock:
				lines := n.Lines()
				for i := 0; i < lines.Len(); i++ {
					seg := lines.At(i)
					b.Write(seg.Value(source))
				}
			}
			return ast.WalkContinue, nil
		}

		switch node.Kind() {
		case ast.KindHeading, ast.KindParagraph, ast.KindListItem, ast.KindBlockquote, ast.KindFencedCodeBlock, ast.KindCodeBlock:
			b.WriteByte('\n')
		}
		return ast.WalkContinue, nil
	})

	return normalizeWhitespace(b.String())
}

func chunkByWords(text string, chunkSize, overlap int) []string {
	words := strings.Fields(text)
	if len(words) == 0 {
		return nil
	}

	step := chunkSize - overlap
	if step <= 0 {
		step = 1
	}

	chunks := make([]string, 0, (len(words)/step)+1)
	for start := 0; start < len(words); start += step {
		end := start + chunkSize
		if end > len(words) {
			end = len(words)
		}
		chunks = append(chunks, strings.Join(words[start:end], " "))
		if end == len(words) {
			break
		}
	}

	return chunks
}

func makeChunkID(relPath string, chunkIndex int) chroma.DocumentID {
	sum := sha1.Sum([]byte(fmt.Sprintf("%s:%d", relPath, chunkIndex)))
	return chroma.DocumentID("md-" + hex.EncodeToString(sum[:]))
}

func parseSearchQuery(raw string) parsedSearch {
	filters := map[string]string{}
	textTokens := make([]string, 0)

	for _, token := range strings.Fields(raw) {
		key, value, ok := parseFilterToken(token)
		if ok {
			filters[key] = value
			continue
		}
		textTokens = append(textTokens, token)
	}

	return parsedSearch{
		Text:    strings.Join(textTokens, " "),
		Filters: filters,
	}
}

func parseFilterToken(token string) (string, string, bool) {
	token = strings.TrimSpace(token)
	if token == "" {
		return "", "", false
	}

	token = strings.TrimPrefix(token, "<")
	token = strings.TrimSuffix(token, ">")
	if strings.Count(token, ":") != 1 {
		return "", "", false
	}

	parts := strings.SplitN(token, ":", 2)
	key := strings.TrimSpace(parts[0])
	value := strings.TrimSpace(parts[1])

	if key == "" || value == "" {
		return "", "", false
	}
	if !filterKeyRegex.MatchString(key) {
		return "", "", false
	}
	if strings.HasPrefix(value, "//") || strings.HasPrefix(value, "\\") {
		return "", "", false
	}

	return key, value, true
}

func buildWhereFilter(filters map[string]string) chroma.WhereFilter {
	if len(filters) == 0 {
		return nil
	}

	keys := make([]string, 0, len(filters))
	for key := range filters {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	clauses := make([]chroma.WhereClause, 0, len(keys))
	for _, key := range keys {
		clauses = append(clauses, chroma.EqString(chroma.K(key), filters[key]))
	}
	if len(clauses) == 1 {
		return clauses[0]
	}
	return chroma.And(clauses...)
}

func summarizeMetadata(meta chroma.DocumentMetadata) string {
	if meta == nil {
		return ""
	}

	parts := make([]string, 0, 5)
	for _, key := range []string{"source", "env", "team", "title", "filename"} {
		if value := metadataValue(meta, key); value != "" {
			parts = append(parts, fmt.Sprintf("%s=%s", key, value))
		}
	}

	return strings.Join(parts, " ")
}

func metadataValue(meta chroma.DocumentMetadata, key string) string {
	if meta == nil {
		return ""
	}
	if value, ok := meta.GetString(key); ok {
		return value
	}
	if value, ok := meta.GetInt(key); ok {
		return fmt.Sprintf("%d", value)
	}
	if value, ok := meta.GetFloat(key); ok {
		return fmt.Sprintf("%g", value)
	}
	if value, ok := meta.GetBool(key); ok {
		return fmt.Sprintf("%t", value)
	}
	return ""
}

func formatFilters(filters map[string]string) string {
	if len(filters) == 0 {
		return ""
	}
	keys := make([]string, 0, len(filters))
	for key := range filters {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	pairs := make([]string, 0, len(keys))
	for _, key := range keys {
		pairs = append(pairs, fmt.Sprintf("%s:%s", key, filters[key]))
	}
	return strings.Join(pairs, ", ")
}

func shorten(text string, limit int) string {
	trimmed := strings.TrimSpace(text)
	runes := []rune(trimmed)
	if len(runes) <= limit {
		return trimmed
	}
	return strings.TrimSpace(string(runes[:limit])) + "..."
}

func normalizeWhitespace(value string) string {
	return strings.TrimSpace(whitespaceRegex.ReplaceAllString(value, " "))
}

func normalizeNewlines(value string) string {
	value = strings.ReplaceAll(value, "\r\n", "\n")
	value = strings.ReplaceAll(value, "\r", "\n")
	return value
}
