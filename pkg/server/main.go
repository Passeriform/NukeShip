package main

import (
	"context"
	"log"
	"net"
	"time"

	"nukeship/internal/pb"
	"nukeship/internal/utility"

	"google.golang.org/grpc"
	"google.golang.org/grpc/keepalive"
)

type Server struct {
	pb.UnimplementedRoomServiceServer
}

type Client struct {
	Publish *pb.MessageStreamResponse
}
type Room struct{}

var clients = map[string]Client{}
var rooms = map[string]Room{}

var enforcementPolicy = keepalive.EnforcementPolicy{}

var keepAliveParams = keepalive.ServerParameters{}

func (s *Server) CreateRoom(ctx context.Context, in *pb.CreateRoomRequest) (*pb.CreateRoomResponse, error) {
	clientId := in.GetClientId()
	roomId := utility.NewRandomString(5)

	clients[clientId] = Client{}
	rooms[roomId] = Room{}

	return &pb.CreateRoomResponse{Status: true, RoomId: roomId}, nil
}

func (s *Server) SubscribeMessages(in *pb.SubscribeMessagesRequest, srv grpc.ServerStreamingServer[pb.MessageStreamResponse]) error {
	// clientId := in.GetClientId()

	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-srv.Context().Done():
			log.Println("Client was disconnected or context was cancelled")
			return nil

		case <-ticker.C:
			err := srv.Send(&pb.MessageStreamResponse{Message: "Updates..."})
			if err != nil {
				log.Printf("Error sending message: %v", err)
				return err
			}
		}
	}
}

func main() {
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	s := grpc.NewServer(grpc.KeepaliveEnforcementPolicy(enforcementPolicy), grpc.KeepaliveParams(keepAliveParams))

	pb.RegisterRoomServiceServer(s, &Server{})

	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}

}
