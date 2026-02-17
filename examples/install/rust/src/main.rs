use chroma::ChromaHttpClient;

#[tokio::main]
async fn main() {
    let client = ChromaHttpClient::new_default().expect("failed to create client");
    let heartbeat = client.heartbeat().await;
    assert!(heartbeat.is_ok());
    println!("rust: ok");
}
