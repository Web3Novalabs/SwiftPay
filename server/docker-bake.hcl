target "default" {
  dockerfile = "Dockerfile"
  context = "./server"
  tags = ["akshola00/server:latest"]
  platforms = ["linux/amd64"]
}
