#!/bin/bash

# Script to encode and setup Kubernetes secrets
# Run this script to generate base64 encoded secrets for k8s/secrets.yaml

echo "=== Kubernetes Secrets Setup ==="
echo "Please provide your secrets (they will be base64 encoded):"

read -p "MongoDB URI: " MONGO_URI
read -s -p "JWT Secret: " JWT_SECRET
echo
read -s -p "Pinecone API Key: " PINECONE_API_KEY
echo
read -s -p "OpenAI API Key: " OPENAI_API_KEY
echo

# Encode secrets
MONGO_URI_B64=$(echo -n "$MONGO_URI" | base64)
JWT_SECRET_B64=$(echo -n "$JWT_SECRET" | base64)
PINECONE_API_KEY_B64=$(echo -n "$PINECONE_API_KEY" | base64)
OPENAI_API_KEY_B64=$(echo -n "$OPENAI_API_KEY" | base64)

# Update secrets.yaml file
cat > k8s/secrets.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: real-estate-secrets
  namespace: real-estate-app
type: Opaque
data:
  MONGO_URI: $MONGO_URI_B64
  JWT_SECRET: $JWT_SECRET_B64
  PINECONE_API_KEY: $PINECONE_API_KEY_B64
  OPENAI_API_KEY: $OPENAI_API_KEY_B64
EOF

echo "✅ Secrets have been encoded and saved to k8s/secrets.yaml"
echo "⚠️  Keep this file secure and do not commit it to version control!"

# Apply secrets to cluster
read -p "Do you want to apply secrets to the cluster now? (y/n): " apply_secrets
if [ "$apply_secrets" = "y" ]; then
    kubectl apply -f k8s/secrets.yaml
    echo "✅ Secrets applied to Kubernetes cluster"
fi