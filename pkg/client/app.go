//go:build !cli

package main

import (
	"context"
	"errors"
	"io"
	"log"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/keepalive"
	"passeriform.com/nukeship/internal/client"
	"passeriform.com/nukeship/internal/pb"
)

const (
	AppState_INIT                AppState   = "INIT"
	AppState_AWAITING_OPPONENT   AppState   = "AWAITING_OPPONENT"
	AppState_ROOM_FILLED         AppState   = "ROOM_FILLED"
	AppState_AWAITING_READY      AppState   = "AWAITING_READY"
	AppState_OPPONENT_READIED    AppState   = "OPPONENT_READIED"
	AppState_AWAITING_GAME_START AppState   = "AWAITING_GAME_START"
	AppState_IN_GAME             AppState   = "IN_GAME"
	AppState_RECOVERY            AppState   = "RECOVERY"
	Event_STATE_CHANGE_KEY       WailsEvent = "app:stateChange"
	Event_SRV_CONN_CHANGE_KEY    WailsEvent = "app:serverConnectionChange"
)

var AppStates = []struct {
	Value  AppState
	TSName string
}{
	{AppState_INIT, "INIT"},
	{AppState_AWAITING_OPPONENT, "AWAITING_OPPONENT"},
	{AppState_ROOM_FILLED, "ROOM_FILLED"},
	{AppState_AWAITING_READY, "AWAITING_READY"},
	{AppState_OPPONENT_READIED, "OPPONENT_READIED"},
	{AppState_AWAITING_GAME_START, "AWAITING_GAME_START"},
	{AppState_IN_GAME, "IN_GAME"},
	{AppState_RECOVERY, "RECOVERY"},
}

var Events = []struct {
	Value  WailsEvent
	TSName string
}{
	{Event_STATE_CHANGE_KEY, "STATE_CHANGE"},
	{Event_SRV_CONN_CHANGE_KEY, "SERVER_CONNECTION_CHANGE"},
}

type AppState string
type WailsEvent string

type WailsApp struct {
	state   AppState
	Client  pb.RoomServiceClient
	appCtx  context.Context
	grpcCtx context.Context
}

func newClient(ctx context.Context) (pb.RoomServiceClient, error) {
	conn, err := grpc.NewClient(
		client.GetServerHost(ctx)+":"+client.GetServerPort(ctx),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithKeepaliveParams(keepalive.ClientParameters{}),
	)
	if err != nil {
		log.Printf("Could not connect: %v", err)
		return nil, err
	}

	c := pb.NewRoomServiceClient(conn)

	return c, nil
}

func connect(ctx context.Context, app *WailsApp) {
	defer func() {
		app.dispatchServerConnectionChange(false)
	}()

	streamCtx, cancel := client.NewStreamContext(ctx)
	defer cancel()

	streamClient, err := app.Client.SubscribeMessages(streamCtx, &pb.SubscribeMessagesRequest{})
	if err != nil {
		log.Printf("Subscription to server messages failed: %v", err)
		return
	}

	app.dispatchServerConnectionChange(true)
	app.dispatchStateChange(AppState_INIT)

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

		switch update.GetType() {
		case pb.ServerMessage_OPPONENT_JOINED:
			app.dispatchStateChange(AppState_ROOM_FILLED)
		case pb.ServerMessage_OPPONENT_READY:
			app.dispatchStateChange(AppState_AWAITING_GAME_START)
		case pb.ServerMessage_GAME_STARTED:
			app.dispatchStateChange(AppState_IN_GAME)
		case pb.ServerMessage_OPPONENT_REVERTED_READY:
			app.dispatchStateChange(AppState_AWAITING_GAME_START)
		case pb.ServerMessage_OPPONENT_LEFT:
			if app.state == AppState_IN_GAME {
				app.dispatchStateChange(AppState_RECOVERY)
			} else {
				app.dispatchStateChange(AppState_AWAITING_OPPONENT)
			}
		}
	}
}

func newWailsApp(grpcCtx context.Context) *WailsApp {
	return &WailsApp{state: AppState_INIT, grpcCtx: grpcCtx}
}

func (w *WailsApp) setAppCtx(appCtx context.Context) {
	w.appCtx = appCtx
}

func (w *WailsApp) dispatchStateChange(state AppState) {
	runtime.EventsEmit(w.appCtx, string(Event_STATE_CHANGE_KEY), state)
	w.state = state
}

func (w *WailsApp) dispatchServerConnectionChange(connected bool) {
	runtime.EventsEmit(w.appCtx, string(Event_SRV_CONN_CHANGE_KEY), connected)
}

func (w *WailsApp) GetAppState() AppState {
	return w.state
}

func (w *WailsApp) CreateRoom() (string, error) {
	unaryCtx, cancel := client.NewUnaryContext(w.grpcCtx)
	defer cancel()

	r, err := w.Client.CreateRoom(unaryCtx, &pb.CreateRoomRequest{})
	if err != nil {
		log.Printf("Could not create room: %v", err)
		return "", err
	}

	log.Printf("Room created: %s", r.GetRoomId())

	w.dispatchStateChange(AppState_AWAITING_OPPONENT)

	return r.GetRoomId(), nil
}

func (w *WailsApp) JoinRoom(roomCode string) bool {
	unaryCtx, cancel := client.NewUnaryContext(w.grpcCtx)
	defer cancel()

	r, err := w.Client.JoinRoom(unaryCtx, &pb.JoinRoomRequest{RoomId: roomCode})
	if err != nil {
		log.Printf("Could not join room with id: %v", err)
		return false
	}

	log.Printf("Room joined: %s", r.GetStatus().String())

	w.dispatchStateChange(AppState_AWAITING_OPPONENT)

	return r.GetStatus() == pb.ResponseStatus_OK
}
