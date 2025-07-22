//go:build cli
// +build cli

package main

import (
	"context"
	"crypto/tls"
	"errors"
	"io"
	"log"
	"strconv"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/keepalive"

	"github.com/jxskiss/mcli"

	"passeriform.com/nukeship/internal/client"
	"passeriform.com/nukeship/internal/pb"
)

func newClient(configCtx context.Context) (pb.RoomServiceClient, error) {
	var creds credentials.TransportCredentials

	if Config.EnableTLS {
		//nolint:gosec // TODO: This configuration is only for prototyping. Replace with proper 2-way TLS configuration.
		creds = credentials.NewTLS(&tls.Config{InsecureSkipVerify: true})
	} else {
		creds = insecure.NewCredentials()
	}

	conn, err := grpc.NewClient(
		Config.ServerHost+":"+strconv.Itoa(Config.ServerPort),
		grpc.WithTransportCredentials(creds),
		grpc.WithKeepaliveParams(keepalive.ClientParameters{}),
	)
	if err != nil {
		log.Panicf("Could not connect: %v", err)
		return nil, err
	}

	c := pb.NewRoomServiceClient(conn)

	return c, nil
}

func connect(
	ctx context.Context,
	rsc pb.RoomServiceClient,
	handler func(pb.RoomServiceEvent),
	done chan<- bool,
) {
	defer func() {
		done <- true
	}()

	streamCtx, cancel := client.NewStreamContext(ctx)
	defer cancel()

	streamClient, err := rsc.SubscribeMessages(streamCtx, &pb.SubscribeMessagesRequest{})
	if err != nil {
		log.Printf("Subscription to server messages failed: %v", err)
		return
	}

	for {
		update, err := streamClient.Recv()
		if errors.Is(err, io.EOF) {
			log.Println("Stopped receiving updates from server.")
			return
		}

		if err != nil {
			log.Printf("Received error frame: %v", err)
			return
		}

		handler(update.GetType())
	}
}

func createRoom(ctx context.Context, rsc pb.RoomServiceClient) {
	unaryCtx, cancel := client.NewUnaryContext(ctx)
	defer cancel()

	room, err := rsc.CreateRoom(unaryCtx, &pb.CreateRoomRequest{})
	if err != nil {
		log.Printf("Could not create room: %v", err)
		return
	}

	log.Printf("Room created: %s", room.GetRoomId())
}

func joinRoom(ctx context.Context, rsc pb.RoomServiceClient, roomCode string) {
	unaryCtx, cancel := client.NewUnaryContext(ctx)
	defer cancel()

	room, err := rsc.JoinRoom(unaryCtx, &pb.JoinRoomRequest{RoomId: roomCode})
	if err != nil {
		log.Printf("Could not join room with id: %v", err)
		return
	}

	log.Printf("Room joined: %s", room.GetStatus().String())
}

func RunApp(ctx context.Context, handler func(pb.RoomServiceEvent)) {
	done := make(chan bool)

	mcli.Add("createRoom", func() {
		var args struct{}

		if _, err := mcli.Parse(&args); err != nil {
			log.Panicf("Error occurred while parsing arguments for `createRoom` command: %v", err)
		}

		rsc, err := newClient(ctx)
		if err != nil {
			log.Panicf("Error occurred while creating client: %v", err)
		}

		go connect(ctx, rsc, handler, done)
		go createRoom(ctx, rsc)
	}, "Launch client and create a room", mcli.EnableFlagCompletion())

	mcli.Add("joinRoom", func() {
		var args struct {
			RoomCode string `cli:"#R, -c, --code, Room code to join"`
		}

		if _, err := mcli.Parse(&args); err != nil {
			log.Panicf("Error occurred while parsing arguments for `joinRoom` command: %v", err)
		}

		rsc, err := newClient(ctx)
		if err != nil {
			log.Panicf("Error occurred while creating client: %v", err)
		}

		go connect(ctx, rsc, handler, done)
		go joinRoom(ctx, rsc, args.RoomCode)
	}, "Launch client and join a room", mcli.EnableFlagCompletion())

	mcli.AddHelp()
	mcli.AddCompletion()
	mcli.Run()

	<-done
}
