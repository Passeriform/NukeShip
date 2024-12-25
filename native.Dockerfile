# --- Client Builder --- #

FROM golang:latest AS builder
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
ENV GOOS=linux GOARCH=amd64 CGO_ENABLED=0
RUN go build -ldflags "-extldflags '-static'" -o /artifact/client ./pkg/client/.

# --- Client Runner --- #

FROM scratch
LABEL maintainer="Utkarsh Bhardwaj (Passeriform) <bhardwajutkarsh.ub@gmail.com>"

WORKDIR /app
COPY --from=builder /artifact/client ./
ENV ENVIRONMENT PRODUCTION
ENV HOST localhost
ENV SERVER_PORT 8080
EXPOSE 80
CMD ["./client"]