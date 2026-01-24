pipeline {
  agent any

  environment {
    AWS_REGION = 'us-east-1'
    CLUSTER_NAME = 'realestate-cluster'
    NAMESPACE = 'real-estate-app'

    AWS_ACCOUNT_ID = '016817716305'
    ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    ECR_BACKEND = "${ECR_REGISTRY}/realestate-backend"
    ECR_FRONTEND = "${ECR_REGISTRY}/realestate-frontend"

    IMAGE_TAG = "${BUILD_NUMBER}"
  }

  stages {

    stage('Branch Check') {
      steps {
        script {
          if (env.BRANCH_NAME != 'production') {
            error("Only production branch can deploy. Current: ${env.BRANCH_NAME}")
          }
        }
      }
    }

    stage('Build Backend Image') {
      steps {
        dir('backend') {
          sh """
            docker build -t ${ECR_BACKEND}:${IMAGE_TAG} .
            docker tag ${ECR_BACKEND}:${IMAGE_TAG} ${ECR_BACKEND}:latest
          """
        }
      }
    }

    stage('Build Frontend Image') {
      steps {
        dir('frontend') {
          sh """
            docker build -t ${ECR_FRONTEND}:${IMAGE_TAG} .
            docker tag ${ECR_FRONTEND}:${IMAGE_TAG} ${ECR_FRONTEND}:latest
          """
        }
      }
    }

    stage('Login to ECR') {
      steps {
        sh """
          aws ecr get-login-password --region ${AWS_REGION} |
          docker login --username AWS --password-stdin ${ECR_REGISTRY}
        """
      }
    }

    stage('Push Images to ECR') {
      steps {
        sh """
          docker push ${ECR_BACKEND}:${IMAGE_TAG}
          docker push ${ECR_BACKEND}:latest
          docker push ${ECR_FRONTEND}:${IMAGE_TAG}
          docker push ${ECR_FRONTEND}:latest
        """
      }
    }

    stage('Manual Production Approval') {
      steps {
        input message: 'Deploy to PRODUCTION?', ok: 'Deploy'
      }
    }

    stage('Deploy to EKS') {
      steps {
        sh """
          aws eks update-kubeconfig --region ${AWS_REGION} --name ${CLUSTER_NAME}

          kubectl apply -f k8s/namespace.yaml
          kubectl apply -f k8s/configmap.yaml

          kubectl set image deployment/real-estate-backend \
            backend=${ECR_BACKEND}:${IMAGE_TAG} -n ${NAMESPACE}

          kubectl set image deployment/real-estate-frontend \
            frontend=${ECR_FRONTEND}:${IMAGE_TAG} -n ${NAMESPACE}

          kubectl rollout status deployment/real-estate-backend -n ${NAMESPACE}
          kubectl rollout status deployment/real-estate-frontend -n ${NAMESPACE}
        """
      }
    }
  }

  post {
    failure {
      sh """
        kubectl rollout undo deployment/real-estate-backend -n ${NAMESPACE} || true
        kubectl rollout undo deployment/real-estate-frontend -n ${NAMESPACE} || true
      """
    }

    always {
      sh 'docker system prune -f'
    }
  }
}
