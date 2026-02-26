//! Validate metadata with serde + validator before writing to Chroma.
//!
//! Shows a full roundtrip:
//! 1) validate metadata in app layer
//! 2) insert into Chroma
//! 3) read back and validate again
//! 4) run a filtered query and parse top metadata result
//!
//! Requires a running Chroma server:
//!   docker run --rm -p 8000:8000 chromadb/chroma:1.5.1

use chroma::client::ChromaHttpClientOptions;
use chroma::types::{
    Metadata, MetadataComparison, MetadataExpression, MetadataValue, PrimitiveOperator, Where,
};
use chroma::ChromaHttpClient;
use serde::Deserialize;
use serde_json::{json, Value};
use std::io;
use url::Url;
use validator::Validate;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
enum DocType {
    Policy,
    Faq,
    Runbook,
}

impl DocType {
    fn as_str(&self) -> &'static str {
        match self {
            Self::Policy => "policy",
            Self::Faq => "faq",
            Self::Runbook => "runbook",
        }
    }
}

#[derive(Debug, Deserialize, Validate)]
struct RecordMetadata {
    #[validate(length(min = 1))]
    tenant_id: String,
    doc_type: DocType,
    published: bool,
    #[validate(range(min = 1, max = 5))]
    priority: i64,
    #[validate(range(min = 0.0, max = 1.0))]
    quality_score: f64,
}

struct RawRecord {
    id: String,
    document: String,
    embedding: Vec<f32>,
    metadata: Value,
}

fn io_error(message: impl Into<String>) -> io::Error {
    io::Error::other(message.into())
}

fn to_chroma_metadata(metadata: &RecordMetadata) -> Metadata {
    let mut m = Metadata::new();
    m.insert("tenant_id".into(), metadata.tenant_id.clone().into());
    m.insert("doc_type".into(), metadata.doc_type.as_str().into());
    m.insert("published".into(), metadata.published.into());
    m.insert("priority".into(), metadata.priority.into());
    m.insert("quality_score".into(), metadata.quality_score.into());
    m
}

fn required_string(metadata: &Metadata, key: &str) -> Result<String, io::Error> {
    let value = metadata
        .get(key)
        .ok_or_else(|| io_error(format!("{key} missing")))?;
    String::try_from(value).map_err(|_| io_error(format!("{key} is not a string")))
}

fn required_bool(metadata: &Metadata, key: &str) -> Result<bool, io::Error> {
    let value = metadata
        .get(key)
        .ok_or_else(|| io_error(format!("{key} missing")))?;
    bool::try_from(value).map_err(|_| io_error(format!("{key} is not a bool")))
}

fn required_i64(metadata: &Metadata, key: &str) -> Result<i64, io::Error> {
    let value = metadata
        .get(key)
        .ok_or_else(|| io_error(format!("{key} missing")))?;
    i64::try_from(value).map_err(|_| io_error(format!("{key} is not an int")))
}

fn required_f64(metadata: &Metadata, key: &str) -> Result<f64, io::Error> {
    let value = metadata
        .get(key)
        .ok_or_else(|| io_error(format!("{key} missing")))?;
    f64::try_from(value).map_err(|_| io_error(format!("{key} is not a float")))
}

fn parse_doc_type(value: &str) -> Result<DocType, io::Error> {
    match value {
        "policy" => Ok(DocType::Policy),
        "faq" => Ok(DocType::Faq),
        "runbook" => Ok(DocType::Runbook),
        _ => Err(io_error(format!("invalid doc_type: {value}"))),
    }
}

fn parse_metadata_from_chroma(metadata: &Metadata) -> Result<RecordMetadata, io::Error> {
    let tenant_id = required_string(metadata, "tenant_id")?;
    let doc_type = parse_doc_type(&required_string(metadata, "doc_type")?)?;
    let published = required_bool(metadata, "published")?;
    let priority = required_i64(metadata, "priority")?;
    let quality_score = required_f64(metadata, "quality_score")?;

    let parsed = RecordMetadata {
        tenant_id,
        doc_type,
        published,
        priority,
        quality_score,
    };
    parsed
        .validate()
        .map_err(|err| io_error(format!("metadata validation failed: {err}")))?;
    Ok(parsed)
}

