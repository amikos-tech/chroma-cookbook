/**
 * Chroma collection examples - CRUD, iteration, and convenience methods.
 *
 * Requires a running Chroma server:
 *     docker run -p 8000:8000 chromadb/chroma
 */

import { ChromaClient } from "chromadb";

const client = new ChromaClient({ host: "localhost", port: 8000 });

const CLEANUP: string[] = [];

function track(name: string) {
    CLEANUP.push(name);
}

async function tryDelete(name: string) {
    try {
        await client.deleteCollection({ name });
    } catch {
        // ignore
    }
}

// ── Create Collection ──

track("create_basic");
await tryDelete("create_basic");
const col = await client.createCollection({ name: "create_basic" });
console.log(`created: ${col.name}`);

// ── Get or Create Collection ──

track("get_or_create");
await tryDelete("get_or_create");
const col2 = await client.getOrCreateCollection({
    name: "get_or_create",
    metadata: { key: "value" },
});
console.log(`get_or_create: ${col2.name}, metadata: ${JSON.stringify(col2.metadata)}`);

// ── Create with HNSW Configuration ──

track("create_hnsw");
await tryDelete("create_hnsw");
const colHnsw = await client.createCollection({
    name: "create_hnsw",
    configuration: {
        hnsw: {
            space: "cosine",
            ef_construction: 200,
            max_neighbors: 32,
        },
    },
});
console.log(`hnsw config: ${colHnsw.name}`);

// ── List Collections ──

let collections = await client.listCollections({ limit: 10, offset: 0 });
console.log(
    `collections (limit=10): ${JSON.stringify(collections.map((c) => c.name))}`
);

// fetch the next page by advancing the offset
const nextPage = await client.listCollections({ limit: 10, offset: 10 });
console.log(
    `next page: ${JSON.stringify(nextPage.map((c) => c.name))}`
);

// ── Get a Collection ──

const fetched = await client.getCollection({ name: "create_basic" });
console.log(`get: ${fetched.name}`);

// ── Modify a Collection ──

track("modify_me");
await tryDelete("modify_me");
const modCol = await client.createCollection({ name: "modify_me" });
await modCol.modify({ name: "modify_me", metadata: { new_key: "new_value" } });
console.log("modified metadata");

// ── Count Collections ──

const count = await client.countCollections();
console.log(`collection count: ${count}`);

// ── Convenience Methods ──

track("convenience");
await tryDelete("convenience");
const convCol = await client.getOrCreateCollection({ name: "convenience" });
await convCol.add({
    ids: ["1", "2"],
    documents: ["hello world", "hello chroma"],
});

const peeked = await convCol.peek({ limit: 2 });
console.log(`peek: ${JSON.stringify(peeked.ids)}`);

const itemCount = await convCol.count();
console.log(`count: ${itemCount}`);

// ── Delete Collection ──

await tryDelete("delete_me");
await client.createCollection({ name: "delete_me" });
await client.deleteCollection({ name: "delete_me" });
console.log("deleted: delete_me");

// ── Query and Get Results ──

track("results_demo");
await tryDelete("results_demo");
const resCol = await client.createCollection({ name: "results_demo" });
await resCol.add({
    ids: Array.from({ length: 20 }, (_, i) => `doc-${i}`),
    documents: Array.from({ length: 20 }, (_, i) => `document about topic ${i % 5}`),
    metadatas: Array.from({ length: 20 }, (_, i) => ({
        page: i,
        category: `cat-${i % 3}`,
    })),
});

// GET: row-based iteration
const getResult = await resCol.get<{ page: number; category: string }>({
    include: ["documents", "metadatas"],
});
for (const row of getResult.rows()) {
    // process each record
}
console.log(`get iteration: ${getResult.ids.length} records`);

// QUERY: nested iteration
const queryResult = await resCol.query<{ page: number }>({
    queryTexts: ["topic 1"],
    nResults: 3,
    include: ["documents", "metadatas", "distances"],
});
for (const [queryIndex, rows] of queryResult.rows().entries()) {
    for (const row of rows) {
        console.log(
            `  query[${queryIndex}] ${row.id}: dist=${row.distance?.toFixed(4)} ${row.document}`
        );
    }
}

// ── Constrain Query Candidates By ID ──

const constrained = await resCol.query({
    queryTexts: ["topic 1"],
    nResults: 3,
    ids: ["doc-1", "doc-2", "doc-3"],
});
console.log(`constrained query returned ${constrained.ids[0].length} results (max 3 from 3 candidates)`);

// ── Cleanup ──

for (const name of CLEANUP) {
    await tryDelete(name);
}

console.log("\ntypescript: all collection examples passed");
