package server

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func HeaderUnaryInterceptor(
	ctx context.Context,
	req any,
	_ *grpc.UnaryServerInfo,
	handler grpc.UnaryHandler,
) (any, error) {
	clientID, ok := ExtractClientIDMetadata(ctx)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "missing metadata in context")
	}

	NewConnection(clientID)

	return handler(ctx, req)
}

func HeaderStreamInterceptor(
	srv any,
	stream grpc.ServerStream,
	_ *grpc.StreamServerInfo,
	handler grpc.StreamHandler,
) error {
	clientID, ok := ExtractClientIDMetadata(stream.Context())
	if !ok {
		return status.Error(codes.Unauthenticated, "missing client-id in context metadata")
	}

	NewConnection(clientID)

	return handler(srv, stream)
}
