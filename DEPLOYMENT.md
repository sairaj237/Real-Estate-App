# Real Estate App - AWS Deployment Guide

## Architecture Overview

```
GitHub → Jenkins → DockerHub → AWS EKS → LoadBalancer → Users
```

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **DockerHub Account**
3. **Domain name** (optional, for custom domain)
4. **AWS CLI, kubectl, eksctl** installed locally

## Step-by-Step Deployment

### 1. Setup AWS Infrastructure

```bash
# Make script executable
chmod +x aws/create-eks-cluster.sh

# Create EKS cluster (takes 15-20 minutes)
./aws/create-eks-cluster.sh
```

### 2. Configure Secrets

```bash
# Make script executable
chmod +x aws/setup-secrets.sh

# Setup Kubernetes secrets
./aws/setup-secrets.sh
```

### 3. Update Configuration Files

#### Update Jenkinsfile
- Replace `your-dockerhub-username` with your DockerHub username
- Update AWS region and EKS cluster name if different

#### Update Kubernetes manifests
- Replace `your-domain.com` in `k8s/ingress.yaml` with your domain
- Update resource limits based on your needs

#### Update Frontend Environment
```bash
# Update frontend/.env.production
echo "VITE_API_URL=https://your-domain.com" > frontend/.env.production
```

### 4. Setup Jenkins

Follow instructions in `jenkins/setup-jenkins.md`

### 5. Deploy Application

#### Option A: Using Jenkins Pipeline
1. Push code to GitHub
2. Jenkins will automatically build and deploy

#### Option B: Manual Deployment
```bash
# Build and push images
docker build -t your-username/real-estate-backend:latest ./backend
docker build -t your-username/real-estate-frontend:latest ./frontend

docker push your-username/real-estate-backend:latest
docker push your-username/real-estate-frontend:latest

# Deploy to Kubernetes
kubectl apply -f k8s/
```

### 6. Access Application

```bash
# Get LoadBalancer URL
kubectl get service real-estate-frontend-service -n real-estate-app

# Or if using Ingress
kubectl get ingress real-estate-ingress -n real-estate-app
```

## Monitoring and Maintenance

### Check Application Status
```bash
# Check pods
kubectl get pods -n real-estate-app

# Check services
kubectl get services -n real-estate-app

# Check logs
kubectl logs -f deployment/real-estate-backend -n real-estate-app
kubectl logs -f deployment/real-estate-frontend -n real-estate-app
```

### Scaling
```bash
# Scale backend
kubectl scale deployment real-estate-backend --replicas=3 -n real-estate-app

# Scale frontend
kubectl scale deployment real-estate-frontend --replicas=2 -n real-estate-app
```

### Updates
```bash
# Rolling update
kubectl set image deployment/real-estate-backend backend=your-username/real-estate-backend:new-tag -n real-estate-app
```

## Cost Optimization

1. **Use Spot Instances** for worker nodes
2. **Enable Cluster Autoscaler**
3. **Set appropriate resource limits**
4. **Use Horizontal Pod Autoscaler**

## Security Considerations

1. **Network Policies** for pod-to-pod communication
2. **RBAC** for service accounts
3. **Secrets management** with AWS Secrets Manager
4. **Image scanning** in CI/CD pipeline
5. **SSL/TLS** certificates with cert-manager

## Troubleshooting

### Common Issues

1. **Pods not starting:** Check resource limits and node capacity
2. **LoadBalancer pending:** Check AWS permissions and VPC configuration
3. **Image pull errors:** Verify DockerHub credentials
4. **Database connection:** Check MongoDB URI and network policies

### Useful Commands
```bash
# Describe pod for detailed info
kubectl describe pod <pod-name> -n real-estate-app

# Get events
kubectl get events -n real-estate-app --sort-by='.lastTimestamp'

# Port forward for debugging
kubectl port-forward service/real-estate-backend-service 3000:3000 -n real-estate-app
```