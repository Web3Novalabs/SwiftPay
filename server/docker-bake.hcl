target "api" {
  dockerfile = "Dockerfile"
  context = "."
  tags = ["${{ secrets.DOCKER_USERNAME }}/server:latest"]
  platforms = ["linux/amd64"]
}
