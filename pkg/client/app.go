package main

import (
	"context"
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

	"github.com/passeriform/internal/client"
	"github.com/passeriform/internal/game"
	"github.com/passeriform/internal/pb"
)

const (
	StateChangeEvent            Event = "srv:stateChange"
	ServerConnectionChangeEvent Event = "srv:serverConnectionChange"

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
	configCtx  context.Context
	RoomClient pb.RoomServiceClient
	GameClient pb.GameServiceClient
	roomState  *pb.RoomState
	connected  bool
}

func (app *WailsApp) GetRoomState() *pb.RoomState {
	return app.roomState
}

func (app *WailsApp) GetConnectionState() bool {
	return app.connected
}

func (app *WailsApp) UpdateReady(ready bool) (bool, error) {
	unaryCtx, cancel := client.NewUnaryContext(app.configCtx)
	defer cancel()

	// TODO: Use error codes middleware to handle RPC errors properly.
	resp, err := app.RoomClient.UpdateReady(unaryCtx, &pb.UpdateReadyRequest{Ready: ready})
	if err != nil {
		runtime.LogErrorf(app.wailsCtx, "Could not update ready state: %v", err)

		return false, fmt.Errorf("could not update ready state: %w", err)
	}

	if resp.GetStatus() == pb.ResponseStatus_NoRoomJoinedYet {
		runtime.LogError(app.wailsCtx, "Unable to ready as the room is invalid")

		return false, fmt.Errorf("unable to ready as the room is invalid: %w", err)
	}

	runtime.LogDebugf(app.wailsCtx, "Updated ready state: %t", ready)

	return resp.GetStatus() == pb.ResponseStatus_Ok, nil
}

func (app *WailsApp) CreateRoom(roomType pb.RoomType) (string, error) {
	unaryCtx, cancel := client.NewUnaryContext(app.configCtx)
	defer cancel()

	resp, err := app.RoomClient.CreateRoom(
		unaryCtx,
		&pb.CreateRoomRequest{RoomType: processRoomType(roomType)},
	)
	if err != nil {
		runtime.LogErrorf(app.wailsCtx, "Could not create room: %v", err)

		return "", fmt.Errorf("could not create room: %w", err)
	}

	runtime.LogDebugf(app.wailsCtx, "Room created: %s", resp.GetRoomId())

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

	return resp.GetStatus() == pb.ResponseStatus_Ok
}

func processRoomType(roomType pb.RoomType) pb.RoomType {
	if Config.DebugRoom {
		return pb.RoomType_Debug
	}

	return roomType
}

func newWailsApp() *WailsApp {
	app := &WailsApp{
		wailsCtx:   nil,
		configCtx:  nil,
		RoomClient: nil,
		GameClient: nil,
		roomState:  nil,
		connected:  false,
	}

	return app
}

//nolint:fatcontext // Wails requires the context to be stored within the app struct to provide bindings.
func (app *WailsApp) setAppContext(wailsCtx, configCtx context.Context) {
	app.wailsCtx = wailsCtx
	app.configCtx = configCtx
}

func (app *WailsApp) initGrpcClients() {
	var creds credentials.TransportCredentials

	if Config.EnableTLS {
		creds = credentials.NewClientTLSFromCert(nil, "")
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

func (app *WailsApp) connect(wailsCtx, configCtx context.Context) {
	defer func() {
		app.connected = false
		runtime.EventsEmit(
			wailsCtx,
			string(ServerConnectionChangeEvent),
			app.connected,
		)
	}()

	streamCtx, cancel := client.NewStreamContext(configCtx)
	defer cancel()

	streamClient, err := app.RoomClient.SubscribeMessages(streamCtx, &pb.SubscribeMessagesRequest{})
	if err != nil {
		runtime.LogErrorf(wailsCtx, "Subscription to server messages failed: %v", err)
		return
	}

	app.connected = true
	runtime.EventsEmit(
		wailsCtx,
		string(ServerConnectionChangeEvent),
		app.connected,
	)

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

		if update.GetType() == pb.RoomState_InGame {
			tree := game.NewFsTree("C:\\Windows", game.TreeGenOptions{
				Ignore:          game.DefaultTreeGenIgnores[:],
				VisibilityDepth: treeGenVisibilityDepth,
				Depth:           treeGenDepth,
				Width:           treeGenWidth,
			})

			app.publishGameState(wailsCtx, configCtx, &tree)
		}

		roomType := update.GetType()

		app.roomState = &roomType

		runtime.EventsEmit(
			wailsCtx,
			string(StateChangeEvent),
			update.GetType(),
		)
	}
}
