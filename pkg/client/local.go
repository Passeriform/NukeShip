//go:build !wasm

package main

import (
	"context"

	"nukeship/internal/pb"

	"os"
)

func postClientSetup(client pb.RoomServiceClient, ctx context.Context, _ chan<- bool) {
	if len(os.Args) == 2 {
		createRoom(client, ctx)
	} else if len(os.Args) == 3 {
		joinRoom(client, ctx, os.Args[2])
	}
}
