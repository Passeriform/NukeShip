package main

import (
	"context"
	"io"
	"log"
	"os"
	"time"

	"nukeship/internal/pb"
	"nukeship/internal/utility"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/keepalive"
	"google.golang.org/grpc/metadata"
)

const SERVER_HOST = "localhost"
const SERVER_PORT = "50051"

/* Player simulations. Remove after implementing UI */
func player1(client pb.RoomServiceClient, ctx context.Context) {
	r, err := client.CreateRoom(ctx, &pb.CreateRoomRequest{})
	if err != nil {
		log.Panicf("could not create room: %v", err)
	}

	log.Printf("Room created: %s", r.GetRoomId())
}

func player2(client pb.RoomServiceClient, ctx context.Context, roomId string) {
	r, err := client.JoinRoom(ctx, &pb.JoinRoomRequest{RoomId: roomId})
	if err != nil {
		log.Panicf("Could not join room with id: %v", err)
	}

	log.Printf("Room joined: %s", r.Status.String())
}

/* --- */

func handleServerUpdate(s grpc.ServerStreamingClient[pb.MessageStreamResponse], done chan<- bool) error {
	for {
		update, err := s.Recv()
		if err == io.EOF {
			log.Println("stopped receiving updates from server")
			done <- true
			break
		}
		if err != nil {
			log.Panicf("received error frame: %v", err)
			return err
		}
		log.Println(update.GetMessage())
	}
	return nil
}

func main() {
	clientId := utility.NewRandomString(5)

	conn, err := grpc.NewClient(
		SERVER_HOST+":"+SERVER_PORT,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithKeepaliveParams(keepalive.ClientParameters{}),
	)
	if err != nil {
		log.Panicf("could not connect: %v", err)
	}
	defer conn.Close()

	client := pb.NewRoomServiceClient(conn)

	// Metadata
	meta := metadata.New(map[string]string{"client-id": clientId})

	// Unary context
	unaryCtx, cancel := context.WithTimeout(context.Background(), time.Second)
	unaryCtx = metadata.NewOutgoingContext(unaryCtx, meta)
	defer cancel()

	// Stream context
	streamCtx, cancel := context.WithCancel(context.Background())
	streamCtx = metadata.NewOutgoingContext(streamCtx, meta)
	defer cancel()

	s, err := client.SubscribeMessages(streamCtx, &pb.SubscribeMessagesRequest{})
	if err != nil {
		log.Panicf("Subscription to server messages failed: %v", err)
	}
	defer func() {
		err := s.CloseSend()
		if err != nil {
			log.Panicf("Unable to close send direction of stream: %v", err)
		}
	}()

	done := make(chan bool)

	go handleServerUpdate(s, done)

	if os.Args[1] == "player1" {
		player1(client, unaryCtx)
	} else if os.Args[1] == "player2" {
		player2(client, unaryCtx, os.Args[2])
	}

	<-done
}
