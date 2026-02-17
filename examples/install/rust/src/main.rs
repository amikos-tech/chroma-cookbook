use chroma::{ChromaHttpClient, ChromaHttpClientOptions};

#[tokio::main]
async fn main() {
    let client = ChromaHttpClient::new(ChromaHttpClientOptions::default());
    let heartbeat = client.heartbeat().await.expect("heartbeat failed");
    println!("rust: ok (heartbeat {})", heartbeat.nanosecond_heartbeat);
}
