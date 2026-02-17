import { ChromaClient } from "chromadb";

const client = new ChromaClient();
const collection = await client.getOrCreateCollection({ name: "test" });
await collection.add({ ids: ["1"], documents: ["hello world"] });
const results = await collection.query({ queryTexts: ["hello"], nResults: 1 });
console.assert(results.ids[0][0] === "1");
console.log("js: ok");
