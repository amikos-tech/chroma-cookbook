//! Chroma filtering examples - metadata filters, document filters, and pagination.
//!
//! Metadata filters use the query()/get() API (works with any Chroma server).
//! Document filters use the Search API (requires Chroma Cloud).
//!
//! Requires a running Chroma server: chroma run

use chroma::client::ChromaHttpClientOptions;
use chroma::types::{
    BooleanOperator, CompositeExpression, Metadata, MetadataComparison, MetadataExpression,
    MetadataSetValue, MetadataValue, PrimitiveOperator, SetOperator, Where,
};
use chroma::ChromaHttpClient;
use url::Url;

fn eq_str(key: &str, value: &str) -> Where {
    Where::Metadata(MetadataExpression {
        key: key.to_string(),
        comparison: MetadataComparison::Primitive(
            PrimitiveOperator::Equal,
            MetadataValue::Str(value.to_string()),
        ),
    })
}

fn ne_str(key: &str, value: &str) -> Where {
    Where::Metadata(MetadataExpression {
        key: key.to_string(),
        comparison: MetadataComparison::Primitive(
            PrimitiveOperator::NotEqual,
            MetadataValue::Str(value.to_string()),
        ),
    })
}

fn gt_int(key: &str, value: i64) -> Where {
    Where::Metadata(MetadataExpression {
        key: key.to_string(),
        comparison: MetadataComparison::Primitive(
            PrimitiveOperator::GreaterThan,
            MetadataValue::Int(value),
        ),
    })
}

fn gte_int(key: &str, value: i64) -> Where {
    Where::Metadata(MetadataExpression {
        key: key.to_string(),
        comparison: MetadataComparison::Primitive(
            PrimitiveOperator::GreaterThanOrEqual,
            MetadataValue::Int(value),
        ),
    })
}

fn lt_int(key: &str, value: i64) -> Where {
    Where::Metadata(MetadataExpression {
        key: key.to_string(),
        comparison: MetadataComparison::Primitive(
            PrimitiveOperator::LessThan,
            MetadataValue::Int(value),
        ),
    })
}

fn lte_int(key: &str, value: i64) -> Where {
    Where::Metadata(MetadataExpression {
        key: key.to_string(),
        comparison: MetadataComparison::Primitive(
            PrimitiveOperator::LessThanOrEqual,
            MetadataValue::Int(value),
        ),
    })
}

fn in_str(key: &str, values: &[&str]) -> Where {
    Where::Metadata(MetadataExpression {
        key: key.to_string(),
        comparison: MetadataComparison::Set(
            SetOperator::In,
            MetadataSetValue::Str(values.iter().map(|v| v.to_string()).collect()),
        ),
    })
}

fn nin_str(key: &str, values: &[&str]) -> Where {
    Where::Metadata(MetadataExpression {
        key: key.to_string(),
        comparison: MetadataComparison::Set(
            SetOperator::NotIn,
            MetadataSetValue::Str(values.iter().map(|v| v.to_string()).collect()),
        ),
    })
}

fn and(clauses: Vec<Where>) -> Where {
    Where::Composite(CompositeExpression {
        operator: BooleanOperator::And,
        children: clauses,
    })
}

