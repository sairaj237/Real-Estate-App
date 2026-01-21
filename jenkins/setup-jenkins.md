# Jenkins Setup for Real Estate App CI/CD

## Prerequisites

1. **Jenkins Server** (EC2 instance or EKS pod)
2. **Required Plugins:**
   - Docker Pipeline
   - Kubernetes CLI
   - AWS Steps
   - Pipeline: Stage View
   - Blue Ocean (optional)

## Installation Steps

### 1. Install Jenkins on EC2

```bash
# Update system
sudo yum update -y

# Install Java
sudo yum install -y java-11-openjdk

# Add Jenkins repository
sudo wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io.key

# Install Jenkins
sudo yum install -y jenkins

# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker jenkins

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins
```

### 2. Configure Jenkins

1. **Access Jenkins:** `http://your-ec2-ip:8080`
2. **Get initial password:** `sudo cat /var/lib/jenkins/secrets/initialAdminPassword`
3. **Install suggested plugins**
4. **Create admin user**

### 3. Add Credentials

Go to **Manage Jenkins > Manage Credentials > Global**

#### DockerHub Credentials
- **Kind:** Username with password
- **ID:** `dockerhub-credentials`
- **Username:** Your DockerHub username
- **Password:** Your DockerHub password/token

#### AWS Credentials
- **Kind:** AWS Credentials
- **ID:** `aws-credentials`
- **Access Key ID:** Your AWS Access Key
- **Secret Access Key:** Your AWS Secret Key

#### Kubeconfig
- **Kind:** Secret file
- **ID:** `kubeconfig`
- **File:** Upload your kubeconfig file

### 4. Create Pipeline Job

1. **New Item > Pipeline**
2. **Pipeline Definition:** Pipeline script from SCM
3. **SCM:** Git
4. **Repository URL:** Your GitHub repository
5. **Script Path:** `Jenkinsfile`

## Environment Variables to Update

Update these in your `Jenkinsfile`:

```groovy
DOCKERHUB_USERNAME = 'your-dockerhub-username'
AWS_REGION = 'us-east-1'
EKS_CLUSTER_NAME = 'real-estate-cluster'
```

## Security Best Practices

1. **Use IAM roles** instead of access keys when possible
2. **Rotate credentials** regularly
3. **Use least privilege** principle for AWS permissions
4. **Enable Jenkins security** features
5. **Use HTTPS** for Jenkins access