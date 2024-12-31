//go:build wasm

package main

import (
	"context"
	"syscall/js"

	"passeriform.com/nukeship/internal/pb"
)

func createRoomFunc(client pb.RoomServiceClient, ctx context.Context) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) any {
		createRoom(client, ctx)
		return true
	})
}

func joinRoomFunc(client pb.RoomServiceClient, ctx context.Context) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) any {
		joinRoom(client, ctx, args[0].String())
		return true
	})
}

func closeFunc(done chan<- bool) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) any {
		done <- true
		return true
	})
}

func handleApp(client pb.RoomServiceClient, ctx context.Context, done chan<- bool) {
	js.Global().Set("createRoom", createRoomFunc(client, ctx))
	js.Global().Set("joinRoom", joinRoomFunc(client, ctx))
	js.Global().Set("close", closeFunc(done))
}
