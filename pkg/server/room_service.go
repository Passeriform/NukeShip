package main

import (
	"context"
	"log"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"passeriform.com/nukeship/internal/pb"
	"passeriform.com/nukeship/internal/server"
)

type RoomService struct {
	pb.UnimplementedRoomServiceServer `exhaustruct:"optional"`
	//nolint:containedctx // Carrying shutdown context for in-request client cancellation.
	ShutdownCtx context.Context
}

func dispatchEvents(room *server.Room, e string) {
	var roomState pb.RoomState
	switch e {
	case server.RoomStateAwaitingPlayers.String():
		roomState = pb.RoomState_RoomFilled
	case server.RoomStateAwaitingReady.String():
		roomState = pb.RoomState_AwaitingReady
	case server.RoomStateInGame.String():
		roomState = pb.RoomState_GameStarted
	}

	for _, partConn := range room.Clients {
		partConn.MsgChan <- &pb.MessageStreamResponse{Type: roomState}
	}
}

func (srv *RoomService) CreateRoom(
	ctx context.Context,
	in *pb.CreateRoomRequest,
) (*pb.CreateRoomResponse, error) {
	clientID, _ := server.ExtractClientIDMetadata(ctx)
	conn := server.GetConnection(clientID)
	room, _ := server.NewRoom(in.RoomType, dispatchEvents)
	room.AddConnection(conn)

	conn.Room = room

	log.Printf("Created new room %v", room.ID)

	return &pb.CreateRoomResponse{Status: pb.ResponseStatus_Ok, RoomId: room.ID}, nil
}

func (*RoomService) JoinRoom(
	ctx context.Context,
	in *pb.JoinRoomRequest,
) (*pb.JoinRoomResponse, error) {
	clientID, _ := server.ExtractClientIDMetadata(ctx)
	roomID := in.GetRoomId()

	conn := server.GetConnection(clientID)
	room := server.GetRoom(roomID)

	if room == nil {
		return &pb.JoinRoomResponse{Status: pb.ResponseStatus_RoomNotFound}, nil
	}

	room.AddConnection(conn)

	conn.Room = room

	log.Printf("Client joined room: %v", room.ID)

	return &pb.JoinRoomResponse{Status: pb.ResponseStatus_Ok}, nil
}

func (*RoomService) LeaveRoom(
	ctx context.Context,
	_ *pb.LeaveRoomRequest,
) (*pb.LeaveRoomResponse, error) {
	clientID, _ := server.ExtractClientIDMetadata(ctx)

	conn := server.GetConnection(clientID)

	if conn.Room == nil {
		return &pb.LeaveRoomResponse{Status: pb.ResponseStatus_NoRoomJoinedYet}, nil
	}

	room := conn.Room

	room.RemoveConnection(conn.ID)

	log.Printf("Client left room: %v", room.ID)

	return &pb.LeaveRoomResponse{Status: pb.ResponseStatus_Ok}, nil
}

//nolint:gocognit // TODO: Split and remodel using FSM.
func (*RoomService) UpdateReady(
	ctx context.Context,
	in *pb.UpdateReadyRequest,
) (*pb.UpdateReadyResponse, error) {
	clientID, _ := server.ExtractClientIDMetadata(ctx)
	ready := in.GetReady()

	conn := server.GetConnection(clientID)

	if conn.Room == nil {
		return &pb.UpdateReadyResponse{Status: pb.ResponseStatus_NoRoomJoinedYet}, nil
	}

	room := conn.Room

	room.SetReady(conn.ID, ready)

	log.Printf("Client set ready state to: %t", ready)

	return &pb.UpdateReadyResponse{Status: pb.ResponseStatus_Ok}, nil
}

func (srv *RoomService) SubscribeMessages(
	_ *pb.SubscribeMessagesRequest,
	stream grpc.ServerStreamingServer[pb.MessageStreamResponse],
) error {
	clientID, _ := server.ExtractClientIDMetadata(stream.Context())
	conn := server.GetConnection(clientID)

	for {
		select {
		case msg := <-conn.MsgChan:
			err := stream.Send(msg)
			if err != nil {
				log.Printf("Error sending message: %v", err)
				return nil
			}

		case <-stream.Context().Done():
			log.Printf("Client was disconnected or context was cancelled for client %s", conn.ID)
			conn.Remove()

			return nil

		case <-srv.ShutdownCtx.Done():
			log.Printf("Server shutting down. Gracefully disconnecting client %s", clientID)
			return status.Errorf(codes.Unavailable, "Server is shutting down")
		}
	}
}
