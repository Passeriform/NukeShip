# --- Build WASM --- #

FROM golang:latest AS wasm
LABEL maintainer="Utkarsh Bhardwaj (Passeriform) <bhardwajutkarsh.ub@gmail.com>"

WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download

COPY pkg/client/ ./pkg/client/
COPY internal/ ./internal/

WORKDIR /build/internal/pb
RUN apt update && apt install -y protobuf-compiler
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
RUN protoc \
    --go_out=. \
    --go_opt=paths=source_relative \
    --go-grpc_out=. \
    --go-grpc_opt=paths=source_relative \
    --proto_path=. \
    ./room.proto

WORKDIR /build
ENV GOOS=js GOARCH=wasm CGO_ENABLED=0
RUN go build -ldflags "-extldflags '-static'" -o /artifact/main.wasm ./pkg/client/.
RUN cp $(go env GOROOT)/misc/wasm/wasm_exec.js /artifact/

# --- Build Web App --- #

FROM node:latest AS builder
LABEL maintainer="Utkarsh Bhardwaj (Passeriform) <bhardwajutkarsh.ub@gmail.com>"

WORKDIR /app
COPY web/package*.json ./
RUN npm install

COPY web/vite.config.ts web/tsconfig.json web/tailwind.config.js web/postcss.config.js web/index.html web/glitch.ts ./
COPY web/src/ ./src/
COPY web/public/ ./public/
COPY --from=wasm /artifact/main.wasm ./public/
COPY --from=wasm /artifact/wasm_exec.js ./src/
RUN npm run build

RUN echo ".wasm:application/wasm" >> ./httpd.conf

# --- Web Runner --- #

FROM lipanski/docker-static-website:latest
LABEL maintainer="Utkarsh Bhardwaj (Passeriform) <bhardwajutkarsh.ub@gmail.com>"

COPY --from=builder /app/dist/ .
COPY --from=builder /app/httpd.conf .

ENV ENVIRONMENT PRODUCTION
ENV HOST localhost
ENV SERVER_PORT 8080
