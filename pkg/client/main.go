package main

import (
	"context"
	"io"
	"log"
	"time"

	"nukeship/internal/pb"
	"nukeship/internal/utility"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/keepalive"
)

var keepAliveParams = keepalive.ClientParameters{}

func main() {
	clientId := utility.NewRandomString(5)

	conn, err := grpc.NewClient("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()), grpc.WithKeepaliveParams(keepAliveParams))

	if err != nil {
		log.Panicf("could not connect: %v", err)
	}
	defer conn.Close()

	client := pb.NewRoomServiceClient(conn)

	// Normal context
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	// Subscription context
	subCtx, cancel := context.WithCancel(context.Background())
	defer cancel()

	s, err := client.SubscribeMessages(subCtx, &pb.SubscribeMessagesRequest{ClientId: clientId})
	if err != nil {
		log.Panicf("subscription to server messages failed: %v", err)
	}

	done := make(chan bool)

	go func() error {
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
	}()

	r, err := client.CreateRoom(ctx, &pb.CreateRoomRequest{ClientId: clientId})
	if err != nil {
		log.Panicf("could not create room: %v", err)
	}

	log.Printf("Room created: %s", r.GetRoomId())

	<-done
}
