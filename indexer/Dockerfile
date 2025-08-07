FROM quay.io/apibara/sink-console:0.6.1

WORKDIR /app

COPY . .

CMD ["run", "--allow-net=", "main.ts", "-A", "${DNA_KEY}"] 