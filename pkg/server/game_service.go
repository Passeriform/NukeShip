package main

import (
	"context"

	"github.com/passeriform/internal/pb"
	"github.com/passeriform/internal/server"
)

type GameService struct {
	pb.UnimplementedGameServiceServer `exhaustruct:"optional"`

	//nolint:containedctx // Carrying shutdown context for in-request client cancellation.
	ShutdownCtx context.Context
}

func (*GameService) AddPlayer(
	ctx context.Context,
	in *pb.AddPlayerRequest,
) (*pb.AddPlayerResponse, error) {
	clientID, _ := server.ExtractClientIDMetadata(ctx)
	conn := server.GetConnection(clientID)
	tree := in.GetTree()

	if conn.Room == nil {
		return &pb.AddPlayerResponse{Status: pb.ResponseStatus_NoRoomJoinedYet}, nil
	}

	room := conn.Room

	room.Game.AddPlayerState(clientID, tree)

	return &pb.AddPlayerResponse{Status: pb.ResponseStatus_Ok}, nil
}
