pipeline {
    agent any
    
    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKERHUB_USERNAME = 'your-dockerhub-username'  // Replace with your DockerHub username
        AWS_REGION = 'us-east-1'  // Replace with your AWS region
        EKS_CLUSTER_NAME = 'real-estate-cluster'  // Replace with your EKS cluster name
        KUBECONFIG = credentials('kubeconfig')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build Backend Image') {
            steps {
                script {
                    dir('backend') {
                        def backendImage = docker.build("${DOCKERHUB_USERNAME}/real-estate-backend:${BUILD_NUMBER}")
                        docker.withRegistry('https://registry.hub.docker.com', 'dockerhub-credentials') {
                            backendImage.push()
                            backendImage.push("latest")
                        }
                    }
                }
            }
        }
        
        stage('Build Frontend Image') {
            steps {
                script {
                    dir('frontend') {
                        def frontendImage = docker.build("${DOCKERHUB_USERNAME}/real-estate-frontend:${BUILD_NUMBER}")
                        docker.withRegistry('https://registry.hub.docker.com', 'dockerhub-credentials') {
                            frontendImage.push()
                            frontendImage.push("latest")
                        }
                    }
                }
            }
        }
        
        stage('Security Scan') {
            parallel {
                stage('Backend Security Scan') {
                    steps {
                        script {
                            sh "docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image ${DOCKERHUB_USERNAME}/real-estate-backend:${BUILD_NUMBER}"
                        }
                    }
                }
                stage('Frontend Security Scan') {
                    steps {
                        script {
                            sh "docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image ${DOCKERHUB_USERNAME}/real-estate-frontend:${BUILD_NUMBER}"
                        }
                    }
                }
            }
        }
        
        stage('Update Kubernetes Manifests') {
            steps {
                script {
                    // Update image tags in deployment files
                    sh """
                        sed -i 's|\\[DOCKERHUB_USERNAME\\]|${DOCKERHUB_USERNAME}|g' k8s/backend-deployment.yaml
                        sed -i 's|\\[DOCKERHUB_USERNAME\\]|${DOCKERHUB_USERNAME}|g' k8s/frontend-deployment.yaml
                        sed -i 's|:latest|:${BUILD_NUMBER}|g' k8s/backend-deployment.yaml
                        sed -i 's|:latest|:${BUILD_NUMBER}|g' k8s/frontend-deployment.yaml
                    """
                }
            }
        }
        
        stage('Deploy to EKS') {
            steps {
                script {
                    withCredentials([kubeconfigFile(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                        sh """
                            # Update kubeconfig for EKS
                            aws eks update-kubeconfig --region ${AWS_REGION} --name ${EKS_CLUSTER_NAME}
                            
                            # Apply Kubernetes manifests
                            kubectl apply -f k8s/namespace.yaml
                            kubectl apply -f k8s/configmap.yaml
                            kubectl apply -f k8s/secrets.yaml
                            kubectl apply -f k8s/backend-deployment.yaml
                            kubectl apply -f k8s/backend-service.yaml
                            kubectl apply -f k8s/frontend-deployment.yaml
                            kubectl apply -f k8s/frontend-service.yaml
                            kubectl apply -f k8s/ingress.yaml
                            
                            # Wait for deployments to be ready
                            kubectl rollout status deployment/real-estate-backend -n real-estate-app --timeout=300s
                            kubectl rollout status deployment/real-estate-frontend -n real-estate-app --timeout=300s
                            
                            # Get service information
                            kubectl get services -n real-estate-app
                        """
                    }
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    sh """
                        # Wait for services to be ready
                        sleep 30
                        
                        # Get LoadBalancer URL
                        FRONTEND_URL=\$(kubectl get service real-estate-frontend-service -n real-estate-app -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
                        
                        if [ ! -z "\$FRONTEND_URL" ]; then
                            echo "Frontend URL: http://\$FRONTEND_URL"
                            # Basic health check
                            curl -f "http://\$FRONTEND_URL" || exit 1
                        else
                            echo "LoadBalancer URL not ready yet"
                        fi
                    """
                }
            }
        }
    }
    
    post {
        always {
            // Clean up Docker images
            sh 'docker system prune -f'
        }
        success {
            echo 'Deployment successful!'
            // Send success notification
        }
        failure {
            echo 'Deployment failed!'
            // Send failure notification
            // Rollback if needed
            script {
                sh """
                    kubectl rollout undo deployment/real-estate-backend -n real-estate-app
                    kubectl rollout undo deployment/real-estate-frontend -n real-estate-app
                """
            }
        }
    }
}