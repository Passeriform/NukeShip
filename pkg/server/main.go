package main

import (
	"context"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/caarlos0/env/v11"
	"github.com/necmettindev/randomstring"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/keepalive"
	"google.golang.org/grpc/reflection"
	"google.golang.org/grpc/status"

	"passeriform.com/nukeship/internal/pb"
	"passeriform.com/nukeship/internal/server"
)

const UniqueIDLength = 5

type serverConfig struct {
	Port        string `env:"PORT"        envDefault:"50051"`
	Environment string `env:"ENVIRONMENT" envDefault:"PRODUCTION"`
}

type Server struct {
	pb.UnimplementedRoomServiceServer `exhaustruct:"optional"`
	//nolint:containedctx // Carrying shutdown context for in-request client cancellation.
	ShutdownCtx context.Context
}

func (*Server) CreateRoom(ctx context.Context, _ *pb.CreateRoomRequest) (*pb.CreateRoomResponse, error) {
	clientID, _ := server.ExtractClientIDMetadata(ctx)

	// TODO: Move the id generation login inside NewRoom method.
	roomID, err := randomstring.GenerateString(randomstring.GenerationOptions{
		Length:           UniqueIDLength,
		DisableNumeric:   true,
		DisableLowercase: true,
	})
	if err != nil {
		log.Panicf("Error occurred while creating client id: %v", err)
	}

	client, _ := server.NewConnection(clientID)
	room, _ := server.NewRoom(roomID)
	room.AddConnection(client)

	return &pb.CreateRoomResponse{Status: pb.ResponseStatus_OK, RoomId: roomID}, nil
}

func (*Server) JoinRoom(ctx context.Context, in *pb.JoinRoomRequest) (*pb.JoinRoomResponse, error) {
	clientID, _ := server.ExtractClientIDMetadata(ctx)
	roomID := in.GetRoomId()

	client, _ := server.NewConnection(clientID)
	room := server.GetRoom(roomID)

	if room == nil {
		return &pb.JoinRoomResponse{Status: pb.ResponseStatus_ROOM_NOT_FOUND}, nil
	}

	room.AddConnection(client)

	for _, client := range room.Clients {
		client.MsgChan <- &pb.MessageStreamResponse{Type: pb.ServerMessage_OPPONENT_JOINED}
	}

	return &pb.JoinRoomResponse{Status: pb.ResponseStatus_OK}, nil
}

func (srv *Server) SubscribeMessages(
	_ *pb.SubscribeMessagesRequest,
	stream grpc.ServerStreamingServer[pb.MessageStreamResponse],
) error {
	clientID, _ := server.ExtractClientIDMetadata(stream.Context())
	client, _ := server.NewConnection(clientID)

	for {
		select {
		case msg := <-client.MsgChan:
			err := stream.Send(msg)
			if err != nil {
				log.Printf("Error sending message: %v", err)
				return nil
			}

		case <-stream.Context().Done():
			log.Printf("Client was disconnected or context was cancelled for client %s", client.ID)
			server.RemoveConnection(clientID)

			return nil

		// TODO: Fix graceful shutdown getting stuck.
		case <-srv.ShutdownCtx.Done():
			log.Printf("Server shutting down. Gracefully disconnecting client %s", clientID)
			return status.Errorf(codes.Unavailable, "Server is shutting down")
		}
	}
}

func onShutdown(cancel context.CancelFunc) {
	c := make(chan os.Signal, 1)

	signal.Notify(c, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)

	go func() {
		<-c
		log.Println("Received shutdown signal. Relaying stop to server context.")
		cancel()
	}()
}

func main() {
	cfg, err := env.ParseAs[serverConfig]()
	if err != nil {
		log.Panicf("Could not parse environment variables: %v", err)
	}

	lis, err := net.Listen("tcp", ":"+cfg.Port)
	if err != nil {
		log.Panicf("Failed to listen: %v", err)
	}
	defer lis.Close()

	shutdownCtx, stop := context.WithCancel(context.Background())

	onShutdown(stop)

	srv := grpc.NewServer(
		grpc.KeepaliveEnforcementPolicy(keepalive.EnforcementPolicy{}),
		grpc.KeepaliveParams(keepalive.ServerParameters{}),
		grpc.ChainUnaryInterceptor(
			grpc.UnaryServerInterceptor(server.HeaderUnaryInterceptor),
		),
		grpc.ChainStreamInterceptor(
			grpc.StreamServerInterceptor(server.HeaderStreamInterceptor),
		),
	)
	defer srv.GracefulStop()

	if cfg.Environment == "DEVELOPMENT" {
		reflection.Register(srv)
	}

	log.Printf("Started server on port: %v", cfg.Port)

	pb.RegisterRoomServiceServer(srv, &Server{ShutdownCtx: shutdownCtx})

	if err := srv.Serve(lis); err != nil {
		log.Panicf("Failed to serve: %v", err)
	}
}
