target "default" {
  dockerfile = "server/Dockerfile"
  context = "."
  tags = ["akshola00/server:latest"]
  platforms = ["linux/amd64"]
}

target "api" {
  dockerfile = "server/Dockerfile"
  context = "."
  tags = ["akshola00/server:latest"]
  platforms = ["linux/amd64"]
}
