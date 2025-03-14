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
	Port string `env:"PORT" envDefault:"50051"`
}

type Server struct {
	pb.UnimplementedRoomServiceServer `exhaustruct:"optional"`
	//nolint:containedctx // Carrying shutdown context for in-request client cancellation.
	ShutdownCtx context.Context
}

func (*Server) CreateRoom(ctx context.Context, _ *pb.CreateRoomRequest) (*pb.CreateRoomResponse, error) {
	clientID, _ := server.ExtractClientIDMetadata(ctx)
	client := server.GetConnection(clientID)
	room, _ := server.NewRoom()
	room.AddConnection(client)

	client.Room = room

	log.Printf("Created new room: %v", room.ID)

	return &pb.CreateRoomResponse{Status: pb.ResponseStatus_Ok, RoomId: room.ID}, nil
}

func (*Server) JoinRoom(ctx context.Context, in *pb.JoinRoomRequest) (*pb.JoinRoomResponse, error) {
	clientID, _ := server.ExtractClientIDMetadata(ctx)
	roomID := in.GetRoomId()

	client := server.GetConnection(clientID)
	room := server.GetRoom(roomID)

	if room == nil {
		return &pb.JoinRoomResponse{Status: pb.ResponseStatus_RoomNotFound}, nil
	}

	room.AddConnection(client)

	client.Room = room

	for ID, client := range room.Clients {
		if ID == clientID {
			continue
		}
		client.MsgChan <- &pb.MessageStreamResponse{Type: pb.RoomServiceEvent_OpponentJoined}
	}

	log.Printf("Client joined room: %v", room.ID)

	return &pb.JoinRoomResponse{Status: pb.ResponseStatus_Ok}, nil
}

func (*Server) LeaveRoom(ctx context.Context, _ *pb.LeaveRoomRequest) (*pb.LeaveRoomResponse, error) {
	clientID, _ := server.ExtractClientIDMetadata(ctx)

	client := server.GetConnection(clientID)

	if client.Room == nil {
		return &pb.LeaveRoomResponse{Status: pb.ResponseStatus_NoRoomJoinedYet}, nil
	}

	room := client.Room

	room.RemoveConnection(client.ID)

	for _, client := range room.Clients {
		client.MsgChan <- &pb.MessageStreamResponse{Type: pb.RoomServiceEvent_OpponentLeft}
	}

	log.Printf("Client left room: %v", room.ID)

	return &pb.LeaveRoomResponse{Status: pb.ResponseStatus_Ok}, nil
}

//nolint:gocognit,revive // TODO: Split and remodel using FSM.
func (*Server) UpdateReady(ctx context.Context, in *pb.UpdateReadyRequest) (*pb.UpdateReadyResponse, error) {
	clientID, _ := server.ExtractClientIDMetadata(ctx)
	ready := in.GetReady()

	client := server.GetConnection(clientID)

	if client.Room == nil {
		return &pb.UpdateReadyResponse{Status: pb.ResponseStatus_NoRoomJoinedYet}, nil
	}

	room := client.Room

	client.Ready = ready

	// TODO: Parameterize this check for siege mode.
	startGameFlag := len(room.Clients) == 2

	for ID, conn := range room.Clients {
		startGameFlag = startGameFlag && conn.Ready

		if ID == clientID {
			continue
		}

		if ready {
			conn.MsgChan <- &pb.MessageStreamResponse{Type: pb.RoomServiceEvent_OpponentReady}
		} else {
			conn.MsgChan <- &pb.MessageStreamResponse{Type: pb.RoomServiceEvent_OpponentRevertedReady}
		}
	}

	if startGameFlag {
		room.Game = game.NewGame()

		for _, c := range room.Clients {
			c.MsgChan <- &pb.MessageStreamResponse{Type: pb.RoomServiceEvent_GameStarted}
		}
	}

	log.Printf("Client set ready state to: %t", ready)

	return &pb.UpdateReadyResponse{Status: pb.ResponseStatus_Ok}, nil
}

func (srv *Server) SubscribeMessages(
	_ *pb.SubscribeMessagesRequest,
	stream grpc.ServerStreamingServer[pb.MessageStreamResponse],
) error {
	clientID, _ := server.ExtractClientIDMetadata(stream.Context())
	client := server.GetConnection(clientID)

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

		case <-srv.ShutdownCtx.Done():
			log.Printf("Server shutting down. Gracefully disconnecting client %s", clientID)
			return status.Errorf(codes.Unavailable, "Server is shutting down")
		}
	}
}

func (*Server) AddPlayer(ctx context.Context, in *pb.AddPlayerRequest) (*pb.AddPlayerResponse, error) {
	clientID, _ := server.ExtractClientIDMetadata(ctx)
	client := server.GetConnection(clientID)
	tree := in.GetTree()

	if client.Room == nil {
		return &pb.AddPlayerResponse{Status: pb.ResponseStatus_NoRoomJoinedYet}, nil
	}

	room := client.Room

	room.Game.AddPlayerState(clientID, tree)

	return &pb.AddPlayerResponse{Status: pb.ResponseStatus_Ok}, nil
}

func handleQuit(cancel context.CancelFunc, srv *grpc.Server) {
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)

	<-c

	log.Println("Received shutdown signal. Relaying stop to server context.")

	cancel()
	srv.GracefulStop()
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

	go handleQuit(stop, srv)

	log.Println("Enabling reflection for gRPC server.")
	reflection.Register(srv)

	log.Printf("Started server on port: %v", cfg.Port)

	pb.RegisterRoomServiceServer(srv, &Server{ShutdownCtx: shutdownCtx})

	if err := srv.Serve(lis); err != nil {
		log.Panicf("Failed to serve: %v", err)
	}
}