fn eq_str(key: &str, value: &str) -> Where {
    Where::Metadata(MetadataExpression {
        key: key.to_string(),
        comparison: MetadataComparison::Primitive(
            PrimitiveOperator::Equal,
            MetadataValue::Str(value.to_string()),
        ),
    })
}

async fn insert_validated_record(
    collection: &chroma::ChromaCollection,
    record: &RawRecord,
) -> Result<Option<RecordMetadata>, io::Error> {
    let metadata: RecordMetadata = match serde_json::from_value(record.metadata.clone()) {
        Ok(m) => m,
        Err(err) => {
            println!("rejected {}: decode error: {}", record.id, err);
            return Ok(None);
        }
    };

    if let Err(err) = metadata.validate() {
        println!("rejected {}: validation error: {}", record.id, err);
        return Ok(None);
    }

    collection
        .add(
            vec![record.id.clone()],
            vec![record.embedding.clone()],
            Some(vec![Some(record.document.clone())]),
            None,
            Some(vec![Some(to_chroma_metadata(&metadata))]),
        )
        .await
        .map_err(|err| io_error(format!("insert failed for {}: {err}", record.id)))?;

    println!("inserted {}", record.id);
    Ok(Some(metadata))
}

async fn read_validated_record(
    collection: &chroma::ChromaCollection,
    id: &str,
) -> Result<RecordMetadata, io::Error> {
    let response = collection
        .get(Some(vec![id.to_string()]), None, Some(1), Some(0), None)
        .await
        .map_err(|err| io_error(format!("read failed for {id}: {err}")))?;

    let raw_metadata = response
        .metadatas
        .as_ref()
        .and_then(|items| items.first())
        .and_then(|item| item.as_ref())
        .ok_or_else(|| io_error(format!("no metadata returned for {id}")))?;

    parse_metadata_from_chroma(raw_metadata)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = ChromaHttpClient::new(ChromaHttpClientOptions {
        endpoint: Url::parse("http://localhost:8000")?,
        ..Default::default()
    });

    let collection_name = "metadata_schema_rust";

    let _ = client.delete_collection(collection_name).await;

    let collection = client
        .get_or_create_collection(collection_name, None, None)
        .await?;

    let raw_records = vec![
        RawRecord {
            id: "doc-1".to_string(),
            document: "Password reset policy for employees.".to_string(),
            embedding: vec![0.1, 0.2, 0.3],
            metadata: json!({
                "tenant_id": "acme",
                "doc_type": "policy",
                "published": true,
                "priority": 2,
                "quality_score": 0.91
            }),
        },
        RawRecord {
            id: "doc-2".to_string(),
            document: "FAQ for account lockouts.".to_string(),
            embedding: vec![0.2, 0.3, 0.4],
            metadata: json!({
                "tenant_id": "acme",
                "doc_type": "faq",
                "published": true,
                "priority": 9,
                "quality_score": 0.70
            }),
        },
        RawRecord {
            id: "doc-3".to_string(),
            document: "Runbook for SSO outage response.".to_string(),
            embedding: vec![0.3, 0.4, 0.5],
            metadata: json!({
                "tenant_id": "",
                "doc_type": "runbook",
                "published": false,
                "priority": 1,
                "quality_score": 0.88
            }),
        },
    ];

    let mut inserted_ids: Vec<String> = Vec::new();

    for record in &raw_records {
        let inserted = insert_validated_record(&collection, record).await?;
        if inserted.is_none() {
            continue;
        }

        inserted_ids.push(record.id.clone());
        let parsed = read_validated_record(&collection, &record.id).await?;
        println!("read {} -> {:?}", record.id, parsed);
    }

    if inserted_ids.is_empty() {
        return Err(io_error("no records passed schema validation").into());
    }

    let query_response = collection
        .query(
            vec![vec![0.1, 0.2, 0.3]],
            Some(3),
            Some(eq_str("tenant_id", "acme")),
            None,
            None,
        )
        .await?;

    println!("query ids: {:?}", query_response.ids);

    if let Some(raw_metadata) = query_response
        .metadatas
        .as_ref()
        .and_then(|groups| groups.first())
        .and_then(|group| group.first())
        .and_then(|item| item.as_ref())
    {
        let parsed = parse_metadata_from_chroma(raw_metadata)?;
        println!("query top metadata (typed): {:?}", parsed);
    }

    Ok(())
}
