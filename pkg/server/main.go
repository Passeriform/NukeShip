package main

import (
	"context"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/keepalive"
	"google.golang.org/grpc/reflection"
	"google.golang.org/grpc/status"

	"github.com/caarlos0/env/v11"

	"passeriform.com/nukeship/internal/game"
	"passeriform.com/nukeship/internal/pb"
	"passeriform.com/nukeship/internal/server"
)

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
	client, _ := server.NewConnection(clientID)
	room, _ := server.NewRoom()
	room.AddConnection(client)

	client.Room = room

	return &pb.CreateRoomResponse{Status: pb.ResponseStatus_OK, RoomId: room.ID}, nil
}

func (*Server) JoinRoom(ctx context.Context, in *pb.JoinRoomRequest) (*pb.JoinRoomResponse, error) {
	clientID, _ := server.ExtractClientIDMetadata(ctx)
	roomID := in.GetRoomId()

	client := server.GetConnection(clientID)
	room := server.GetRoom(roomID)

	if room == nil {
		return &pb.JoinRoomResponse{Status: pb.ResponseStatus_ROOM_NOT_FOUND}, nil
	}

	room.AddConnection(client)

	client.Room = room

	for ID, client := range room.Clients {
		if ID == clientID {
			continue
		}
		client.MsgChan <- &pb.MessageStreamResponse{Type: pb.ServerMessage_OPPONENT_JOINED}
	}

	return &pb.JoinRoomResponse{Status: pb.ResponseStatus_OK}, nil
}

func (*Server) LeaveRoom(ctx context.Context, _ *pb.LeaveRoomRequest) (*pb.LeaveRoomResponse, error) {
	clientID, _ := server.ExtractClientIDMetadata(ctx)

	client := server.GetConnection(clientID)

	if client.Room == nil {
		return &pb.LeaveRoomResponse{Status: pb.ResponseStatus_NO_ROOM_JOINED_YET}, nil
	}

	room := client.Room

	room.RemoveConnection(client.ID)

	for _, client := range room.Clients {
		client.MsgChan <- &pb.MessageStreamResponse{Type: pb.ServerMessage_OPPONENT_LEFT}
	}

	return &pb.LeaveRoomResponse{Status: pb.ResponseStatus_OK}, nil
}

func (*Server) UpdateReady(ctx context.Context, in *pb.UpdateReadyRequest) (*pb.UpdateReadyResponse, error) {
	clientID, _ := server.ExtractClientIDMetadata(ctx)
	ready := in.GetReady()

	client := server.GetConnection(clientID)

	if client.Room == nil {
		return &pb.UpdateReadyResponse{Status: pb.ResponseStatus_NO_ROOM_JOINED_YET}, nil
	}

	room := client.Room

	client.Ready = ready

	startGameFlag := true

	for ID, conn := range room.Clients {
		startGameFlag = startGameFlag && conn.Ready

		if ID == clientID {
			continue
		}

		if ready {
			conn.MsgChan <- &pb.MessageStreamResponse{Type: pb.ServerMessage_OPPONENT_READY}
		} else {
			conn.MsgChan <- &pb.MessageStreamResponse{Type: pb.ServerMessage_OPPONENT_REVERTED_READY}
		}
	}

	if startGameFlag {
		room.GameRunning = true

		go game.NewGame()

		for _, c := range room.Clients {
			c.MsgChan <- &pb.MessageStreamResponse{Type: pb.ServerMessage_GAME_STARTED}
		}
	}

	return &pb.UpdateReadyResponse{Status: pb.ResponseStatus_OK}, nil
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
			client.Remove()

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
