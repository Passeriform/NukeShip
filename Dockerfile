FROM golang:latest as builder
LABEL maintainer="Utkarsh Bhardwaj (Passeriform) <bhardwajutkarsh.ub@gmail.com>"
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags "-extldflags '-static'" -o server ./web/server.go

FROM scratch
WORKDIR /app
ENV ENVIRONMENT PRODUCTION
ENV PORT 8080
ENV GOPATH .
COPY --from=builder /build/server .
COPY --from=builder /build/assets ./assets
COPY --from=builder /build/web/static ./web/static
COPY --from=builder /build/web/templates ./web/templates
RUN protoc --go_out=. --go_opt=paths=source_relative --go-grpc_out=. --go-grpc_opt=paths=source_relative .\internal\pb\service.proto
EXPOSE 8080
CMD ["./server"]