fn or(clauses: Vec<Where>) -> Where {
    Where::Composite(CompositeExpression {
        operator: BooleanOperator::Or,
        children: clauses,
    })
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = ChromaHttpClient::new(ChromaHttpClientOptions {
        endpoint: Url::parse("http://localhost:8000")?,
        ..Default::default()
    });

    // Clean up if exists
    let _ = client.delete_collection("filter_demo").await;

    let collection = client
        .get_or_create_collection("filter_demo", None, None)
        .await?;

    // Seed data
    let embeds = vec![
        vec![0.1, 0.2, 0.3],
        vec![0.4, 0.5, 0.6],
        vec![0.7, 0.8, 0.9],
        vec![0.2, 0.3, 0.4],
    ];

    let documents = vec![
        Some("Machine learning is transforming healthcare diagnostics.".into()),
        Some("Quantum computing may revolutionize cryptography.".into()),
        Some("Renewable energy adoption is accelerating worldwide.".into()),
        Some("Deep learning models require large datasets for training.".into()),
    ];

    let metadatas: Vec<Option<Metadata>> = vec![
        {
            let mut m = Metadata::new();
            m.insert("category".into(), "ml".into());
            m.insert("year".into(), MetadataValue::Int(2024));
            m.insert("citations".into(), MetadataValue::Int(150));
            Some(m)
        },
        {
            let mut m = Metadata::new();
            m.insert("category".into(), "quantum".into());
            m.insert("year".into(), MetadataValue::Int(2023));
            m.insert("citations".into(), MetadataValue::Int(80));
            Some(m)
        },
        {
            let mut m = Metadata::new();
            m.insert("category".into(), "energy".into());
            m.insert("year".into(), MetadataValue::Int(2024));
            m.insert("citations".into(), MetadataValue::Int(45));
            Some(m)
        },
        {
            let mut m = Metadata::new();
            m.insert("category".into(), "ml".into());
            m.insert("year".into(), MetadataValue::Int(2022));
            m.insert("citations".into(), MetadataValue::Int(300));
            Some(m)
        },
    ];

    collection
        .add(
            vec!["doc-1".into(), "doc-2".into(), "doc-3".into(), "doc-4".into()],
            embeds,
            Some(documents),
            None,
            Some(metadatas),
        )
        .await?;

    let query_emb = vec![vec![0.1, 0.2, 0.3]];

    // --- Metadata Filters (using get/query API) ---

    // Equality ($eq)
    let r = collection.get(None, Some(eq_str("category", "ml")), None, None, None).await?;
    println!("$eq: {:?}", r.ids);

    // Inequality ($ne)
    let r = collection.get(None, Some(ne_str("category", "ml")), None, None, None).await?;
    println!("$ne: {:?}", r.ids);

    // Greater than ($gt)
    let r = collection.get(None, Some(gt_int("citations", 100)), None, None, None).await?;
    println!("$gt: {:?}", r.ids);

    // Greater than or equal ($gte)
    let r = collection.get(None, Some(gte_int("year", 2024)), None, None, None).await?;
    println!("$gte: {:?}", r.ids);

    // Less than ($lt)
    let r = collection.get(None, Some(lt_int("citations", 100)), None, None, None).await?;
    println!("$lt: {:?}", r.ids);

    // Less than or equal ($lte)
    let r = collection.get(None, Some(lte_int("year", 2023)), None, None, None).await?;
    println!("$lte: {:?}", r.ids);

    // In ($in)
    let r = collection.get(None, Some(in_str("category", &["ml", "quantum"])), None, None, None).await?;
    println!("$in: {:?}", r.ids);

    // Not in ($nin)
    let r = collection.get(None, Some(nin_str("category", &["ml", "quantum"])), None, None, None).await?;
    println!("$nin: {:?}", r.ids);

    // --- Logical Operators ---

    // AND
    let r = collection
        .get(None, Some(and(vec![eq_str("category", "ml"), gte_int("year", 2024)])), None, None, None)
        .await?;
    println!("$and: {:?}", r.ids);

    // OR
    let r = collection
        .get(None, Some(or(vec![eq_str("category", "quantum"), eq_str("category", "energy")])), None, None, None)
        .await?;
    println!("$or: {:?}", r.ids);

    // Nested
    let r = collection
        .get(
            None,
            Some(and(vec![
                gte_int("year", 2023),
                or(vec![eq_str("category", "ml"), eq_str("category", "quantum")]),
            ])),
            None, None, None,
        )
        .await?;
    println!("nested: {:?}", r.ids);

    // --- Query with metadata filter ---
    let r = collection
        .query(query_emb.clone(), Some(4), Some(eq_str("category", "ml")), None, None)
        .await?;
    println!("query + metadata: {:?}", r.ids);

    // --- Pagination ---
    let page1 = collection.get(None, None, Some(2), Some(0), None).await?;
    println!("page 1: {:?}", page1.ids);

    let page2 = collection.get(None, None, Some(2), Some(2), None).await?;
    println!("page 2: {:?}", page2.ids);

    // --- Document Filters (Search API - requires Chroma Cloud) ---
    // The Search API provides document filtering via Key::Document
    // Uncomment these to test against Chroma Cloud:

    // let knn = || RankExpr::Knn {
    //     query: QueryVector::Dense(vec![0.1, 0.2, 0.3]),
    //     key: Key::Embedding,
    //     limit: 10,
    //     default: None,
    //     return_rank: false,
    // };
    //
    // // $contains
    // let r = collection.search(vec![
    //     SearchPayload::default()
    //         .r#where(Key::Document.contains("learning"))
    //         .rank(knn())
    //         .limit(Some(4), 0),
    // ]).await?;
    // println!("doc $contains: {:?}", r.ids[0]);
    //
    // // $regex
    // let r = collection.search(vec![
    //     SearchPayload::default()
    //         .r#where(Key::Document.regex("learning.*training"))
    //         .rank(knn())
    //         .limit(Some(4), 0),
    // ]).await?;
    // println!("doc $regex: {:?}", r.ids[0]);
    //
    // // Combined metadata + document
    // let r = collection.search(vec![
    //     SearchPayload::default()
    //         .r#where(
    //             (Key::field("category").eq("ml")) & (Key::Document.contains("learning")),
    //         )
    //         .rank(knn())
    //         .limit(Some(4), 0),
    // ]).await?;
    // println!("combined metadata + doc: {:?}", r.ids[0]);

    // Cleanup
    client.delete_collection("filter_demo").await?;
    println!("\nrust: all filter examples passed");

    Ok(())
}
