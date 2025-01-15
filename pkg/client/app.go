//go:build !cli

package main

import (
	"context"
	"errors"
	"io"
	"log"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/keepalive"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"passeriform.com/nukeship/internal/client"
	"passeriform.com/nukeship/internal/pb"
)

// TODO: Handle state management using custom FSM that uses struct tags.

const (
	//nolint:revive,stylecheck // Using underscores in accordance with generated code.
	AppState_INIT AppState = "INIT"
	//nolint:revive,stylecheck // Using underscores in accordance with generated code.
	AppState_AWAITING_OPPONENT AppState = "AWAITING_OPPONENT"
	//nolint:revive,stylecheck // Using underscores in accordance with generated code.
	AppState_ROOM_FILLED AppState = "ROOM_FILLED"
	//nolint:revive,stylecheck // Using underscores in accordance with generated code.
	AppState_AWAITING_READY AppState = "AWAITING_READY"
	//nolint:revive,stylecheck // Using underscores in accordance with generated code.
	AppState_AWAITING_GAME_START AppState = "AWAITING_GAME_START"
	//nolint:revive,stylecheck // Using underscores in accordance with generated code.
	AppState_IN_GAME AppState = "IN_GAME"
	//nolint:revive,stylecheck // Using underscores in accordance with generated code.
	AppState_RECOVERY AppState = "RECOVERY"

	//nolint:revive,stylecheck // Using underscores in accordance with generated code.
	Event_STATE_CHANGE_KEY WailsEvent = "app:stateChange"
	//nolint:revive,stylecheck // Using underscores in accordance with generated code.
	Event_SRV_CONN_CHANGE_KEY WailsEvent = "app:serverConnectionChange"
)

var (
	//nolint:gochecknoglobals // Creating enum mapping for typescript generation.
	appStates = []struct {
		Value  AppState
		TSName string
	}{
		{AppState_INIT, "INIT"},
		{AppState_AWAITING_OPPONENT, "AWAITING_OPPONENT"},
		{AppState_ROOM_FILLED, "ROOM_FILLED"},
		{AppState_AWAITING_READY, "AWAITING_READY"},
		{AppState_AWAITING_GAME_START, "AWAITING_GAME_START"},
		{AppState_IN_GAME, "IN_GAME"},
		{AppState_RECOVERY, "RECOVERY"},
	}

	//nolint:gochecknoglobals // Creating enum mapping for typescript generation.
	events = []struct {
		Value  WailsEvent
		TSName string
	}{
		{Event_STATE_CHANGE_KEY, "STATE_CHANGE"},
		{Event_SRV_CONN_CHANGE_KEY, "SERVER_CONNECTION_CHANGE"},
	}
)

type (
	AppState string

	WailsEvent string
)

type WailsApp struct {
	//nolint:containedctx // Wails enforces usage of contexts within structs for binding.
	appCtx context.Context
	//nolint:containedctx // Wails enforces usage of contexts within structs for binding.
	grpcCtx       context.Context
	Client        pb.RoomServiceClient
	state         AppState
	connected     bool
	opponentReady bool
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

// TODO: Add reconnection logic to recover streaming messages.

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
			if app.state == AppState_AWAITING_READY {
				app.dispatchStateChange(AppState_AWAITING_GAME_START)
			}

			app.opponentReady = true
		case pb.ServerMessage_GAME_STARTED:
			app.dispatchStateChange(AppState_IN_GAME)
		case pb.ServerMessage_OPPONENT_REVERTED_READY:
			app.dispatchStateChange(AppState_AWAITING_READY)
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
	return &WailsApp{
		connected:     false,
		opponentReady: false,
		state:         AppState_INIT,
		Client:        nil,
		appCtx:        nil,
		grpcCtx:       grpcCtx,
	}
}

func (app *WailsApp) setAppCtx(appCtx context.Context) {
	app.appCtx = appCtx
}

func (app *WailsApp) dispatchStateChange(state AppState) {
	runtime.EventsEmit(app.appCtx, string(Event_STATE_CHANGE_KEY), state)

	app.state = state
}

func (app *WailsApp) dispatchServerConnectionChange(connected bool) {
	runtime.EventsEmit(app.appCtx, string(Event_SRV_CONN_CHANGE_KEY), connected)

	app.connected = connected
}

func (app *WailsApp) GetAppState() AppState {
	return app.state
}

func (app *WailsApp) GetConnectionState() bool {
	return app.connected
}

func (app *WailsApp) UpdateReady(ready bool) (bool, error) {
	unaryCtx, cancel := client.NewUnaryContext(app.grpcCtx)
	defer cancel()

	resp, err := app.Client.UpdateReady(unaryCtx, &pb.UpdateReadyRequest{Ready: ready})
	if err != nil {
		log.Printf("Could not update ready state: %v", err)
		return false, err
	}

	if resp.GetStatus() == pb.ResponseStatus_NO_ROOM_JOINED_YET {
		log.Printf("Unable to ready as the room is invalid")
		return false, nil
	}

	log.Printf("Updated ready state: %t", ready)

	if ready {
		if app.opponentReady {
			app.dispatchStateChange(AppState_AWAITING_GAME_START)
		} else {
			app.dispatchStateChange(AppState_AWAITING_READY)
		}
	} else {
		app.dispatchStateChange(AppState_ROOM_FILLED)
	}

	return resp.GetStatus() == pb.ResponseStatus_OK, nil
}

func (app *WailsApp) CreateRoom() (string, error) {
	unaryCtx, cancel := client.NewUnaryContext(app.grpcCtx)
	defer cancel()

	resp, err := app.Client.CreateRoom(unaryCtx, &pb.CreateRoomRequest{})
	if err != nil {
		log.Printf("Could not create room: %v", err)
		return "", err
	}

	log.Printf("Room created: %s", resp.GetRoomId())

	app.dispatchStateChange(AppState_AWAITING_OPPONENT)

	return resp.GetRoomId(), nil
}

func (app *WailsApp) JoinRoom(roomCode string) bool {
	unaryCtx, cancel := client.NewUnaryContext(app.grpcCtx)
	defer cancel()

	resp, err := app.Client.JoinRoom(unaryCtx, &pb.JoinRoomRequest{RoomId: roomCode})
	if err != nil {
		log.Printf("Could not join room with id %v: %v", roomCode, err)
		return false
	}

	log.Printf("Room joined status: %s", resp.GetStatus().String())

	app.dispatchStateChange(AppState_ROOM_FILLED)

	return resp.GetStatus() == pb.ResponseStatus_OK
}

func (app *WailsApp) LeaveRoom() bool {
	unaryCtx, cancel := client.NewUnaryContext(app.grpcCtx)
	defer cancel()

	resp, err := app.Client.LeaveRoom(unaryCtx, &pb.LeaveRoomRequest{})
	if err != nil {
		log.Printf("Could not leave room: %v", err)
		return false
	}

	log.Printf("Room left status: %s", resp.GetStatus().String())

	app.dispatchStateChange(AppState_INIT)

	return resp.GetStatus() == pb.ResponseStatus_OK
}
