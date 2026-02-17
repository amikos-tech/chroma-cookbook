/**
 * Chroma filtering examples - metadata filters, document filters, and pagination.
 *
 * Requires a running Chroma server: chroma run
 */

import { ChromaClient } from "chromadb";

const client = new ChromaClient({ host: "localhost", port: 8000 });

// Clean up if exists
try {
    await client.deleteCollection({ name: "filter_demo" });
} catch {
    // ignore
}

const collection = await client.createCollection({
    name: "filter_demo",
});

// Seed data
await collection.add({
    ids: ["doc-1", "doc-2", "doc-3", "doc-4"],
    documents: [
        "Machine learning is transforming healthcare diagnostics.",
        "Quantum computing may revolutionize cryptography.",
        "Renewable energy adoption is accelerating worldwide.",
        "Deep learning models require large datasets for training.",
    ],
    metadatas: [
        { category: "ml", year: 2024, citations: 150 },
        { category: "quantum", year: 2023, citations: 80 },
        { category: "energy", year: 2024, citations: 45 },
        { category: "ml", year: 2022, citations: 300 },
    ],
    embeddings: [
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6],
        [0.7, 0.8, 0.9],
        [0.2, 0.3, 0.4],
    ],
});

// --- Metadata Filters ---

// Equality ($eq) - simple syntax
let results = await collection.get({ where: { category: "ml" } });
console.log(`$eq (simple): ${JSON.stringify(results.ids)}`);

// Equality ($eq) - explicit syntax
results = await collection.get({
    where: { category: { $eq: "ml" } },
});
console.log(`$eq (explicit): ${JSON.stringify(results.ids)}`);

// Inequality ($ne)
results = await collection.get({
    where: { category: { $ne: "ml" } },
});
console.log(`$ne: ${JSON.stringify(results.ids)}`);

// Greater than ($gt)
results = await collection.get({
    where: { citations: { $gt: 100 } },
});
console.log(`$gt: ${JSON.stringify(results.ids)}`);

// Greater than or equal ($gte)
results = await collection.get({
    where: { year: { $gte: 2024 } },
});
console.log(`$gte: ${JSON.stringify(results.ids)}`);

// Less than ($lt)
results = await collection.get({
    where: { citations: { $lt: 100 } },
});
console.log(`$lt: ${JSON.stringify(results.ids)}`);

// Less than or equal ($lte)
results = await collection.get({
    where: { year: { $lte: 2023 } },
});
console.log(`$lte: ${JSON.stringify(results.ids)}`);

// In ($in)
results = await collection.get({
    where: { category: { $in: ["ml", "quantum"] } },
});
console.log(`$in: ${JSON.stringify(results.ids)}`);

// Not in ($nin)
results = await collection.get({
    where: { category: { $nin: ["ml", "quantum"] } },
});
console.log(`$nin: ${JSON.stringify(results.ids)}`);

// --- Logical Operators ---

// $and
results = await collection.get({
    where: { $and: [{ category: "ml" }, { year: { $gte: 2024 } }] },
});
console.log(`$and: ${JSON.stringify(results.ids)}`);

// $or
results = await collection.get({
    where: { $or: [{ category: "quantum" }, { category: "energy" }] },
});
console.log(`$or: ${JSON.stringify(results.ids)}`);

// Nested logical operators
results = await collection.get({
    where: {
        $and: [
            { year: { $gte: 2023 } },
            { $or: [{ category: "ml" }, { category: "quantum" }] },
        ],
    },
});
console.log(`nested: ${JSON.stringify(results.ids)}`);

// --- Document Filters ---

// $contains
let qResults = await collection.query({
    queryEmbeddings: [[0.1, 0.2, 0.3]],
    nResults: 4,
    whereDocument: { $contains: "learning" },
});
console.log(`doc $contains: ${JSON.stringify(qResults.ids)}`);

// $not_contains
qResults = await collection.query({
    queryEmbeddings: [[0.1, 0.2, 0.3]],
    nResults: 4,
    whereDocument: { $not_contains: "learning" },
});
console.log(`doc $not_contains: ${JSON.stringify(qResults.ids)}`);

// $regex
qResults = await collection.query({
    queryEmbeddings: [[0.1, 0.2, 0.3]],
    nResults: 4,
    whereDocument: { $regex: "learning.*training" },
});
console.log(`doc $regex: ${JSON.stringify(qResults.ids)}`);

// $not_regex
qResults = await collection.query({
    queryEmbeddings: [[0.1, 0.2, 0.3]],
    nResults: 4,
    whereDocument: { $not_regex: "quantum.*crypto" },
});
console.log(`doc $not_regex: ${JSON.stringify(qResults.ids)}`);

// Document filter with $and
qResults = await collection.query({
    queryEmbeddings: [[0.1, 0.2, 0.3]],
    nResults: 4,
    whereDocument: {
        $and: [{ $contains: "learning" }, { $not_contains: "healthcare" }],
    },
});
console.log(`doc $and: ${JSON.stringify(qResults.ids)}`);

// --- Pagination ---

const page1 = await collection.get({ limit: 2, offset: 0 });
console.log(`page 1: ${JSON.stringify(page1.ids)}`);

const page2 = await collection.get({ limit: 2, offset: 2 });
console.log(`page 2: ${JSON.stringify(page2.ids)}`);

// --- Combined: metadata + document filters ---
qResults = await collection.query({
    queryEmbeddings: [[0.1, 0.2, 0.3]],
    nResults: 4,
    where: { category: "ml" },
    whereDocument: { $contains: "learning" },
});
console.log(`combined metadata + doc: ${JSON.stringify(qResults.ids)}`);

console.log("\ntypescript: all filter examples passed");
