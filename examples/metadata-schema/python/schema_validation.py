"""Validate metadata with Pydantic before writing to Chroma.

Shows a full roundtrip:
1) validate metadata in app layer
2) insert into Chroma
3) read back and validate again
4) run a filtered query and parse top metadata result

Requires a running Chroma server, for example:
    docker run --rm -p 8000:8000 chromadb/chroma:1.5.1
"""

from typing import Any, Literal

import chromadb
from pydantic import BaseModel, ConfigDict, Field, ValidationError


class RecordMetadata(BaseModel):
    """Application-level metadata schema contract."""

    model_config = ConfigDict(extra="forbid")

    tenant_id: str = Field(min_length=1)
    doc_type: Literal["policy", "faq", "runbook"]
    published: bool
    priority: int = Field(ge=1, le=5)
    quality_score: float = Field(ge=0.0, le=1.0)


class RawRecord(BaseModel):
    id: str
    document: str
    embedding: list[float]
    metadata: dict[str, Any]


def insert_validated_record(collection: Any, record: RawRecord) -> RecordMetadata | None:
    """Validate one record and insert into Chroma if valid."""

    try:
        validated = RecordMetadata.model_validate(record.metadata)
    except ValidationError as exc:
        print(f"rejected {record.id}: {exc.errors()}")
        return None

    collection.add(
        ids=[record.id],
        documents=[record.document],
        embeddings=[record.embedding],
        metadatas=[validated.model_dump()],
    )
    print(f"inserted {record.id}")
    return validated


def read_validated_record(collection: Any, record_id: str) -> RecordMetadata:
    """Read one record by id and parse metadata back into typed schema."""

    result = collection.get(ids=[record_id], include=["documents", "metadatas"])
    if not result["metadatas"] or not result["metadatas"][0]:
        raise ValueError(f"no metadata returned for {record_id}")

    parsed = RecordMetadata.model_validate(result["metadatas"][0])
    print(f"read {record_id} -> {parsed.model_dump()}")
    return parsed


def main() -> None:
    client = chromadb.HttpClient(host="localhost", port=8000)
    collection_name = "metadata_schema_python"

    try:
        client.delete_collection(name=collection_name)
    except Exception:
        pass

    collection = client.create_collection(name=collection_name)

    raw_records = [
        RawRecord(
            id="doc-1",
            document="Password reset policy for employees.",
            embedding=[0.1, 0.2, 0.3],
            metadata={
                "tenant_id": "acme",
                "doc_type": "policy",
                "published": True,
                "priority": 2,
                "quality_score": 0.91,
            },
        ),
        RawRecord(
            id="doc-2",
            document="FAQ for account lockouts.",
            embedding=[0.2, 0.3, 0.4],
            metadata={
                "tenant_id": "acme",
                "doc_type": "faq",
                "published": True,
                "priority": 6,
                "quality_score": 0.7,
            },
        ),
        RawRecord(
            id="doc-3",
            document="Runbook for SSO outage response.",
            embedding=[0.3, 0.4, 0.5],
            metadata={
                "tenant_id": "",
                "doc_type": "runbook",
                "published": False,
                "priority": 1,
                "quality_score": 0.88,
            },
        ),
    ]

    inserted_ids: list[str] = []

    for record in raw_records:
        validated = insert_validated_record(collection, record)
        if validated is None:
            continue

        inserted_ids.append(record.id)
        read_validated_record(collection, record.id)

    if not inserted_ids:
        raise RuntimeError("no records passed schema validation")

    query_results = collection.query(
        query_embeddings=[[0.1, 0.2, 0.3]],
        n_results=3,
        where={"tenant_id": "acme"},
        include=["documents", "metadatas", "distances"],
    )
    print(f"query ids: {query_results['ids']}")

    top_meta = (
        query_results.get("metadatas", [[]])[0][0]
        if query_results.get("metadatas") and query_results["metadatas"][0]
        else None
    )
    if top_meta is not None:
        parsed = RecordMetadata.model_validate(top_meta)
        print(f"query top metadata (typed): {parsed.model_dump()}")


if __name__ == "__main__":
    main()
