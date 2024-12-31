//go:build !wasm

package main

import (
	"context"
	"log"

	"github.com/jxskiss/mcli"

	"passeriform.com/nukeship/internal/pb"
)

func createRoomCmd(client pb.RoomServiceClient, ctx context.Context) func() {
	return func() {
		var args struct{}

		if _, err := mcli.Parse(&args); err != nil {
			log.Panicf("Error occurred while parsing arguments for `createRoom` command: %v", err)
		}

		createRoom(client, ctx)
	}
}

func joinRoomCmd(client pb.RoomServiceClient, ctx context.Context) func() {
	return func() {
		var args struct {
			RoomCode string `cli:"#R, -c, --code, Room code to join"`
		}

		if _, err := mcli.Parse(&args); err != nil {
			log.Panicf("Error occurred while parsing arguments for `joinRoom` command: %v", err)
		}

		joinRoom(client, ctx, args.RoomCode)
	}
}

func handleApp(client pb.RoomServiceClient, ctx context.Context, _ chan<- bool) {
	mcli.Add("createRoom", createRoomCmd(client, ctx), "Launch client and create a room", mcli.EnableFlagCompletion())
	mcli.Add("joinRoom", joinRoomCmd(client, ctx), "Launch client and join a room", mcli.EnableFlagCompletion())
	mcli.AddHelp()
	mcli.AddCompletion()
	mcli.Run()
}
