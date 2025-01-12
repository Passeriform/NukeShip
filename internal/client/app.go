//go:build gui

package client

import (
	"context"
	"log"

	"passeriform.com/nukeship/internal/pb"
)

type WailsApp struct {
	Client pb.RoomServiceClient
	ctx    context.Context
}

func NewWailsApp(ctx context.Context) *WailsApp {
	return &WailsApp{ctx: ctx}
}

func (w *WailsApp) CreateRoom() (string, error) {
	unaryCtx, cancel := NewUnaryContext(w.ctx)
	defer cancel()

	r, err := w.Client.CreateRoom(unaryCtx, &pb.CreateRoomRequest{})
	if err != nil {
		log.Printf("Could not create room: %v", err)
		return "", err
	}

	log.Printf("Room created: %s", r.GetRoomId())

	return r.GetRoomId(), nil
}

func (w *WailsApp) JoinRoom(roomCode string) bool {
	unaryCtx, cancel := NewUnaryContext(w.ctx)
	defer cancel()

	r, err := w.Client.JoinRoom(unaryCtx, &pb.JoinRoomRequest{RoomId: roomCode})
	if err != nil {
		log.Printf("Could not join room with id: %v", err)
		return false
	}

	log.Printf("Room joined: %s", r.GetStatus().String())

	return r.GetStatus() == pb.ResponseStatus_OK
}
