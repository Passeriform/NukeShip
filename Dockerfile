# --- Server Builder --- #

# TODO: Add godoc server hosting
FROM golang:1.24-alpine AS builder
LABEL maintainer="Utkarsh Bhardwaj (Passeriform) <bhardwajutkarsh.ub@gmail.com>"

WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download

COPY pkg/server/ ./pkg/server/
COPY internal/ ./internal/

RUN apk add --no-cache protobuf

WORKDIR /build
ENV GOOS=linux GOARCH=amd64 CGO_ENABLED=0
RUN go generate ./...
RUN go build -ldflags "-extldflags '-static'" -o /artifact/server ./pkg/server/.

# --- Server Runner --- #

FROM scratch
LABEL maintainer="Utkarsh Bhardwaj (Passeriform) <bhardwajutkarsh.ub@gmail.com>"

WORKDIR /app
COPY --from=builder /artifact/server ./
EXPOSE 443
CMD ["./server"]