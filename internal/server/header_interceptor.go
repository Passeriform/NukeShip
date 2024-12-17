package server

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func HeaderUnaryInterceptor(
	ctx context.Context,
	req interface{},
	info *grpc.UnaryServerInfo,
	handler grpc.UnaryHandler,
) (interface{}, error) {
	clientId, err := ExtractClientIdMetadata(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Unauthenticated, err.Error())
	}

	NewConnection(clientId)
	return handler(ctx, req)
}

func HeaderStreamInterceptor(
	srv interface{},
	ss grpc.ServerStream,
	info *grpc.StreamServerInfo,
	handler grpc.StreamHandler,
) error {
	clientId, err := ExtractClientIdMetadata(ss.Context())
	if err != nil {
		return status.Errorf(codes.Unauthenticated, err.Error())
	}

	NewConnection(clientId)
	return handler(srv, ss)
}
