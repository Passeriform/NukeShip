package main

import (
	"context"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"nukeship/internal/pb"
	"nukeship/internal/server"
	"nukeship/internal/utility"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/keepalive"
	"google.golang.org/grpc/status"
)

const LISTEN_PORT = "50051"

type Server struct {
	pb.UnimplementedRoomServiceServer
	ShutdownCtx context.Context
}

func (s *Server) CreateRoom(ctx context.Context, in *pb.CreateRoomRequest) (*pb.CreateRoomResponse, error) {
	clientId, _ := server.ExtractClientIdMetadata(ctx)
	roomId := utility.NewRandomString(5)

	client, _ := server.NewConnection(clientId)
	room, _ := server.NewRoom(roomId)
	room.AddConnection(client)

	return &pb.CreateRoomResponse{Status: pb.ResponseStatus_OK, RoomId: roomId}, nil
}

func (s *Server) JoinRoom(ctx context.Context, in *pb.JoinRoomRequest) (*pb.JoinRoomResponse, error) {
	clientId, _ := server.ExtractClientIdMetadata(ctx)
	roomId := in.GetRoomId()

	client, _ := server.NewConnection(clientId)
	room := server.GetRoom(roomId)

	if room == nil {
		return &pb.JoinRoomResponse{Status: pb.ResponseStatus_ROOM_NOT_FOUND}, nil
	}

	room.AddConnection(client)

	return &pb.JoinRoomResponse{Status: pb.ResponseStatus_OK}, nil
}

func (s *Server) SubscribeMessages(in *pb.SubscribeMessagesRequest, srv grpc.ServerStreamingServer[pb.MessageStreamResponse]) error {
	clientId, _ := server.ExtractClientIdMetadata(srv.Context())
	client, _ := server.NewConnection(clientId)

	for {
		select {
		case <-srv.Context().Done():
			log.Printf("Client was disconnected or context was cancelled for client %s", client.Id)
			server.RemoveConnection(clientId)
			return nil

		case <-s.ShutdownCtx.Done():
			log.Printf("Server shutting down. Gracefully disconnecting client %s", clientId)
			return status.Errorf(codes.Unavailable, "Server is shutting down")

			// case <-ticker.C:
			// 	err := srv.Send(&pb.MessageStreamResponse{Message: "Updates..."})
			// 	if err != nil {
			// 		log.Printf("Error sending message: %v", err)
			// 		return err
			// 	}
		}
	}
}

func onShutdown(cancel context.CancelFunc) {
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)
	go func() {
		<-c
		log.Println("Received shutdown signal. Relaying stop to server context")
		cancel()
	}()
}

func main() {
	lis, err := net.Listen("tcp", ":"+LISTEN_PORT)
	if err != nil {
		log.Panicf("failed to listen: %v", err)
	}
	defer lis.Close()

	shutdownCtx, stop := context.WithCancel(context.Background())

	onShutdown(stop)

	s := grpc.NewServer(
		grpc.KeepaliveEnforcementPolicy(keepalive.EnforcementPolicy{}),
		grpc.KeepaliveParams(keepalive.ServerParameters{}),
		grpc.ChainUnaryInterceptor(
			grpc.UnaryServerInterceptor(server.HeaderUnaryInterceptor),
		),
		grpc.ChainStreamInterceptor(
			grpc.StreamServerInterceptor(server.HeaderStreamInterceptor),
		),
	)
	defer s.GracefulStop()

	pb.RegisterRoomServiceServer(s, &Server{ShutdownCtx: shutdownCtx})

	if err := s.Serve(lis); err != nil {
		log.Panicf("failed to serve: %v", err)
	}
}
