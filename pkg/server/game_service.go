package main

import (
	"context"

	"passeriform.com/nukeship/internal/pb"
)

type GameService struct {
	pb.UnimplementedGameServiceServer `exhaustruct:"optional"`
	//nolint:containedctx // Carrying shutdown context for in-request client cancellation.
	ShutdownCtx context.Context
}
