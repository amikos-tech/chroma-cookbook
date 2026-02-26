//! Chroma keyword search example using document filters and vector search.
//!
//! Requires a running Chroma server:
//!     docker run --rm -p 8000:8000 chromadb/chroma:1.5.1

use chroma::client::ChromaHttpClientOptions;
use chroma::types::{
    BooleanOperator, CompositeExpression, DocumentExpression, DocumentOperator, Metadata, Where,
};
use chroma::ChromaHttpClient;
use url::Url;

fn author_metadata(author: &str) -> Option<Metadata> {
    let mut metadata = Metadata::new();
    metadata.insert("author".into(), author.into());
    Some(metadata)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = ChromaHttpClient::new(ChromaHttpClientOptions {
        endpoint: Url::parse("http://localhost:8000")?,
        ..Default::default()
    });

    let collection_name = "keyword_search_demo_rust";

    let _ = client.delete_collection(collection_name).await;
    let collection = client
        .get_or_create_collection(collection_name, None, None)
        .await?;

    collection
        .add(
            vec!["1".into(), "2".into(), "3".into()],
            vec![vec![0.1, 0.8, 0.3], vec![0.2, 0.9, 0.2], vec![0.9, 0.1, 0.1]],
            Some(vec![
                Some("He is a technology freak and he loves AI topics".into()),
                Some("AI technology are advancing at a fast pace".into()),
                Some("Innovation in LLMs is a hot topic".into()),
            ]),
            None,
            Some(vec![
                author_metadata("John Doe"),
                author_metadata("Jane Doe"),
                author_metadata("John Doe"),
            ]),
        )
        .await?;

    let where_clause = Where::Composite(CompositeExpression {
        operator: BooleanOperator::Or,
        children: vec![
            Where::Document(DocumentExpression {
                operator: DocumentOperator::Contains,
                pattern: "technology".to_string(),
            }),
            Where::Document(DocumentExpression {
                operator: DocumentOperator::Contains,
                pattern: "freak".to_string(),
            }),
        ],
    });

    let contains_results = collection
        .query(
            vec![vec![0.15, 0.85, 0.25]],
            Some(3),
            Some(where_clause),
            None,
            None,
        )
        .await?;

    println!("contains/or ids: {:?}", contains_results.ids);
    println!("contains/or documents: {:?}", contains_results.documents);
    println!("contains/or metadatas: {:?}", contains_results.metadatas);

    let regex_results = collection
        .query(
            vec![vec![0.15, 0.85, 0.25]],
            Some(3),
            Some(Where::Document(DocumentExpression {
                operator: DocumentOperator::Regex,
                pattern: "technology.*pace".to_string(),
            })),
            None,
            None,
        )
        .await?;
    println!("regex ids: {:?}", regex_results.ids);
    println!("regex documents: {:?}", regex_results.documents);
    println!("regex metadatas: {:?}", regex_results.metadatas);

    let not_regex_results = collection
        .query(
            vec![vec![0.15, 0.85, 0.25]],
            Some(3),
            Some(Where::Document(DocumentExpression {
                operator: DocumentOperator::NotRegex,
                pattern: "Innovation.*topic".to_string(),
            })),
            None,
            None,
        )
        .await?;
    println!("not_regex ids: {:?}", not_regex_results.ids);
    println!("not_regex documents: {:?}", not_regex_results.documents);
    println!("not_regex metadatas: {:?}", not_regex_results.metadatas);

    client.delete_collection(collection_name).await?;
    println!("\nrust: keyword search example passed");

    Ok(())
}
