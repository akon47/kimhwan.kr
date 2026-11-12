pipeline {
    agent any

    environment {
        dockerImage = ''
        APP_NAME = 'kimhwan-kr'
        IMAGE_NAME = 'akon47/kimhwan-kr'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        GITHUB_CREDENTIALS_ID = 'git-hub'
        DOCKER_CREDENTIALS_ID = 'docker-hub'
    }

    stages {
        stage('Clone') {
            steps {
                echo 'Clonning Repository'
                git url: 'git@github.com:akon47/kimhwan.kr.git', branch: 'master', credentialsId: GITHUB_CREDENTIALS_ID, changelog: false
            }
            post {
                success {
                    echo 'Successfully Cloned Repository'
                }
                failure {
                    error 'This pipeline stops here...'
                }
            }
        }

        stage('Bulid Docker') {
            steps {
                echo 'Bulid Docker'
                script {
                    dockerImage = docker.build("${IMAGE_NAME}")
                }
            }
            post {
                failure {
                    error 'This pipeline stops here...'
                }
            }
        }

        stage('Push Docker') {
            steps {
                echo 'Push Docker'
                script {
                    docker.withRegistry('', DOCKER_CREDENTIALS_ID) {
                        dockerImage.push("${IMAGE_TAG}")
                        dockerImage.push("latest")
                    }
                }
            }
            post {
                success {
                    sh 'docker rmi $(docker images -q -f dangling=true) || true'
                }
                failure {
                    error 'This pipeline stops here...'
                }
            }
        }

        stage('Docker Run') {
            steps {
                echo 'Pull Docker Image & Docker Image Run'
                sshagent(credentials: ['ssh']) {
                    // One remote script, so a failed pull stops before the running container is touched.
                    sh '''
                        ssh -o StrictHostKeyChecking=no root@10.10.10.25 "APP_NAME=${APP_NAME} IMAGE_NAME=${IMAGE_NAME} bash -s" <<'REMOTE'
set -eu
# The docker CLI on this host can be newer than the daemon that is still running (packages were upgraded
# without restarting dockerd); fall back to the API version that daemon speaks.
docker version >/dev/null 2>&1 || export DOCKER_API_VERSION=1.41
docker pull "$IMAGE_NAME"
docker rm -f "$APP_NAME" >/dev/null 2>&1 || true
docker run -d --restart always --name "$APP_NAME" --net=host "$IMAGE_NAME"
docker image prune -f >/dev/null 2>&1 || true
docker ps --filter "name=$APP_NAME" --format '{{.Names}} {{.Image}} {{.Status}}'
REMOTE
                    '''
                }
            }
            post {
                failure {
                    error 'This pipeline stops here...'
                }
            }
        }
    }
}
