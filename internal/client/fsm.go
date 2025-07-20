package client

import (
	"context"

	"github.com/looplab/fsm"

	"passeriform.com/nukeship/internal/pb"
)

//go:generate go run github.com/abice/go-enum -f=$GOFILE --mustparse --values --output-suffix _generated
type (
	// ENUM(SelfJoined, SelfLeft, SelfReady, SelfRevertedReady, Connected, Disconnected)
	LocalEvent string
	// ENUM(Init, AwaitingOpponent, RoomFilled, AwaitingSelfReady, AwaitingOpponentReady, AwaitingGameStart, InGame, Recovery)
	RoomState string
	// ENUM(Connected, Disconnected)
	ConnectionState string
)

type (
	RoomStateFSM struct {
		*fsm.FSM
	}

	ConnectionFSM struct {
		*fsm.FSM
	}
)

func (machine RoomStateFSM) EventWithRollback(ctx context.Context, event string) (func(), error) {
	prevState := machine.Current()

	if err := machine.Event(ctx, event); err != nil {
		return nil, err
	}

	return func() {
		machine.SetState(prevState)
	}, nil
}

//nolint:funlen,revive // Allowing longer function as this contains only state machine definition.
func NewRoomStateFSM(callbacks fsm.Callbacks) RoomStateFSM {
	return RoomStateFSM{fsm.NewFSM(
		RoomStateInit.String(),
		fsm.Events{
			{
				Name: LocalEventSelfJoined.String(),
				Src:  []string{RoomStateInit.String(), RoomStateAwaitingOpponent.String()},
				Dst:  RoomStateAwaitingOpponent.String(),
			},
			{
				Name: LocalEventSelfJoined.String(),
				Src:  []string{RoomStateRoomFilled.String()},
				Dst:  RoomStateRoomFilled.String(),
			},
			{
				Name: pb.RoomServiceEvent_OpponentJoined.String(),
				Src:  []string{RoomStateAwaitingOpponent.String(), RoomStateRoomFilled.String()},
				Dst:  RoomStateRoomFilled.String(),
			},
			{Name: LocalEventSelfLeft.String(), Src: []string{
				RoomStateInit.String(),
				RoomStateAwaitingOpponent.String(),
				RoomStateRoomFilled.String(),
				RoomStateAwaitingSelfReady.String(),
				RoomStateAwaitingOpponentReady.String(),
				RoomStateAwaitingGameStart.String(),
				RoomStateInGame.String(),
			}, Dst: RoomStateInit.String()},
			{Name: pb.RoomServiceEvent_OpponentLeft.String(), Src: []string{
				RoomStateAwaitingOpponent.String(),
				RoomStateRoomFilled.String(),
				RoomStateAwaitingSelfReady.String(),
				RoomStateAwaitingOpponentReady.String(),
				RoomStateAwaitingGameStart.String(),
			}, Dst: RoomStateAwaitingGameStart.String()},
			{
				Name: LocalEventSelfReady.String(),
				Src: []string{
					RoomStateRoomFilled.String(),
					RoomStateAwaitingOpponentReady.String(),
				},
				Dst: RoomStateAwaitingOpponentReady.String(),
			},
			{
				Name: LocalEventSelfReady.String(),
				Src:  []string{RoomStateAwaitingSelfReady.String()},
				Dst:  RoomStateAwaitingGameStart.String(),
			},
			{
				Name: pb.RoomServiceEvent_OpponentReady.String(),
				Src:  []string{RoomStateRoomFilled.String(), RoomStateAwaitingSelfReady.String()},
				Dst:  RoomStateAwaitingSelfReady.String(),
			},
			{
				Name: pb.RoomServiceEvent_OpponentReady.String(),
				Src:  []string{RoomStateAwaitingOpponentReady.String()},
				Dst:  RoomStateAwaitingGameStart.String(),
			},
			{
				Name: LocalEventSelfRevertedReady.String(),
				Src: []string{
					RoomStateRoomFilled.String(),
					RoomStateAwaitingOpponentReady.String(),
				},
				Dst: RoomStateRoomFilled.String(),
			},
			{
				Name: LocalEventSelfRevertedReady.String(),
				Src:  []string{RoomStateAwaitingSelfReady.String()},
				Dst:  RoomStateAwaitingSelfReady.String(),
			},
			{
				Name: LocalEventSelfRevertedReady.String(),
				Src:  []string{RoomStateAwaitingGameStart.String()},
				Dst:  RoomStateInit.String(),
			},
			{
				Name: pb.RoomServiceEvent_OpponentRevertedReady.String(),
				Src:  []string{RoomStateRoomFilled.String(), RoomStateAwaitingSelfReady.String()},
				Dst:  RoomStateRoomFilled.String(),
			},
			{
				Name: pb.RoomServiceEvent_OpponentRevertedReady.String(),
				Src:  []string{RoomStateAwaitingOpponentReady.String()},
				Dst:  RoomStateAwaitingOpponentReady.String(),
			},
			{
				Name: pb.RoomServiceEvent_OpponentRevertedReady.String(),
				Src:  []string{RoomStateAwaitingGameStart.String()},
				Dst:  RoomStateInit.String(),
			},
			{
				Name: pb.RoomServiceEvent_GameStarted.String(),
				Src:  []string{RoomStateAwaitingGameStart.String()},
				Dst:  RoomStateInGame.String(),
			},
		},
		callbacks,
	)}
}

func NewConnectionFSM(callbacks fsm.Callbacks) ConnectionFSM {
	return ConnectionFSM{fsm.NewFSM(
		ConnectionStateDisconnected.String(),
		fsm.Events{
			{
				Name: LocalEventConnected.String(),
				Src: []string{
					ConnectionStateConnected.String(),
					ConnectionStateDisconnected.String(),
				},
				Dst: ConnectionStateConnected.String(),
			},
			{
				Name: LocalEventDisconnected.String(),
				Src: []string{
					ConnectionStateConnected.String(),
					ConnectionStateDisconnected.String(),
				},
				Dst: ConnectionStateDisconnected.String(),
			},
		},
		callbacks,
	)}
}
