//! Chroma collection examples - CRUD, iteration, and query patterns.
//!
//! Requires a running Chroma server:
//!     docker run -p 8000:8000 chromadb/chroma

use chroma::client::ChromaHttpClientOptions;
use chroma::types::{
    Metadata, MetadataComparison, MetadataExpression, MetadataValue, PrimitiveOperator, Where,
};
use chroma::ChromaHttpClient;
use url::Url;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = ChromaHttpClient::new(ChromaHttpClientOptions {
        endpoint: Url::parse("http://localhost:8000")?,
        ..Default::default()
    });

    let mut cleanup: Vec<String> = Vec::new();
    let mut track = |name: &str| {
        cleanup.push(name.to_string());
    };

    // Clean up from previous runs
    for name in &[
        "create_basic",
        "get_or_create",
        "delete_records",
        "delete_me",
        "results_demo",
    ] {
        let _ = client.delete_collection(name).await;
    }

    // ── Create Collection ──

    track("create_basic");
    let collection = client
        .get_or_create_collection("create_basic", None, None)
        .await?;
    println!(
        "created: create_basic (count={})",
        collection.count().await?
    );

    // ── Get or Create Collection ──

    track("get_or_create");
    let collection = client
        .get_or_create_collection("get_or_create", None, None)
        .await?;
    println!("get_or_create: get_or_create");
    let _ = collection;

    // ── List Collections ──

    let collections = client.list_collections(100, None).await?;
    let names: Vec<&str> = collections.iter().map(|c| c.name()).collect();
    println!("all collections: {:?}", names);

    // with pagination
    let collections = client.list_collections(10, Some(0)).await?;
    let names: Vec<&str> = collections.iter().map(|c| c.name()).collect();
    println!("paginated (limit=10): {:?}", names);

    // ── Get a Collection ──

    let fetched = client.get_collection("create_basic").await?;
    println!("get: {}", fetched.name());

    // ── Delete Records ──

    track("delete_records");
    let delete_col = client
        .get_or_create_collection("delete_records", None, None)
        .await?;

    let delete_ids = vec![
        "del-1".to_string(),
        "del-2".to_string(),
        "del-3".to_string(),
    ];
    let delete_documents = vec![
        Some("draft note one".to_string()),
        Some("draft note two".to_string()),
        Some("published note".to_string()),
    ];
    let delete_embeddings = vec![
        vec![0.11, 0.12, 0.13],
        vec![0.21, 0.22, 0.23],
        vec![0.31, 0.32, 0.33],
    ];
    let delete_metadatas = vec![
        {
            let mut m = Metadata::new();
            m.insert("status".into(), "draft".into());
            m.insert("category".into(), "a".into());
            Some(m)
        },
        {
            let mut m = Metadata::new();
            m.insert("status".into(), "draft".into());
            m.insert("category".into(), "a".into());
            Some(m)
        },
        {
            let mut m = Metadata::new();
            m.insert("status".into(), "published".into());
            m.insert("category".into(), "b".into());
            Some(m)
        },
    ];

    delete_col
        .add(
            delete_ids,
            delete_embeddings,
            Some(delete_documents),
            None,
            Some(delete_metadatas),
        )
        .await?;

    // This example crate is currently locked to chroma 0.13.0, which exposes
    // delete(ids, where) but not limit/deleted-count yet.
    delete_col
        .delete(
            None,
            Some(Where::Metadata(MetadataExpression {
                key: "status".to_string(),
                comparison: MetadataComparison::Primitive(
                    PrimitiveOperator::Equal,
                    MetadataValue::Str("draft".to_string()),
                ),
            })),
        )
        .await?;
    assert_eq!(delete_col.count().await?, 1);
    println!("delete records remaining: {}", delete_col.count().await?);

    // ── Delete Collection ──

    track("delete_me");
    let _ = client
        .get_or_create_collection("delete_me", None, None)
        .await?;
    client.delete_collection("delete_me").await?;
    println!("deleted: delete_me");

    // ── Query and Get Results ──

    track("results_demo");
    let res_col = client
        .get_or_create_collection("results_demo", None, None)
        .await?;

    // Seed data
    let ids: Vec<String> = (0..20).map(|i| format!("doc-{i}")).collect();
    let documents: Vec<Option<String>> = (0..20)
        .map(|i| Some(format!("document about topic {}", i % 5)))
        .collect();
    let metadatas: Vec<Option<Metadata>> = (0..20)
        .map(|i| {
            let mut m = Metadata::new();
            m.insert("page".into(), (i as i64).into());
            m.insert("category".into(), format!("cat-{}", i % 3).into());
            Some(m)
        })
        .collect();
    let embeddings: Vec<Vec<f32>> = (0..20)
        .map(|i| vec![i as f32 * 0.1, i as f32 * 0.2, i as f32 * 0.3])
        .collect();

    res_col
        .add(
            ids,
            embeddings.clone(),
            Some(documents),
            None,
            Some(metadatas),
        )
        .await?;

    // GET: index-based iteration
    let get_result = res_col.get(None, None, Some(20), Some(0), None).await?;
    for (i, id) in get_result.ids.iter().enumerate() {
        let doc = get_result
            .documents
            .as_ref()
            .and_then(|docs| docs.get(i))
            .and_then(|doc| doc.as_deref());
        let _ = (id, doc); // process each record
    }
    println!("get iteration: {} records", get_result.ids.len());

    // QUERY: nested iteration
    let query_result = res_col
        .query(vec![vec![0.1, 0.2, 0.3]], Some(3), None, None, None)
        .await?;
    for (i, ids) in query_result.ids.iter().enumerate() {
        println!("  query {i} has {} neighbors", ids.len());
    }
    for (query_index, ids) in query_result.ids.iter().enumerate() {
        for (rank, id) in ids.iter().enumerate() {
            let distance = query_result
                .distances
                .as_ref()
                .and_then(|groups| groups.get(query_index))
                .and_then(|group| group.get(rank))
                .and_then(|v| *v);
            println!("  query={query_index} rank={rank} id={id} distance={distance:?}");
        }
    }

    // ── Constrain Query Candidates By ID ──

    let constrained = res_col
        .query(
            vec![vec![0.1, 0.2, 0.3]],
            Some(3),
            None,
            Some(vec![
                "doc-1".to_string(),
                "doc-2".to_string(),
                "doc-3".to_string(),
            ]),
            None,
        )
        .await?;
    println!(
        "constrained query returned {} results (max 3 from 3 candidates)",
        constrained.ids[0].len()
    );

    // ── Cleanup ──

    for name in &cleanup {
        let _ = client.delete_collection(name).await;
    }

    println!("\nrust: all collection examples passed");
    Ok(())
}
