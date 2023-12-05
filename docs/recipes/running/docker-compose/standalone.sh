##!/bin/bash

# Step 1: Create docker-compose.yml
cat << EOF > docker-compose.yml
version: '3.9'

networks:
  net:
    driver: bridge

services:
  server:
    image: chromadb/chroma:latest
    volumes:
      - ./chroma:/chroma/chroma
    command: uvicorn chromadb.app:app --reload --workers 1 --host 0.0.0.0 --port 8000 --timeout-keep-alive 30
    environment:
      - IS_PERSISTENT=TRUE
      - ALLOW_RESET=TRUE
      - CHROMA_SERVER_AUTH_PROVIDER=${CHROMA_SERVER_AUTH_PROVIDER}
      - CHROMA_SERVER_AUTH_CREDENTIALS_FILE=${CHROMA_SERVER_AUTH_CREDENTIALS_FILE}
      - CHROMA_SERVER_AUTH_CREDENTIALS_PROVIDER=${CHROMA_SERVER_AUTH_CREDENTIALS_PROVIDER}
    ports:
      - 8000:8000
    networks:
      - net
EOF

# Step 2: Run docker-compose
docker-compose up -d

# Step 3: Wait for the service to start
echo "⏳ Waiting for the service to start..."
sleep 10

# Step 4: Test the open port with curl
echo "Testing the open port with curl..."
curl -v http://localhost:8000/api/v1/version

# Step 5: if the last command executed successully print success and terminate docker-compose
if [ $? -eq 0 ]; then
    echo "✅ Success!"
    docker-compose down --rmi --volumes --remove-orphans
else
    echo "❌ Failed!"
fi
