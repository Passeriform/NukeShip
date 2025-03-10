//go:build !cli

package main

import (
	"context"
	"crypto/tls"
	"errors"
	"io"
	"strconv"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/keepalive"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/Gurpartap/statemachine-go"

	"passeriform.com/nukeship/internal/client"
	"passeriform.com/nukeship/internal/game"
	"passeriform.com/nukeship/internal/pb"
)

const (
	StateChangeEvent            Event = "srv:stateChange"
	ServerConnectionChangeEvent Event = "srv:serverConnectionChange"
)

type (
	Event string
)

type WailsApp struct {
	//nolint:containedctx // Wails enforces usage of contexts within structs for binding.
	wailsCtx context.Context
	//nolint:containedctx // Wails enforces usage of contexts within structs for binding.
	configCtx    context.Context
	RoomClient   pb.RoomServiceClient
	GameClient   pb.GameServiceClient
	connMachine  client.ConnectionFSM
	stateMachine client.RoomStateFSM
}

func (app *WailsApp) setAppContext(wailsCtx, configCtx context.Context) {
	app.wailsCtx = wailsCtx
	app.configCtx = configCtx
}

func (app *WailsApp) initGrpcClients() {
	cCtx := client.UnwrapContext(app.configCtx)

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
		runtime.LogErrorf(app.wailsCtx, "Could not connect: %v", err)
	}

	app.RoomClient, app.GameClient = pb.NewRoomServiceClient(conn), pb.NewGameServiceClient(conn)
}

func (app *WailsApp) initStateMachines() {
	app.stateMachine = client.NewRoomStateFSM(func(t statemachine.Transition) {
		if t.To() == client.RoomStateInGame.String() {
			tree := game.NewFsTree("C:\\Windows", game.TreeGenOptions{
				Ignore:          game.DefaultTreeGenIgnores,
				VisibilityDepth: 8,
				Depth:           8,
				Width:           20,
			})

			app.publishGameState(&tree)
		}

		runtime.EventsEmit(app.wailsCtx, string(StateChangeEvent), client.MustParseRoomState(t.To()))
	})

	app.connMachine = client.NewConnectionFSM(func(t statemachine.Transition) {
		runtime.EventsEmit(app.wailsCtx, string(ServerConnectionChangeEvent), t.To() == client.ConnectionStateConnected.String())
	})
}

func (app *WailsApp) publishGameState(tree *pb.FsTree) {
	unaryCtx, cancel := client.NewUnaryContext(app.configCtx)
	defer cancel()

	_, err := app.GameClient.AddPlayer(unaryCtx, &pb.AddPlayerRequest{Tree: tree})
	if err != nil {
		runtime.LogErrorf(app.wailsCtx, "Could not publish player state: %v", err)
		return
	}

	runtime.LogDebug(app.wailsCtx, "Published player state")
}

// TODO: Add reconnection logic to recover streaming messages.

func (app *WailsApp) connect() {
	defer func() {
		app.connMachine.Fire(client.LocalEventDisconnected.String())
	}()

	streamCtx, cancel := client.NewStreamContext(app.configCtx)
	defer cancel()

	streamClient, err := app.RoomClient.SubscribeMessages(streamCtx, &pb.SubscribeMessagesRequest{})
	if err != nil {
		runtime.LogErrorf(app.wailsCtx, "Subscription to server messages failed: %v", err)
		return
	}

	app.connMachine.Fire(client.LocalEventConnected.String())

	for {
		update, err := streamClient.Recv()
		if errors.Is(err, io.EOF) {
			runtime.LogError(app.wailsCtx, "Stopped receiving updates from server.")
			return
		}

		if err != nil {
			runtime.LogErrorf(app.wailsCtx, "Received error frame: %v", err)
			return
		}

		app.stateMachine.Fire(update.GetType().String())
	}
}

func newWailsApp() *WailsApp {
	app := &WailsApp{
		wailsCtx:   nil,
		configCtx:  nil,
		RoomClient: nil,
		GameClient: nil,
	}

	return app
}

func (app *WailsApp) GetAppState() client.RoomState {
	return client.MustParseRoomState(app.stateMachine.GetState())
}

func (app *WailsApp) GetConnectionState() bool {
	return app.connMachine.GetState() == client.ConnectionStateConnected.String()
}

func (app *WailsApp) UpdateReady(ready bool) (bool, error) {
	unaryCtx, cancel := client.NewUnaryContext(app.configCtx)
	defer cancel()

	// TODO: Use error codes middleware to handle RPC errors properly.
	resp, err := app.RoomClient.UpdateReady(unaryCtx, &pb.UpdateReadyRequest{Ready: ready})
	if err != nil {
		runtime.LogErrorf(app.wailsCtx, "Could not update ready state: %v", err)
		return false, err
	}

	if resp.GetStatus() == pb.ResponseStatus_NoRoomJoinedYet {
		runtime.LogError(app.wailsCtx, "Unable to ready as the room is invalid")
		return false, nil
	}

	runtime.LogDebugf(app.wailsCtx, "Updated ready state: %t", ready)

	if !ready {
		app.stateMachine.Fire(client.LocalEventSelfRevertedReady.String())
		return resp.GetStatus() == pb.ResponseStatus_Ok, nil
	}

	app.stateMachine.Fire(client.LocalEventSelfReady.String())

	return resp.GetStatus() == pb.ResponseStatus_Ok, nil
}

func (app *WailsApp) CreateRoom() (string, error) {
	unaryCtx, cancel := client.NewUnaryContext(app.configCtx)
	defer cancel()

	resp, err := app.RoomClient.CreateRoom(unaryCtx, &pb.CreateRoomRequest{})
	if err != nil {
		runtime.LogErrorf(app.wailsCtx, "Could not create room: %v", err)
		return "", err
	}

	runtime.LogDebugf(app.wailsCtx, "Room created: %s", resp.GetRoomId())

	app.stateMachine.Fire(client.LocalEventSelfJoined.String())

	return resp.GetRoomId(), nil
}

func (app *WailsApp) JoinRoom(roomCode string) bool {
	unaryCtx, cancel := client.NewUnaryContext(app.configCtx)
	defer cancel()

	resp, err := app.RoomClient.JoinRoom(unaryCtx, &pb.JoinRoomRequest{RoomId: roomCode})
	if err != nil {
		runtime.LogErrorf(app.wailsCtx, "Could not join room with id %v: %v", roomCode, err)
		return false
	}

	runtime.LogDebugf(app.wailsCtx, "Room joined status: %s", resp.GetStatus().String())

	app.stateMachine.Fire(client.LocalEventSelfJoined.String())

	return resp.GetStatus() == pb.ResponseStatus_Ok
}

func (app *WailsApp) LeaveRoom() bool {
	unaryCtx, cancel := client.NewUnaryContext(app.configCtx)
	defer cancel()

	resp, err := app.RoomClient.LeaveRoom(unaryCtx, &pb.LeaveRoomRequest{})
	if err != nil {
		runtime.LogErrorf(app.wailsCtx, "Could not leave room: %v", err)
		return false
	}

	runtime.LogDebugf(app.wailsCtx, "Room left status: %s", resp.GetStatus().String())

	app.stateMachine.Fire(client.LocalEventSelfLeft.String())

	return resp.GetStatus() == pb.ResponseStatus_Ok
}
