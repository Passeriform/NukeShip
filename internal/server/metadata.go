package server

import (
	"context"
	"fmt"

	"google.golang.org/grpc/metadata"
)

func ExtractClientIdMetadata(ctx context.Context) (string, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return "", fmt.Errorf("missing metadata")
	}

	clientIds := md["client-id"]
	if len(clientIds) == 0 {
		return "", fmt.Errorf("client-id is required")
	}

	return clientIds[0], nil
}
