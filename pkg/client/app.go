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

	"github.com/wailsapp/wails/v3/pkg/application"

	"github.com/Gurpartap/statemachine-go"

	"passeriform.com/nukeship/internal/client"
	"passeriform.com/nukeship/internal/pb"
)

//go:generate go run github.com/abice/go-enum -f=$GOFILE --mustparse --values --output-suffix _generated
type (
	// ENUM(srv:RoomStateChange, srv:ServerConnectionChange)
	Event string
)

type WailsRoomService struct {
	//nolint:containedctx // Wails enforces usage of contexts within structs for binding.
	grpcCtx      context.Context
	Client       pb.RoomServiceClient
	emit         func(name string, data ...any)
	stateMachine *client.RoomStateFSM
	connMachine  *client.ConnectionFSM
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

func (srv *WailsRoomService) connect(ctx context.Context) {
	defer func() {
		srv.connMachine.Fire(client.ClientMessageDISCONNECTED.String())
	}()

	streamCtx, cancel := client.NewStreamContext(ctx)
	defer cancel()

	streamClient, err := srv.Client.SubscribeMessages(streamCtx, &pb.SubscribeMessagesRequest{})
	if err != nil {
		log.Printf("Subscription to server messages failed: %v", err)

		return
	}

	srv.connMachine.Fire(client.ClientMessageCONNECTED.String())

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

		srv.stateMachine.Fire(update.GetType().String())
	}
}

func NewWailsRoomService(grpcCtx context.Context) *WailsRoomService {
	return &WailsRoomService{
		grpcCtx:      grpcCtx,
		Client:       nil,
		emit:         nil,
		stateMachine: nil,
		connMachine:  nil,
	}
}

func (srv *WailsRoomService) setEmitter(emit func(name string, data ...any)) {
	srv.emit = emit
}

func (srv *WailsRoomService) OnStartup(_ context.Context, _ application.ServiceOptions) error {
	c, err := newClient(srv.grpcCtx)
	if err != nil {
		log.Panicf("Cannot create new grpc client: %v", err)
		return err
	}

	srv.Client = c

	srv.stateMachine = client.NewRoomStateFSM(func(t statemachine.Transition) {
		srv.emit(EventSrvRoomStateChange.String(), client.MustParseRoomState(t.To()))
	})

	srv.connMachine = client.NewConnectionFSM(func(t statemachine.Transition) {
		srv.emit(EventSrvServerConnectionChange.String(), t.To() == client.ConnectionStateCONNECTED.String())
	})

	go srv.connect(srv.grpcCtx)

	return nil
}

func (srv *WailsRoomService) GetAllEvents() []Event {
	return EventValues()
}

func (srv *WailsRoomService) GetRoomState() client.RoomState {
	return client.MustParseRoomState(srv.stateMachine.GetState())
}

func (srv *WailsRoomService) GetConnectionState() bool {
	return srv.connMachine.GetState() == client.ConnectionStateCONNECTED.String()
}

func (srv *WailsRoomService) UpdateReady(ready bool) (bool, error) {
	unaryCtx, cancel := client.NewUnaryContext(srv.grpcCtx)
	defer cancel()

	// TODO: Use error codes middleware to handle RPC errors properly.
	resp, err := srv.Client.UpdateReady(unaryCtx, &pb.UpdateReadyRequest{Ready: ready})
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
		srv.stateMachine.Fire(client.ClientMessageSELFREVERTEDREADY.String())

		return resp.GetStatus() == pb.ResponseStatus_OK, nil
	}

	srv.stateMachine.Fire(client.ClientMessageSELFREADY.String())

	return resp.GetStatus() == pb.ResponseStatus_OK, nil
}

func (srv *WailsRoomService) CreateRoom() (string, error) {
	unaryCtx, cancel := client.NewUnaryContext(srv.grpcCtx)
	defer cancel()

	resp, err := srv.Client.CreateRoom(unaryCtx, &pb.CreateRoomRequest{})
	if err != nil {
		log.Printf("Could not create room: %v", err)

		return "", err
	}

	log.Printf("Room created: %s", resp.GetRoomId())

	srv.stateMachine.Fire(client.ClientMessageSELFJOINED.String())

	return resp.GetRoomId(), nil
}

func (srv *WailsRoomService) JoinRoom(roomCode string) bool {
	unaryCtx, cancel := client.NewUnaryContext(srv.grpcCtx)
	defer cancel()

	resp, err := srv.Client.JoinRoom(unaryCtx, &pb.JoinRoomRequest{RoomId: roomCode})
	if err != nil {
		log.Printf("Could not join room with id %v: %v", roomCode, err)

		return false
	}

	log.Printf("Room joined status: %s", resp.GetStatus().String())

	srv.stateMachine.Fire(client.ClientMessageSELFJOINED.String())

	return resp.GetStatus() == pb.ResponseStatus_OK
}

func (srv *WailsRoomService) LeaveRoom() bool {
	unaryCtx, cancel := client.NewUnaryContext(srv.grpcCtx)
	defer cancel()

	resp, err := srv.Client.LeaveRoom(unaryCtx, &pb.LeaveRoomRequest{})
	if err != nil {
		log.Printf("Could not leave room: %v", err)

		return false
	}

	log.Printf("Room left status: %s", resp.GetStatus().String())

	srv.stateMachine.Fire(client.ClientMessageSELFLEFT.String())

	return resp.GetStatus() == pb.ResponseStatus_OK
}
