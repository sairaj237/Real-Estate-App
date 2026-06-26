# Real Estate App

A full-stack **Real Estate Platform** built using the **MERN Stack**, deployed on **AWS EKS (Kubernetes)** with an automated **CI/CD pipeline using Jenkins**, **Docker**, **Amazon ECR**, and **Redis caching** for improved API performance.

![alt text](architecture.png)

## What this project does

- React/Vite frontend
- Node.js/Express backend
- MongoDB as source of truth
- Redis as read-through cache for listing reads
- AWS EKS for Kubernetes deployment
- Jenkins on EC2 for build and deploy automation
- AWS ECR for Docker images
- AWS ALB Ingress for public access

## Architecture

```text
GitHub
  ↓
Jenkins EC2 (jenkins-ec2-role)
  ↓
Build Docker images
  ↓
AWS ECR
  ↓
AWS EKS
  ├── frontend pods
  ├── backend pods
  └── redis pod + service
        ↓
     MongoDB Atlas

Users
  ↓
AWS ALB / Ingress
  ├── /      → frontend service → frontend pods
  └── /api   → backend service  → backend pods
```

## Repo layout

```text
Real-Estate-App/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   └── nginx.conf
├── k8s/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── redis.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   └── backend-ingress.yaml
└── Jenkinsfile
```

## Key implementation details

### Frontend
- In production, frontend calls backend using relative `/api` paths.
- Do not use `localhost:3000` in production builds.
- Frontend is served by Nginx inside a container.

### Backend
- Route files only define endpoints.
- Controllers handle HTTP request/response.
- Services handle MongoDB and Redis logic.
- Redis is used as a cache for listing reads.

### Redis
- Redis runs as a pod inside the EKS cluster.
- Data stays in RAM.
- TTL is used so cached entries expire automatically.
- Write operations clear listing cache so old results are not served.

### MongoDB
- MongoDB is the source of truth.
- Redis is only a cache layer.

## Redis behavior in this project

### Read flow
1. Request hits `getListingService` or `getListingsService`
2. Redis is checked first
3. Cache hit: data returns from Redis
4. Cache miss: data is read from MongoDB and stored in Redis with TTL

### Write flow
1. Create / update / delete happens in MongoDB
2. Listing cache is cleared
3. Next read rebuilds cache from fresh MongoDB data

### Cache visibility
The backend returns:
- `X-Cache: HIT`
- `X-Cache: MISS`

This makes Redis behavior visible in browser devtools and `curl -i`.

## Main backend files

### `backend/utils/redis.js`
Creates the Redis client.

### `backend/services/listing.service.js`
Contains:
- `getListingService`
- `getListingsService`
- `createListingService`
- `updateListingService`
- `deleteListingService`
- `clearListingCache`

This is where Redis caching lives.

### `backend/controllers/listing.controller.js`
Contains thin controller handlers:
- `createListing`
- `deleteListing`
- `updateListing`
- `getListing`
- `getListings`

Controllers call services and set `X-Cache` headers.

### `backend/routes/listing.route.js`
Only defines routes:
- `POST /create`
- `DELETE /delete/:id`
- `POST /update/:id`
- `GET /get/:id`
- `GET /get`

## AWS setup from scratch

### 1. Create ECR repositories
Create these repositories in us-east-1:
- `realestate-backend`
- `realestate-frontend`

### 2. Create EKS cluster
Create a cluster named:
- `realestate-cluster`

Create a managed nodegroup named:
- `workers`

### 3. Create Jenkins EC2
Use a separate EC2 instance for Jenkins.

Install:
- Docker
- AWS CLI
- kubectl
- eksctl
- Jenkins

### 4. Create Jenkins IAM role
Attach an IAM role to the Jenkins EC2 instance.

Role name used in this project:
- `jenkins-ec2-role`

This role needs AWS access for:
- ECR login and image push
- EKS kubeconfig and deployment updates

### 5. Add EKS access entry
Add `jenkins-ec2-role` as an EKS access entry and grant cluster admin access.

This allows Jenkins to run `kubectl` against the cluster.

### 6. Configure Jenkins credentials
Use GitHub PAT for repository checkout.

Do not use AWS access keys in Jenkins if the EC2 instance already has an IAM role.

### 7. Create Kubernetes resources
Apply these once:
- `namespace.yaml`
- `configmap.yaml`
- `secrets.yaml`
- `redis.yaml`
- backend and frontend deployments
- backend and frontend services
- ingress

Do not commit secret values to GitHub.

### 8. Run Jenkins pipeline
The pipeline:
- checks out code from GitHub
- builds backend and frontend images
- pushes images to ECR
- waits for manual approval
- updates Kubernetes deployments
- waits for rollout status

## Jenkinsfile behavior

The pipeline is configured to:
- use the `production` branch
- build images from `backend/` and `frontend/`
- push to ECR
- deploy to EKS
- avoid a second manual checkout stage

Important:
- Do not re-apply `secrets.yaml` inside the pipeline
- Secrets are created once and managed separately

## Kubernetes config used here

### `configmap.yaml`
Contains:
- `NODE_ENV`
- `PINECONE_ENVIRONMENT`
- `PINECONE_INDEX`
- `REDIS_HOST=redis`
- `REDIS_PORT=6379`

### `secrets.yaml`
Contains secret values for:
- `MONGO_URI`
- `JWT_SECRET`
- `PINECONE_API_KEY`
- `OPENAI_API_KEY`
- `OPENROUTER_API_KEY`

Keep this file local or manage it separately. Do not push secrets to GitHub.

### `redis.yaml`
Deploys Redis as:
- a Redis pod
- a ClusterIP service named `redis`

The backend resolves Redis by service name inside the cluster.

## Local development

### Start app locally
From the repo root:

```bash
npm run dev
```

This runs backend and frontend together.

### Local Redis for development
If you want Redis locally, run it with Docker and set:

- `REDIS_HOST=localhost`
- `REDIS_PORT=6379`

The backend Redis client uses environment variables first, then falls back to `redis` for Kubernetes.

## Testing Redis

### Check cache behavior with curl
Run the same request twice:

```bash
curl "http://<ALB-DNS>/api/listing/get?limit=2"
curl "http://<ALB-DNS>/api/listing/get?limit=2"
```

Expected:
- first call: `X-Cache: MISS`
- second call: `X-Cache: HIT`

### Check backend logs
You should see:
- `❄️ Redis MISS`
- `🔥 Redis HIT`

### Check Redis keys
Inside the Redis pod:

```bash
redis-cli KEYS listings:*
redis-cli TTL "listings:{...}"
```

## Shutdown and restart flow

### Turn off to save cost
- Scale EKS nodegroup to 0
- Stop Jenkins EC2

### Turn back on
- Start Jenkins EC2
- Scale EKS nodegroup back to 2

Deployments, services, ingress, configmaps, and secrets stay in the cluster. Pods are recreated when nodes come back.

## Notes from this implementation

- Frontend production API calls must use `/api`, not `localhost:3000`.
- Redis is RAM-based and non-persistent here.
- TTL is used to avoid stale cache.
- Cache invalidation happens on listing writes.
- `X-Cache` header is used for debugging.
- Ingress routes `/` to frontend and `/api` to backend.

## Useful commands

```bash
kubectl get pods -n real-estate-app
kubectl get svc -n real-estate-app
kubectl get ingress -n real-estate-app
kubectl logs -f deployment/real-estate-backend -n real-estate-app
kubectl exec -it redis-<pod> -n real-estate-app -- redis-cli
```
