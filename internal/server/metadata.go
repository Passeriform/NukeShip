package server

import (
	"context"

	"google.golang.org/grpc/metadata"
)

func ExtractClientIDMetadata(ctx context.Context) (string, bool) {
	data, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return "", false
	}

	clientIDs := data["client-id"]
	if len(clientIDs) == 0 {
		return "", false
	}

	return clientIDs[0], true
}
