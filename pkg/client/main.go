package main

import (
	"context"
	"errors"
	"io"
	"log"
	"time"

	"github.com/caarlos0/env/v11"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/keepalive"
	"google.golang.org/grpc/metadata"

	"passeriform.com/nukeship/internal/pb"
	"passeriform.com/nukeship/internal/utility"
)

const UniqueIDLength = 5

type clientConfig struct {
	Host       string `env:"HOST"        envDefault:"localhost"`
	ServerPort string `env:"SERVER_PORT" envDefault:"50051"`
}

func createRoom(client pb.RoomServiceClient, ctx context.Context) {
	r, err := client.CreateRoom(ctx, &pb.CreateRoomRequest{})
	if err != nil {
		log.Printf("Could not create room: %v", err)
	}

	log.Printf("Room created: %s", r.GetRoomId())
}

func joinRoom(client pb.RoomServiceClient, ctx context.Context, roomID string) {
	r, err := client.JoinRoom(ctx, &pb.JoinRoomRequest{RoomId: roomID})
	if err != nil {
		log.Printf("Could not join room with id: %v", err)
	}

	log.Printf("Room joined: %s", r.GetStatus().String())
}

func handleServerUpdate(s grpc.ServerStreamingClient[pb.MessageStreamResponse], done chan<- bool) {
	for {
		update, err := s.Recv()
		if errors.Is(err, io.EOF) {
			log.Println("Stopped receiving updates from server.")
			break
		}

		if err != nil {
			log.Printf("Received error frame: %v", err)

			break
		}

		log.Println(update.GetMessage())
	}
	done <- true
}

func main() {
	cfg, err := env.ParseAs[clientConfig]()
	if err != nil {
		log.Panicf("Could not parse environment variables: %v", err)
	}

	clientID := utility.NewRandomString(UniqueIDLength)

	conn, err := grpc.NewClient(
		cfg.Host+":"+cfg.ServerPort,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithKeepaliveParams(keepalive.ClientParameters{}),
	)
	if err != nil {
		log.Printf("Could not connect: %v", err)
	}
	defer conn.Close()

	client := pb.NewRoomServiceClient(conn)

	// Populate client id in metadata.
	meta := metadata.New(map[string]string{"client-id": clientID})

	// Create unary context.
	unaryCtx, cancel := context.WithTimeout(context.Background(), time.Second)
	unaryCtx = metadata.NewOutgoingContext(unaryCtx, meta)
	defer cancel()

	// Create stream context.
	streamCtx, cancel := context.WithCancel(context.Background())
	streamCtx = metadata.NewOutgoingContext(streamCtx, meta)
	defer cancel()

	streamClient, err := client.SubscribeMessages(streamCtx, &pb.SubscribeMessagesRequest{})
	if err != nil {
		log.Panicf("Subscription to server messages failed: %v", err)
	}
	defer func() {
		err := streamClient.CloseSend()
		if err != nil {
			log.Panicf("Unable to close send direction of stream: %v", err)
		}
	}()

	done := make(chan bool)

	go handleServerUpdate(streamClient, done)
	go handleApp(client, unaryCtx, done)

	<-done
}
