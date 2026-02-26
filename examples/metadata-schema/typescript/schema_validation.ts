/**
 * Validate metadata with Zod before writing to Chroma.
 *
 * Shows a full roundtrip:
 * 1) validate metadata in app layer
 * 2) insert into Chroma
 * 3) read back and validate again
 * 4) run a filtered query and parse top metadata result
 *
 * Requires a running Chroma server:
 *   docker run --rm -p 8000:8000 chromadb/chroma:1.5.1
 */

import { ChromaClient } from "chromadb";
import { z } from "zod";

const recordMetadataSchema = z
  .object({
    tenant_id: z.string().min(1),
    doc_type: z.enum(["policy", "faq", "runbook"]),
    published: z.boolean(),
    priority: z.number().int().min(1).max(5),
    quality_score: z.number().min(0).max(1),
  })
  .strict();

type RecordMetadata = z.infer<typeof recordMetadataSchema>;

type RawRecord = {
  id: string;
  document: string;
  embedding: number[];
  metadata: unknown;
};

const rawRecords: RawRecord[] = [
  {
    id: "doc-1",
    document: "Password reset policy for employees.",
    embedding: [0.1, 0.2, 0.3],
    metadata: {
      tenant_id: "acme",
      doc_type: "policy",
      published: true,
      priority: 2,
      quality_score: 0.91,
    },
  },
  {
    id: "doc-2",
    document: "FAQ for account lockouts.",
    embedding: [0.2, 0.3, 0.4],
    metadata: {
      tenant_id: "acme",
      doc_type: "faq",
      published: true,
      priority: 0,
      quality_score: 0.7,
    },
  },
  {
    id: "doc-3",
    document: "Runbook for SSO outage response.",
    embedding: [0.3, 0.4, 0.5],
    metadata: {
      tenant_id: "",
      doc_type: "runbook",
      published: false,
      priority: 1,
      quality_score: 0.88,
    },
  },
];

const client = new ChromaClient({ host: "localhost", port: 8000 });
const collectionName = "metadata_schema_typescript";

try {
  await client.deleteCollection({ name: collectionName });
} catch {
  // ignore
}

const collection = await client.createCollection({ name: collectionName });

const insertValidatedRecord = async (record: RawRecord): Promise<RecordMetadata | null> => {
  const validated = recordMetadataSchema.safeParse(record.metadata);
  if (!validated.success) {
    console.log(`rejected ${record.id}: ${validated.error.message}`);
    return null;
  }

  await collection.add({
    ids: [record.id],
    documents: [record.document],
    embeddings: [record.embedding],
    metadatas: [validated.data],
  });
  console.log(`inserted ${record.id}`);

  return validated.data;
};

const readValidatedRecord = async (id: string): Promise<RecordMetadata> => {
  const result = await collection.get({
    ids: [id],
    include: ["documents", "metadatas"],
  });

  const metadata = result.metadatas?.[0];
  if (!metadata) {
    throw new Error(`no metadata returned for ${id}`);
  }

  const parsed = recordMetadataSchema.parse(metadata);
  console.log(`read ${id} -> ${JSON.stringify(parsed)}`);
  return parsed;
};

const insertedIds: string[] = [];

for (const record of rawRecords) {
  const inserted = await insertValidatedRecord(record);
  if (inserted === null) {
    continue;
  }

  insertedIds.push(record.id);
  await readValidatedRecord(record.id);
}

if (insertedIds.length === 0) {
  throw new Error("no records passed schema validation");
}

const queryResults = await collection.query({
  queryEmbeddings: [[0.1, 0.2, 0.3]],
  nResults: 3,
  where: { tenant_id: "acme" },
  include: ["documents", "metadatas", "distances"],
});
console.log(`query ids: ${JSON.stringify(queryResults.ids)}`);

const topMeta = queryResults.metadatas?.[0]?.[0];
if (topMeta) {
  const parsed = recordMetadataSchema.parse(topMeta);
  console.log(`query top metadata (typed): ${JSON.stringify(parsed)}`);
}
