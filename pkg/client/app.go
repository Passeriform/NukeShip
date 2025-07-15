//go:build !cli

package main

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"io"
	"strconv"
	"time"

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

	connMachineFireLogPattern   string = "Cannot fire event %v to connection state machine: %v"
	roomMachineFireLogPattern   string = "Cannot fire event %v to room state machine: %v"
	machineRollbackErrorPattern string = "Rolling back state transition: %v"

	treeGenDepth           int = 8
	treeGenWidth           int = 20
	treeGenVisibilityDepth int = 8
)

var (
	KeepAliveClientParameters = keepalive.ClientParameters{
		Time:    30 * time.Second,
		Timeout: 10 * time.Second,
	}
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

//nolint:fatcontext // Wails requires the context to be stored within the app struct to provide bindings.
func (app *WailsApp) setAppContext(wailsCtx, configCtx context.Context) {
	app.wailsCtx = wailsCtx
	app.configCtx = configCtx
}

func (app *WailsApp) initGrpcClients() {
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
		grpc.WithKeepaliveParams(KeepAliveClientParameters),
	)
	if err != nil {
		runtime.LogErrorf(app.wailsCtx, "Could not connect: %v", err)
	}

	app.RoomClient, app.GameClient = pb.NewRoomServiceClient(conn), pb.NewGameServiceClient(conn)
}

func (app *WailsApp) initStateMachines(wailsCtx, configCtx context.Context) {
	app.stateMachine = client.NewRoomStateFSM(func(transition statemachine.Transition) {
		if transition.To() == client.RoomStateInGame.String() {
			tree := game.NewFsTree("C:\\Windows", game.TreeGenOptions{
				Ignore:          game.DefaultTreeGenIgnores[:],
				VisibilityDepth: treeGenVisibilityDepth,
				Depth:           treeGenDepth,
				Width:           treeGenWidth,
			})

			app.publishGameState(wailsCtx, configCtx, &tree)
		}

		runtime.EventsEmit(
			wailsCtx,
			string(StateChangeEvent),
			client.MustParseRoomState(transition.To()),
		)
	})

	app.connMachine = client.NewConnectionFSM(func(t statemachine.Transition) {
		runtime.EventsEmit(
			wailsCtx,
			string(ServerConnectionChangeEvent),
			t.To() == client.ConnectionStateConnected.String(),
		)
	})
}

func (app *WailsApp) publishGameState(wailsCtx, configCtx context.Context, tree *pb.FsTree) {
	unaryCtx, cancel := client.NewUnaryContext(configCtx)
	defer cancel()

	_, err := app.GameClient.AddPlayer(unaryCtx, &pb.AddPlayerRequest{Tree: tree})
	if err != nil {
		runtime.LogErrorf(wailsCtx, "Could not publish player state: %v", err)
		return
	}

	runtime.LogDebug(wailsCtx, "Published player state")
}

// TODO: Add reconnection logic to recover streaming messages.

//nolint:gocognit,revive // This method is currently segregated on concerns and readable.
func (app *WailsApp) connect(wailsCtx, configCtx context.Context) {
	defer func() {
		if err := app.connMachine.Fire(client.LocalEventDisconnected.String()); err != nil {
			runtime.LogErrorf(
				wailsCtx,
				connMachineFireLogPattern,
				client.LocalEventDisconnected.String(),
				err,
			)
		}
	}()

	streamCtx, cancel := client.NewStreamContext(configCtx)
	defer cancel()

	streamClient, err := app.RoomClient.SubscribeMessages(streamCtx, &pb.SubscribeMessagesRequest{})
	if err != nil {
		runtime.LogErrorf(wailsCtx, "Subscription to server messages failed: %v", err)
		return
	}

	if err := app.connMachine.Fire(client.LocalEventConnected.String()); err != nil {
		runtime.LogErrorf(
			wailsCtx,
			connMachineFireLogPattern,
			client.LocalEventConnected.String(),
			err,
		)
	}

	for {
		update, err := streamClient.Recv()
		if errors.Is(err, io.EOF) {
			runtime.LogError(wailsCtx, "Stopped receiving updates from server.")
			return
		}

		if err != nil {
			runtime.LogErrorf(wailsCtx, "Received error frame: %v", err)
			return
		}

		if err := app.stateMachine.Fire(update.GetType().String()); err != nil {
			runtime.LogErrorf(
				wailsCtx,
				roomMachineFireLogPattern,
				update.GetType().String(),
				err,
			)
		}
	}
}

