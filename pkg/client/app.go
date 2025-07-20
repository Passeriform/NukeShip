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

	"github.com/looplab/fsm"

	"passeriform.com/nukeship/internal/client"
	"passeriform.com/nukeship/internal/game"
	"passeriform.com/nukeship/internal/pb"
)

const (
	StateChangeEvent            Event = "srv:stateChange"
	ServerConnectionChangeEvent Event = "srv:serverConnectionChange"

	connMachineFireLogPattern string = "Cannot fire event %v to connection state machine with current state %v: %v"
	roomMachineFireLogPattern string = "Cannot fire event %v to room state machine with current state %v: %v"

	treeGenDepth           int = 8
	treeGenWidth           int = 20
	treeGenVisibilityDepth int = 8
)

//nolint:gochecknoglobals,mnd // Configuration only kept at the time of first initialization.
var KeepAliveClientParameters = keepalive.ClientParameters{
	Time:    30 * time.Second,
	Timeout: 10 * time.Second,
}

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
	app.stateMachine = client.NewRoomStateFSM(fsm.Callbacks{
		"enter_" + client.RoomStateInGame.String(): func(_ context.Context, _ *fsm.Event) {
			tree := game.NewFsTree("C:\\Windows", game.TreeGenOptions{
				Ignore:          game.DefaultTreeGenIgnores[:],
				VisibilityDepth: treeGenVisibilityDepth,
				Depth:           treeGenDepth,
				Width:           treeGenWidth,
			})

			app.publishGameState(wailsCtx, configCtx, &tree)
		},
		"enter_state": func(_ context.Context, e *fsm.Event) {
			runtime.EventsEmit(
				wailsCtx,
				string(StateChangeEvent),
				client.MustParseRoomState(e.Dst),
			)
		},
	})

	app.connMachine = client.NewConnectionFSM(fsm.Callbacks{
		"enter_state": func(_ context.Context, e *fsm.Event) {
			runtime.EventsEmit(
				wailsCtx,
				string(ServerConnectionChangeEvent),
				e.Dst == client.ConnectionStateConnected.String(),
			)
		},
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
		if err := app.connMachine.Event(wailsCtx, client.LocalEventDisconnected.String()); err != nil {
			runtime.LogErrorf(
				wailsCtx,
				connMachineFireLogPattern,
				client.LocalEventDisconnected.String(),
				app.connMachine.Current(),
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

	if err := app.connMachine.Event(wailsCtx, client.LocalEventConnected.String()); err != nil {
		runtime.LogErrorf(
			wailsCtx,
			connMachineFireLogPattern,
			client.LocalEventConnected.String(),
			app.connMachine.Current(),
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

		if err := app.stateMachine.Event(wailsCtx, update.GetType().String()); err != nil {
			runtime.LogErrorf(
				wailsCtx,
				roomMachineFireLogPattern,
				update.GetType().String(),
				app.stateMachine.Current(),
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
		connMachine:  client.ConnectionFSM{FSM: nil},
		stateMachine: client.RoomStateFSM{FSM: nil},
	}

	return app
}

func (app *WailsApp) GetAppState() client.RoomState {
	return client.MustParseRoomState(app.stateMachine.Current())
}

func (app *WailsApp) GetConnectionState() bool {
	return app.connMachine.Current() == client.ConnectionStateConnected.String()
}

func (app *WailsApp) UpdateReady(ready bool) (bool, error) {
	var event client.LocalEvent
	if ready {
		event = client.LocalEventSelfReady
	} else {
		event = client.LocalEventSelfRevertedReady
	}

	rollback, err := app.stateMachine.EventWithRollback(context.Background(), event.String())
	if err != nil {
		runtime.LogErrorf(
			app.wailsCtx,
			roomMachineFireLogPattern,
			event.String(),
			app.stateMachine.Current(),
			err,
		)
	}

	unaryCtx, cancel := client.NewUnaryContext(app.configCtx)
	defer cancel()

	// TODO: Use error codes middleware to handle RPC errors properly.
	resp, err := app.RoomClient.UpdateReady(unaryCtx, &pb.UpdateReadyRequest{Ready: ready})
	if err != nil {
		runtime.LogErrorf(app.wailsCtx, "Could not update ready state: %v", err)

		rollback()

		return false, fmt.Errorf("could not update ready state: %w", err)
	}

	if resp.GetStatus() == pb.ResponseStatus_NoRoomJoinedYet {
		runtime.LogError(app.wailsCtx, "Unable to ready as the room is invalid")

		rollback()

		return false, fmt.Errorf("unable to ready as the room is invalid: %w", err)
	}

	runtime.LogDebugf(app.wailsCtx, "Updated ready state: %t", ready)

	return resp.GetStatus() == pb.ResponseStatus_Ok, nil
}

func (app *WailsApp) CreateRoom() (string, error) {
	rollback, err := app.stateMachine.EventWithRollback(
		context.Background(),
		client.LocalEventSelfJoined.String(),
	)
	if err != nil {
		runtime.LogErrorf(
			app.wailsCtx,
			roomMachineFireLogPattern,
			client.LocalEventSelfJoined.String(),
			app.stateMachine.Current(),
			err,
		)
	}

	unaryCtx, cancel := client.NewUnaryContext(app.configCtx)
	defer cancel()

	resp, err := app.RoomClient.CreateRoom(unaryCtx, &pb.CreateRoomRequest{})
	if err != nil {
		runtime.LogErrorf(app.wailsCtx, "Could not create room: %v", err)

		rollback()

		return "", fmt.Errorf("could not create room: %w", err)
	}

	runtime.LogDebugf(app.wailsCtx, "Room created: %s", resp.GetRoomId())

	return resp.GetRoomId(), nil
}

func (app *WailsApp) JoinRoom(roomCode string) bool {
	rollback, err := app.stateMachine.EventWithRollback(
		context.Background(),
		client.LocalEventSelfJoined.String(),
	)
	if err != nil {
		runtime.LogErrorf(
			app.wailsCtx,
			roomMachineFireLogPattern,
			client.LocalEventSelfJoined.String(),
			app.stateMachine.Current(),
			err,
		)
	}

	unaryCtx, cancel := client.NewUnaryContext(app.configCtx)
	defer cancel()

	resp, err := app.RoomClient.JoinRoom(unaryCtx, &pb.JoinRoomRequest{RoomId: roomCode})
	if err != nil {
		runtime.LogErrorf(app.wailsCtx, "Could not join room with id %v: %v", roomCode, err)

		rollback()

		return false
	}

	runtime.LogDebugf(app.wailsCtx, "Room joined status: %s", resp.GetStatus().String())

	return resp.GetStatus() == pb.ResponseStatus_Ok
}

func (app *WailsApp) LeaveRoom() bool {
	rollback, err := app.stateMachine.EventWithRollback(
		context.Background(),
		client.LocalEventSelfLeft.String(),
	)
	if err != nil {
		runtime.LogErrorf(
			app.wailsCtx,
			roomMachineFireLogPattern,
			client.LocalEventSelfLeft.String(),
			app.stateMachine.Current(),
			err,
		)
	}

	unaryCtx, cancel := client.NewUnaryContext(app.configCtx)
	defer cancel()

	resp, err := app.RoomClient.LeaveRoom(unaryCtx, &pb.LeaveRoomRequest{})
	if err != nil {
		runtime.LogErrorf(app.wailsCtx, "Could not leave room: %v", err)

		rollback()

		return false
	}

	runtime.LogDebugf(app.wailsCtx, "Room left status: %s", resp.GetStatus().String())

	return resp.GetStatus() == pb.ResponseStatus_Ok
}
