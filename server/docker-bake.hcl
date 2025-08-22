target "api" {
  dockerfile = "Dockerfile"
  context = "."
  tags = ["akshola00/server:latest"]
  platforms = ["linux/amd64"]
}
