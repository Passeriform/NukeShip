package main

import (
	"context"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	"nukeship/internal/pb"
	"nukeship/internal/utility"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/keepalive"
	"google.golang.org/grpc/status"
)

type Server struct {
	pb.UnimplementedRoomServiceServer
	ShutdownCtx context.Context
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

		case <-s.ShutdownCtx.Done():
			log.Println("Server shutting down. Gracefully disconnecting clients")
			return status.Errorf(codes.Unavailable, "Server is shutting down")

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
		log.Panicf("failed to listen: %v", err)
	}

	shutdownCtx, stop := context.WithCancel(context.Background())

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)
	go func() {
		<-c
		log.Println("Received shutdown signal. Relaying stop to server context")
		stop()
	}()

	s := grpc.NewServer(grpc.KeepaliveEnforcementPolicy(enforcementPolicy), grpc.KeepaliveParams(keepAliveParams))

	pb.RegisterRoomServiceServer(s, &Server{ShutdownCtx: shutdownCtx})

	if err := s.Serve(lis); err != nil {
		log.Panicf("failed to serve: %v", err)
	}

}
