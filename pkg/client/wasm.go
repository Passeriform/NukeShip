//go:build wasm

package main

import (
	"context"

	"nukeship/internal/pb"

	"syscall/js"
)

func postClientSetup(client pb.RoomServiceClient, ctx context.Context, done chan<- bool) {
	js.Global().Set("createRoom", js.FuncOf(func(this js.Value, args []js.Value) any {
		createRoom(client, ctx)
		return true
	}))
	js.Global().Set("joinRoom", js.FuncOf(func(this js.Value, args []js.Value) any {
		joinRoom(client, ctx, args[0].String())
		return true
	}))
	js.Global().Set("close", js.FuncOf(func(this js.Value, args []js.Value) any {
		done <- true
		return true
	}))
}