func newWailsApp() *WailsApp {
	app := &WailsApp{
		wailsCtx:     nil,
		configCtx:    nil,
		RoomClient:   nil,
		GameClient:   nil,
		connMachine:  client.ConnectionFSM{},
		stateMachine: client.RoomStateFSM{},
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
	var rollback func() error
	if !ready {
		rb, err := app.stateMachine.FireWithRollback(client.LocalEventSelfRevertedReady.String())
		if err != nil {
			runtime.LogErrorf(
				app.wailsCtx,
				roomMachineFireLogPattern,
				client.LocalEventSelfRevertedReady.String(),
				err,
			)
		}
		rollback = rb
	} else {
		rb, err := app.stateMachine.FireWithRollback(client.LocalEventSelfReady.String())
		if err != nil {
			runtime.LogErrorf(
				app.wailsCtx,
				roomMachineFireLogPattern,
				client.LocalEventSelfReady.String(),
				err,
			)
		}
		rollback = rb
	}

	unaryCtx, cancel := client.NewUnaryContext(app.configCtx)
	defer cancel()

	// TODO: Use error codes middleware to handle RPC errors properly.
	resp, err := app.RoomClient.UpdateReady(unaryCtx, &pb.UpdateReadyRequest{Ready: ready})
	if err != nil {
		runtime.LogErrorf(app.wailsCtx, "Could not update ready state: %v", err)

		if err := rollback(); err != nil {
			runtime.LogFatalf(
				app.wailsCtx,
				machineRollbackErrorPattern,
				err,
			)
		}

		return false, fmt.Errorf("could not update ready state: %w", err)
	}

	if resp.GetStatus() == pb.ResponseStatus_NoRoomJoinedYet {
		runtime.LogError(app.wailsCtx, "Unable to ready as the room is invalid")

		if err := rollback(); err != nil {
			runtime.LogFatalf(
				app.wailsCtx,
				machineRollbackErrorPattern,
				err,
			)
		}

		return false, fmt.Errorf("unable to ready as the room is invalid: %w", err)
	}

	runtime.LogDebugf(app.wailsCtx, "Updated ready state: %t", ready)

	return resp.GetStatus() == pb.ResponseStatus_Ok, nil
}

func (app *WailsApp) CreateRoom() (string, error) {
	rollback, err := app.stateMachine.FireWithRollback(client.LocalEventSelfJoined.String())
	if err != nil {
		runtime.LogErrorf(
			app.wailsCtx,
			roomMachineFireLogPattern,
			client.LocalEventSelfJoined.String(),
			err,
		)
	}

	unaryCtx, cancel := client.NewUnaryContext(app.configCtx)
	defer cancel()

	resp, err := app.RoomClient.CreateRoom(unaryCtx, &pb.CreateRoomRequest{})
	if err != nil {
		runtime.LogErrorf(app.wailsCtx, "Could not create room: %v", err)

		if err := rollback(); err != nil {
			runtime.LogFatalf(
				app.wailsCtx,
				machineRollbackErrorPattern,
				err,
			)
		}

		return "", fmt.Errorf("could not create room: %w", err)
	}

	runtime.LogDebugf(app.wailsCtx, "Room created: %s", resp.GetRoomId())

	return resp.GetRoomId(), nil
}

func (app *WailsApp) JoinRoom(roomCode string) bool {
	rollback, err := app.stateMachine.FireWithRollback(client.LocalEventSelfJoined.String())
	if err != nil {
		runtime.LogErrorf(
			app.wailsCtx,
			roomMachineFireLogPattern,
			client.LocalEventSelfJoined.String(),
			err,
		)
	}

	unaryCtx, cancel := client.NewUnaryContext(app.configCtx)
	defer cancel()

	resp, err := app.RoomClient.JoinRoom(unaryCtx, &pb.JoinRoomRequest{RoomId: roomCode})
	if err != nil {
		runtime.LogErrorf(app.wailsCtx, "Could not join room with id %v: %v", roomCode, err)

		if err := rollback(); err != nil {
			runtime.LogFatalf(
				app.wailsCtx,
				machineRollbackErrorPattern,
				err,
			)
		}

		return false
	}

	runtime.LogDebugf(app.wailsCtx, "Room joined status: %s", resp.GetStatus().String())

	return resp.GetStatus() == pb.ResponseStatus_Ok
}

func (app *WailsApp) LeaveRoom() bool {
	rollback, err := app.stateMachine.FireWithRollback(client.LocalEventSelfLeft.String())
	if err != nil {
		runtime.LogErrorf(
			app.wailsCtx,
			roomMachineFireLogPattern,
			client.LocalEventSelfLeft.String(),
			err,
		)
	}

	unaryCtx, cancel := client.NewUnaryContext(app.configCtx)
	defer cancel()

	resp, err := app.RoomClient.LeaveRoom(unaryCtx, &pb.LeaveRoomRequest{})
	if err != nil {
		runtime.LogErrorf(app.wailsCtx, "Could not leave room: %v", err)

		if err := rollback(); err != nil {
			runtime.LogFatalf(
				app.wailsCtx,
				machineRollbackErrorPattern,
				err,
			)
		}

		return false
	}

	runtime.LogDebugf(app.wailsCtx, "Room left status: %s", resp.GetStatus().String())

	return resp.GetStatus() == pb.ResponseStatus_Ok
}
