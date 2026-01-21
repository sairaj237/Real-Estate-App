#!/bin/bash

# AWS EKS Cluster Creation Script
# Make sure you have AWS CLI and eksctl installed

set -e

# Configuration
CLUSTER_NAME="real-estate-cluster"
REGION="us-east-1"
NODE_GROUP_NAME="real-estate-nodes"
NODE_TYPE="t3.medium"
NODES_MIN=2
NODES_MAX=4
NODES_DESIRED=2

echo "Creating EKS cluster: $CLUSTER_NAME"

# Create EKS cluster
eksctl create cluster \
  --name $CLUSTER_NAME \
  --region $REGION \
  --nodegroup-name $NODE_GROUP_NAME \
  --node-type $NODE_TYPE \
  --nodes $NODES_DESIRED \
  --nodes-min $NODES_MIN \
  --nodes-max $NODES_MAX \
  --managed \
  --with-oidc \
  --ssh-access \
  --ssh-public-key ~/.ssh/id_rsa.pub

# Update kubeconfig
aws eks update-kubeconfig --region $REGION --name $CLUSTER_NAME

# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/aws/deploy.yaml

# Install cert-manager for SSL certificates
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.2/cert-manager.yaml

# Wait for ingress controller to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

echo "EKS cluster created successfully!"
echo "Cluster name: $CLUSTER_NAME"
echo "Region: $REGION"