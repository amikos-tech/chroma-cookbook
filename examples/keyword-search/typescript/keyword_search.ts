/**
 * Chroma keyword search example using whereDocument and vector search.
 *
 * Requires a running Chroma server:
 *   docker run --rm -p 8000:8000 chromadb/chroma:1.5.2
 */

import { ChromaClient } from "chromadb";

const client = new ChromaClient({ host: "localhost", port: 8000 });
const collectionName = "keyword_search_demo_typescript";

try {
    await client.deleteCollection({ name: collectionName });
} catch {
    // ignore missing collection
}

const collection = await client.createCollection({ name: collectionName });

await collection.add({
    ids: ["1", "2", "3"],
    documents: [
        "He is a technology freak and he loves AI topics",
        "AI technology are advancing at a fast pace",
        "Innovation in LLMs is a hot topic",
    ],
    metadatas: [
        { author: "John Doe" },
        { author: "Jane Doe" },
        { author: "John Doe" },
    ],
    embeddings: [
        [0.1, 0.8, 0.3],
        [0.2, 0.9, 0.2],
        [0.9, 0.1, 0.1],
    ],
});

const containsResults = await collection.query({
    queryEmbeddings: [[0.15, 0.85, 0.25]],
    nResults: 3,
    whereDocument: {
        $or: [{ $contains: "technology" }, { $contains: "freak" }],
    },
    include: ["documents", "metadatas", "distances"],
});

console.log("contains/or:", JSON.stringify(containsResults, null, 2));

const regexResults = await collection.query({
    queryEmbeddings: [[0.15, 0.85, 0.25]],
    nResults: 3,
    whereDocument: { $regex: "technology.*pace" },
    include: ["documents", "metadatas", "distances"],
});
console.log("regex:", JSON.stringify(regexResults, null, 2));

const notRegexResults = await collection.query({
    queryEmbeddings: [[0.15, 0.85, 0.25]],
    nResults: 3,
    whereDocument: { $not_regex: "Innovation.*topic" },
    include: ["documents", "metadatas", "distances"],
});
console.log("not_regex:", JSON.stringify(notRegexResults, null, 2));

await client.deleteCollection({ name: collectionName });
console.log("\ntypescript: keyword search example passed");
