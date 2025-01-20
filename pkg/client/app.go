//go:build !cli

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

	"passeriform.com/nukeship/internal/client"
	"passeriform.com/nukeship/internal/pb"
)

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
	grpcCtx      context.Context
	Client       pb.RoomServiceClient
	stateMachine *client.StateFSM
	connMachine  *client.ConnectionFSM
}

// TODO: Added for temporary compatibility. Remove on migration to wails3.
func parseAppState(str string) AppState {
	switch str {
	case "INIT":
		return AppState_INIT
	case "AWAITING_OPPONENT":
		return AppState_AWAITING_OPPONENT
	case "ROOM_FILLED":
		return AppState_ROOM_FILLED
	case "AWAITING_READY":
		return AppState_AWAITING_READY
	case "AWAITING_GAME_START":
		return AppState_AWAITING_GAME_START
	case "IN_GAME":
		return AppState_IN_GAME
	case "RECOVERY":
		return AppState_RECOVERY
	}

	log.Panicf("Unable to parse value into AppState: %v", str)

	return AppState_INIT
}

func newClient(ctx context.Context) (pb.RoomServiceClient, error) {
	cCtx := client.UnwrapContext(ctx)

	var creds credentials.TransportCredentials

	if cCtx.EnableTLS {
		// TODO: This TLS configuration is only for prototyping. Replace with proper 2-way TLS configuration.
		creds = credentials.NewTLS(&tls.Config{InsecureSkipVerify: true})
	} else {
		creds = insecure.NewCredentials()
	}

	conn, err := grpc.NewClient(
		cCtx.ServerHost+":"+strconv.Itoa(cCtx.ServerPort),
		grpc.WithTransportCredentials(creds),
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
		app.connMachine.Fire(client.Disconnected)
	}()

	streamCtx, cancel := client.NewStreamContext(ctx)
	defer cancel()

	streamClient, err := app.Client.SubscribeMessages(streamCtx, &pb.SubscribeMessagesRequest{})
	if err != nil {
		log.Printf("Subscription to server messages failed: %v", err)
		return
	}

	app.connMachine.Fire(client.Connected)

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

		app.stateMachine.Fire(update.GetType().String())
	}
}

func newWailsApp(grpcCtx context.Context) *WailsApp {
	app := &WailsApp{
		grpcCtx:      grpcCtx,
		Client:       nil,
		stateMachine: nil,
		connMachine:  nil,
	}

	return app
}

func (app *WailsApp) GetAppState() AppState {
	return AppState(app.stateMachine.GetState())
}

func (app *WailsApp) GetConnectionState() bool {
	return app.connMachine.GetState() == client.Connected
}

func (app *WailsApp) UpdateReady(ready bool) (bool, error) {
	unaryCtx, cancel := client.NewUnaryContext(app.grpcCtx)
	defer cancel()

	// TODO: Use error codes middleware to handle RPC errors properly.
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

	if !ready {
		app.stateMachine.Fire(string(AppState_ROOM_FILLED))
		return resp.GetStatus() == pb.ResponseStatus_OK, nil
	}

	app.stateMachine.Fire(client.ClientMessage_SELF_READY)

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

	app.stateMachine.Fire(client.ClientMessage_SELF_JOINED)

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

	app.stateMachine.Fire(client.ClientMessage_SELF_JOINED)

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

	app.stateMachine.Fire(string(AppState_INIT))

	return resp.GetStatus() == pb.ResponseStatus_OK
}
